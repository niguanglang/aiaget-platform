import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  DepartmentSummary,
  PaginatedResult,
  PermissionCatalogGroup,
  PermissionCatalogItem,
  RoleDetail,
  RoleListItem,
  RoleOverview,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRoleDto } from './dto/create-role.dto';
import { ListRolesDto } from './dto/list-roles.dto';
import type { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';

const roleInclude = {
  rolePermissions: {
    where: {
      deletedAt: null,
      permission: {
        deletedAt: null,
      },
    },
    include: {
      permission: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  roleMenus: {
    where: {
      deletedAt: null,
      menu: {
        deletedAt: null,
      },
    },
    include: {
      menu: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  userRoles: {
    where: {
      deletedAt: null,
      user: {
        deletedAt: null,
      },
    },
    include: {
      user: {
        include: {
          department: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.RoleInclude;

type RoleRecord = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;

const moduleLabels: Record<string, string> = {
  agent: 'Agent 中心',
  conversation: '会话中心',
  dashboard: '工作台',
  knowledge: '知识库中心',
  model: '模型中心',
  monitor: '监控中心',
  prompt: '提示词中心',
  security: '安全中心',
  storage: '文件存储',
  system: '系统管理',
  tool: '工具中心',
};

const resourceLabels: Record<string, string> = {
  agent: '智能体',
  api_key: 'API Key',
  approval: '审批',
  audit: '审计',
  base: '知识库',
  chat: '会话测试',
  config: '模型配置',
  definition: '工具定义',
  department: '部门',
  history: '会话记录',
  log: '日志',
  menu: '菜单',
  object: '存储对象',
  overview: '概览',
  role: '角色',
  rule: '安全规则',
  settings: '系统设置',
  template: '提示词模板',
  tenant: '租户',
  user: '用户',
};

@Injectable()
export class RolesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<RoleOverview> {
    const [roles, userBindingCount, permissionBindingCount, menuBindingCount] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        select: {
          status: true,
          isSystem: true,
        },
      }),
      this.prisma.userRole.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          user: {
            deletedAt: null,
          },
          role: {
            deletedAt: null,
          },
        },
      }),
      this.prisma.rolePermission.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          role: {
            deletedAt: null,
          },
          permission: {
            deletedAt: null,
          },
        },
      }),
      this.prisma.roleMenu.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          role: {
            deletedAt: null,
          },
          menu: {
            deletedAt: null,
          },
        },
      }),
    ]);

    return {
      total: roles.length,
      active_count: roles.filter((role) => role.status === 'ACTIVE').length,
      disabled_count: roles.filter((role) => role.status === 'DISABLED').length,
      system_count: roles.filter((role) => role.isSystem).length,
      custom_count: roles.filter((role) => !role.isSystem).length,
      user_binding_count: userBindingCount,
      permission_binding_count: permissionBindingCount,
      menu_binding_count: menuBindingCount,
    };
  }

  async list(
    currentUser: AuthenticatedUser,
    query: ListRolesDto = new ListRolesDto(),
  ): Promise<PaginatedResult<RoleListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 100);
    const where = this.buildWhere(currentUser.tenantId, query);

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        include: roleInclude,
        orderBy: [
          {
            isSystem: 'desc',
          },
          {
            createdAt: 'asc',
          },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      items: roles.map((role) => this.mapRoleListItem(role)),
      page,
      page_size: pageSize,
      total,
    };
  }

  async permissionCatalog(currentUser: AuthenticatedUser): Promise<PermissionCatalogGroup[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      orderBy: [
        {
          module: 'asc',
        },
        {
          resource: 'asc',
        },
        {
          action: 'asc',
        },
      ],
    });

    const moduleMap = new Map<string, Map<string, PermissionCatalogItem[]>>();
    for (const permission of permissions) {
      const resource = permission.resource || inferResource(permission.code);
      const resourceMap = moduleMap.get(permission.module) ?? new Map<string, PermissionCatalogItem[]>();
      const items = resourceMap.get(resource) ?? [];

      items.push(this.mapPermission(permission));
      resourceMap.set(resource, items);
      moduleMap.set(permission.module, resourceMap);
    }

    return Array.from(moduleMap.entries()).map(([module, resources]) => ({
      module,
      module_label: moduleLabels[module] ?? module,
      resources: Array.from(resources.entries()).map(([resource, permissions]) => ({
        resource,
        resource_label: resourceLabels[resource] ?? resource,
        permissions,
      })),
    }));
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<RoleDetail> {
    const role = await this.findRole(currentUser.tenantId, id);

    return this.mapRoleDetail(role);
  }

  async create(currentUser: AuthenticatedUser, dto: CreateRoleDto): Promise<RoleDetail> {
    const permissionIds = dto.permission_ids ?? [];
    await this.ensurePermissions(currentUser.tenantId, permissionIds);

    try {
      const role = await this.prisma.role.create({
        data: {
          tenantId: currentUser.tenantId,
          code: dto.code.trim(),
          name: dto.name.trim(),
          description: normalizeNullable(dto.description),
          status: dto.status ?? 'ACTIVE',
          isSystem: false,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
          rolePermissions: {
            createMany: {
              data: permissionIds.map((permissionId) => ({
                tenantId: currentUser.tenantId,
                permissionId,
                createdBy: currentUser.id,
                updatedBy: currentUser.id,
              })),
              skipDuplicates: true,
            },
          },
        },
        include: roleInclude,
      });

      return this.mapRoleDetail(role);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A role with this code already exists in the tenant');
      }

      throw error;
    }
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateRoleDto): Promise<RoleDetail> {
    const existingRole = await this.findRole(currentUser.tenantId, id);
    const data: Prisma.RoleUncheckedUpdateInput = {
      updatedBy: currentUser.id,
    };

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = normalizeNullable(dto.description);
    if (dto.status !== undefined) {
      if (existingRole.isSystem && dto.status === 'DISABLED') {
        throw new BadRequestException('System roles cannot be disabled');
      }
      data.status = dto.status;
    }

    const role = await this.prisma.role.update({
      where: {
        id: existingRole.id,
      },
      data,
      include: roleInclude,
    });

    return this.mapRoleDetail(role);
  }

  async remove(currentUser: AuthenticatedUser, id: string): Promise<{ success: boolean }> {
    const role = await this.findRole(currentUser.tenantId, id);
    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    if (role.userRoles.length > 0) {
      throw new BadRequestException('Role assigned to users cannot be deleted');
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          roleId: id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.roleMenu.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          roleId: id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
      this.prisma.role.update({
        where: {
          id,
        },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
    ]);

    return { success: true };
  }

  async setStatus(currentUser: AuthenticatedUser, id: string, status: 'ACTIVE' | 'DISABLED'): Promise<RoleDetail> {
    const role = await this.findRole(currentUser.tenantId, id);
    if (role.isSystem && status === 'DISABLED') {
      throw new BadRequestException('System roles cannot be disabled');
    }

    const updatedRole = await this.prisma.role.update({
      where: {
        id,
      },
      data: {
        status,
        updatedBy: currentUser.id,
      },
      include: roleInclude,
    });

    return this.mapRoleDetail(updatedRole);
  }

  async updatePermissions(
    currentUser: AuthenticatedUser,
    roleId: string,
    dto: UpdateRolePermissionsDto,
  ): Promise<RoleDetail> {
    const role = await this.findRole(currentUser.tenantId, roleId);
    if (role.isSystem && role.code === 'tenant_admin') {
      throw new BadRequestException('Tenant admin permissions are managed by seed data');
    }

    const permissionIds = Array.from(new Set(dto.permission_ids));
    await this.ensurePermissions(currentUser.tenantId, permissionIds);

    await this.prisma.$transaction([
      this.prisma.rolePermission.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          roleId,
          deletedAt: null,
          permissionId: {
            notIn: permissionIds,
          },
        },
        data: {
          deletedAt: new Date(),
          updatedBy: currentUser.id,
        },
      }),
      ...permissionIds.map((permissionId) =>
        this.prisma.rolePermission.upsert({
          where: {
            tenantId_roleId_permissionId: {
              tenantId: currentUser.tenantId,
              roleId,
              permissionId,
            },
          },
          create: {
            tenantId: currentUser.tenantId,
            roleId,
            permissionId,
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
          },
          update: {
            deletedAt: null,
            updatedBy: currentUser.id,
          },
        }),
      ),
    ]);

    return this.get(currentUser, roleId);
  }

  private buildWhere(tenantId: string, query: ListRolesDto): Prisma.RoleWhereInput {
    const keyword = query.keyword?.trim();
    const where: Prisma.RoleWhereInput = {
      tenantId,
      deletedAt: query.status === 'DELETED' ? { not: null } : null,
    };

    if (query.status && query.status !== 'DELETED') where.status = query.status;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async findRole(tenantId: string, roleId: string): Promise<RoleRecord> {
    const role = await this.prisma.role.findFirst({
      where: {
        tenantId,
        id: roleId,
        deletedAt: null,
      },
      include: roleInclude,
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  private async ensurePermissions(tenantId: string, permissionIds: string[]) {
    if (permissionIds.length === 0) return;

    const permissions = await this.prisma.permission.findMany({
      where: {
        tenantId,
        id: {
          in: permissionIds,
        },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('Some permission ids are invalid');
    }
  }

  private mapRoleDetail(role: RoleRecord): RoleDetail {
    return {
      ...this.mapRoleListItem(role),
      permissions: role.rolePermissions.map((rolePermission) => this.mapPermission(rolePermission.permission)),
      menus: role.roleMenus.map((roleMenu) => ({
        id: roleMenu.menu.id,
        code: roleMenu.menu.code,
        name: roleMenu.menu.name,
        type: roleMenu.menu.type as RoleDetail['menus'][number]['type'],
        path: roleMenu.menu.path,
        permission_code: roleMenu.menu.permissionCode,
      })),
      users: role.userRoles.map((userRole) => ({
        id: userRole.user.id,
        email: userRole.user.email,
        name: userRole.user.name,
        status: userRole.user.status as RoleDetail['users'][number]['status'],
        department: userRole.user.department
          ? {
              id: userRole.user.department.id,
              code: userRole.user.department.code,
              name: userRole.user.department.name,
              status: userRole.user.department.status as DepartmentSummary['status'],
            }
          : null,
      })),
    };
  }

  private mapRoleListItem(role: RoleRecord): RoleListItem {
    return {
      id: role.id,
      tenant_id: role.tenantId,
      code: role.code,
      name: role.name,
      description: role.description,
      status: role.status as RoleListItem['status'],
      is_system: role.isSystem,
      permission_count: role.rolePermissions.length,
      menu_count: role.roleMenus.length,
      user_count: role.userRoles.length,
      created_at: role.createdAt.toISOString(),
      updated_at: role.updatedAt.toISOString(),
    };
  }

  private mapPermission(permission: {
    id: string;
    code: string;
    name: string;
    module: string;
    resource: string;
    action: string;
  }): PermissionCatalogItem {
    return {
      id: permission.id,
      code: permission.code,
      name: permission.name,
      module: permission.module,
      resource: permission.resource || inferResource(permission.code),
      action: permission.action,
    };
  }
}

function normalizeNullable(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function inferResource(code: string) {
  const [, resource] = code.split(':');

  return resource ?? '';
}
