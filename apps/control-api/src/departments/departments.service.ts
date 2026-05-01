import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  DepartmentDetail,
  DepartmentLeaderSummary,
  DepartmentListItem,
  DepartmentOverview,
  DepartmentSummary,
  DepartmentTreeItem,
  PaginatedResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateDepartmentDto } from './dto/create-department.dto';
import type { ListDepartmentsDto } from './dto/list-departments.dto';
import type { UpdateDepartmentDto } from './dto/update-department.dto';

const MAX_DEPARTMENT_LEVEL = 6;

const departmentInclude = {
  parent: true,
  children: {
    where: {
      deletedAt: null,
    },
  },
  leader: true,
  members: {
    where: {
      deletedAt: null,
    },
    include: {
      department: true,
      userRoles: {
        where: {
          deletedAt: null,
        },
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  },
} satisfies Prisma.DepartmentInclude;

type DepartmentRecord = Prisma.DepartmentGetPayload<{ include: typeof departmentInclude }>;

@Injectable()
export class DepartmentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<DepartmentOverview> {
    const [departments, memberCount] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        select: {
          parentId: true,
          status: true,
        },
      }),
      this.prisma.user.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          departmentId: {
            not: null,
          },
        },
      }),
    ]);

    return {
      total: departments.length,
      active_count: departments.filter((department) => department.status === 'ACTIVE').length,
      disabled_count: departments.filter((department) => department.status === 'DISABLED').length,
      root_count: departments.filter((department) => !department.parentId).length,
      member_count: memberCount,
    };
  }

  async list(
    currentUser: AuthenticatedUser,
    query: ListDepartmentsDto,
  ): Promise<PaginatedResult<DepartmentListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 100);
    const where = this.buildWhere(currentUser.tenantId, query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        include: departmentInclude,
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.department.count({ where }),
    ]);
    const allDepartments = await this.loadAllDepartments(currentUser.tenantId);
    const levelMap = buildLevelMap(allDepartments);

    return {
      items: items.map((department) => this.mapDepartmentListItem(department, levelMap.get(department.id) ?? 1)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async tree(currentUser: AuthenticatedUser): Promise<DepartmentTreeItem[]> {
    const departments = await this.loadAllDepartments(currentUser.tenantId);
    const levelMap = buildLevelMap(departments);

    return buildTree(
      departments.map((department) => this.mapDepartmentListItem(department, levelMap.get(department.id) ?? 1)),
    );
  }

  async create(currentUser: AuthenticatedUser, dto: CreateDepartmentDto): Promise<DepartmentDetail> {
    await this.ensureParent(currentUser.tenantId, dto.parent_id ?? null, null);
    const leaderUserId = await this.resolveLeaderUserId(currentUser.tenantId, dto.leader_user_id);

    try {
      const department = await this.prisma.department.create({
        data: {
          tenantId: currentUser.tenantId,
          parentId: normalizeNullable(dto.parent_id),
          name: dto.name.trim(),
          code: dto.code.trim(),
          description: normalizeNullable(dto.description),
          leaderUserId,
          sortOrder: dto.sort_order ?? 0,
          status: dto.status ?? 'ACTIVE',
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        include: departmentInclude,
      });

      return this.detailFromRecord(currentUser.tenantId, department);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A department with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<DepartmentDetail> {
    const department = await this.findDepartment(currentUser.tenantId, id);

    return this.detailFromRecord(currentUser.tenantId, department);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateDepartmentDto): Promise<DepartmentDetail> {
    await this.ensureDepartment(currentUser.tenantId, id);
    if (dto.parent_id !== undefined) {
      await this.ensureParent(currentUser.tenantId, dto.parent_id, id);
    }

    const data: Prisma.DepartmentUncheckedUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.parent_id !== undefined) data.parentId = normalizeNullable(dto.parent_id);
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = normalizeNullable(dto.description);
    if (dto.leader_user_id !== undefined) {
      data.leaderUserId = await this.resolveLeaderUserId(currentUser.tenantId, dto.leader_user_id);
    }
    if (dto.sort_order !== undefined) data.sortOrder = dto.sort_order;
    if (dto.status !== undefined) data.status = dto.status;

    const department = await this.prisma.department.update({
      where: {
        id,
      },
      data,
      include: departmentInclude,
    });

    return this.detailFromRecord(currentUser.tenantId, department);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    const department = await this.findDepartment(currentUser.tenantId, id);
    if (department.children.length > 0) {
      throw new BadRequestException('Department with child nodes cannot be deleted');
    }
    if (department.members.length > 0) {
      throw new BadRequestException('Department with members cannot be deleted');
    }

    await this.prisma.department.update({
      where: {
        id,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async setStatus(currentUser: AuthenticatedUser, id: string, status: 'ACTIVE' | 'DISABLED') {
    await this.ensureDepartment(currentUser.tenantId, id);
    const department = await this.prisma.department.update({
      where: {
        id,
      },
      data: {
        status,
        updatedBy: currentUser.id,
      },
      include: departmentInclude,
    });

    return this.detailFromRecord(currentUser.tenantId, department);
  }

  private buildWhere(tenantId: string, query: ListDepartmentsDto): Prisma.DepartmentWhereInput {
    const keyword = query.keyword?.trim();
    const where: Prisma.DepartmentWhereInput = {
      tenantId,
      deletedAt: query.status === 'DELETED' ? { not: null } : null,
    };

    if (query.status && query.status !== 'DELETED') where.status = query.status;
    if (query.parent_id) where.parentId = query.parent_id;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async loadAllDepartments(tenantId: string): Promise<DepartmentRecord[]> {
    return this.prisma.department.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: departmentInclude,
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
  }

  private async ensureDepartment(tenantId: string, id: string) {
    const department = await this.prisma.department.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }
  }

  private async findDepartment(tenantId: string, id: string): Promise<DepartmentRecord> {
    const department = await this.prisma.department.findFirst({
      where: {
        tenantId,
        id,
        deletedAt: null,
      },
      include: departmentInclude,
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  private async ensureParent(tenantId: string, parentId: string | null | undefined, currentDepartmentId: string | null) {
    const normalizedParentId = normalizeNullable(parentId);
    if (!normalizedParentId) return;
    if (currentDepartmentId && normalizedParentId === currentDepartmentId) {
      throw new BadRequestException('Department cannot be its own parent');
    }

    const parent = await this.prisma.department.findFirst({
      where: {
        tenantId,
        id: normalizedParentId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!parent) {
      throw new BadRequestException('Parent department does not exist');
    }

    const departments = await this.loadAllDepartments(tenantId);
    const childrenByParent = new Map<string, DepartmentRecord[]>();
    for (const department of departments) {
      if (!department.parentId) continue;
      childrenByParent.set(department.parentId, [
        ...(childrenByParent.get(department.parentId) ?? []),
        department,
      ]);
    }

    if (currentDepartmentId && hasDescendant(currentDepartmentId, normalizedParentId, childrenByParent)) {
      throw new BadRequestException('Department cannot be moved below its own child node');
    }

    const parentLevel = buildLevelMap(departments).get(normalizedParentId) ?? 1;
    const subtreeDepth = currentDepartmentId
      ? calculateSubtreeDepth(currentDepartmentId, childrenByParent)
      : 1;
    if (parentLevel + subtreeDepth > MAX_DEPARTMENT_LEVEL) {
      throw new BadRequestException(`Department tree supports at most ${MAX_DEPARTMENT_LEVEL} levels`);
    }
  }

  private async resolveLeaderUserId(tenantId: string, userId: string | null | undefined) {
    const normalizedUserId = normalizeNullable(userId);
    if (!normalizedUserId) return null;

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId,
        id: normalizedUserId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Leader user does not exist in the tenant');
    }

    return user.id;
  }

  private async detailFromRecord(tenantId: string, department: DepartmentRecord): Promise<DepartmentDetail> {
    const allDepartments = await this.loadAllDepartments(tenantId);
    const levelMap = buildLevelMap(allDepartments);
    const childLevel = (levelMap.get(department.id) ?? 1) + 1;
    const children = allDepartments.filter((candidate) => candidate.parentId === department.id);

    return {
      ...this.mapDepartmentListItem(department, levelMap.get(department.id) ?? 1),
      children: children.map((child) => this.mapDepartmentListItem(child, childLevel)),
      members: department.members.map((user) => ({
        id: user.id,
        tenant_id: user.tenantId,
        department_id: user.departmentId,
        email: user.email,
        name: user.name,
        status: user.status as DepartmentDetail['members'][number]['status'],
        department: user.department
          ? {
              id: user.department.id,
              code: user.department.code,
              name: user.department.name,
              status: user.department.status as DepartmentSummary['status'],
            }
          : null,
        roles: user.userRoles.map((userRole) => ({
          id: userRole.role.id,
          code: userRole.role.code,
          name: userRole.role.name,
        })),
        last_login_at: user.lastLoginAt?.toISOString() ?? null,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      })),
    };
  }

  private mapDepartmentListItem(department: DepartmentRecord, level: number): DepartmentListItem {
    return {
      id: department.id,
      tenant_id: department.tenantId,
      parent_id: department.parentId,
      parent_name: department.parent?.name ?? null,
      name: department.name,
      code: department.code,
      description: department.description,
      leader: department.leader
        ? {
            id: department.leader.id,
            email: department.leader.email,
            name: department.leader.name,
            status: department.leader.status as DepartmentLeaderSummary['status'],
          }
        : null,
      sort_order: department.sortOrder,
      status: department.status as DepartmentListItem['status'],
      level,
      child_count: department.children.length,
      member_count: department.members.length,
      created_at: department.createdAt.toISOString(),
      updated_at: department.updatedAt.toISOString(),
    };
  }
}

function normalizeNullable(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function buildTree(items: DepartmentListItem[]): DepartmentTreeItem[] {
  const nodeMap = new Map<string, DepartmentTreeItem>();
  const roots: DepartmentTreeItem[] = [];

  for (const item of items) {
    nodeMap.set(item.id, {
      ...item,
      children: [],
    });
  }

  for (const item of items) {
    const node = nodeMap.get(item.id);
    if (!node) continue;
    const parent = item.parent_id ? nodeMap.get(item.parent_id) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function buildLevelMap(departments: DepartmentRecord[]) {
  const byId = new Map(departments.map((department) => [department.id, department]));
  const output = new Map<string, number>();

  for (const department of departments) {
    output.set(department.id, calculateLevel(department, byId));
  }

  return output;
}

function calculateLevel(department: DepartmentRecord, byId: Map<string, DepartmentRecord>) {
  let level = 1;
  let parentId = department.parentId;

  while (parentId) {
    const parent = byId.get(parentId);
    if (!parent) break;
    level += 1;
    parentId = parent.parentId;
  }

  return level;
}

function hasDescendant(
  ancestorId: string,
  targetId: string,
  childrenByParent: Map<string, DepartmentRecord[]>,
): boolean {
  const children = childrenByParent.get(ancestorId) ?? [];
  for (const child of children) {
    if (child.id === targetId || hasDescendant(child.id, targetId, childrenByParent)) {
      return true;
    }
  }

  return false;
}

function calculateSubtreeDepth(departmentId: string, childrenByParent: Map<string, DepartmentRecord[]>): number {
  const children = childrenByParent.get(departmentId) ?? [];
  if (children.length === 0) return 1;

  return 1 + Math.max(...children.map((child) => calculateSubtreeDepth(child.id, childrenByParent)));
}
