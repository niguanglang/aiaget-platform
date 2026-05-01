import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  DataScopeOverview,
  DataScopePreviewResult,
  DataScopeResourceType,
  DataScopeType,
  DepartmentSummary,
  RoleDataScopeDetail,
  RoleDataScopeItem,
  RoleDataScopeValue,
  RoleListItem,
  UserListItem,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import {
  DATA_SCOPE_RESOURCE_DEFINITIONS,
  DATA_SCOPE_RESOURCE_LABELS,
  DATA_SCOPE_RESOURCE_TYPES,
  DATA_SCOPE_TYPE_LABELS,
  DATA_SCOPE_TYPES,
} from './data-scope.constants';
import type { ListDataScopesDto } from './dto/list-data-scopes.dto';
import type { PreviewDataScopeDto } from './dto/preview-data-scope.dto';
import type { ReplaceRoleDataScopesDto } from './dto/replace-role-data-scopes.dto';

const DEFAULT_SCOPE_VALUE: RoleDataScopeValue = {
  department_ids: [],
  user_ids: [],
  resource_ids: [],
  include_children: false,
};

const roleInclude = {
  rolePermissions: {
    where: {
      deletedAt: null,
      permission: {
        deletedAt: null,
      },
    },
  },
  roleMenus: {
    where: {
      deletedAt: null,
      menu: {
        deletedAt: null,
      },
    },
  },
  userRoles: {
    where: {
      deletedAt: null,
      user: {
        deletedAt: null,
      },
    },
  },
} satisfies Prisma.RoleInclude;

type RoleRecord = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;
type ScopeRecord = Prisma.RoleDataScopeGetPayload<{ include: { role: true } }>;
type DepartmentRecord = Prisma.DepartmentGetPayload<object>;
type UserRecord = Prisma.UserGetPayload<{ include: { department: true; userRoles: { include: { role: true } } } }>;

@Injectable()
export class DataScopesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<DataScopeOverview> {
    const [roleCount, scopes] = await this.prisma.$transaction([
      this.prisma.role.count({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        select: {
          roleId: true,
          scopeType: true,
          status: true,
        },
      }),
    ]);

    const activeScopes = scopes.filter((scope) => scope.status === 'ACTIVE');
    const configuredRoleIds = new Set(activeScopes.map((scope) => scope.roleId));

    return {
      role_count: roleCount,
      configured_role_count: configuredRoleIds.size,
      scope_count: activeScopes.length,
      custom_scope_count: activeScopes.filter((scope) => scope.scopeType === 'CUSTOM').length,
      all_scope_count: activeScopes.filter((scope) => scope.scopeType === 'ALL').length,
      tenant_scope_count: activeScopes.filter((scope) => scope.scopeType === 'TENANT').length,
      self_scope_count: activeScopes.filter((scope) => scope.scopeType === 'SELF').length,
      dept_scope_count: activeScopes.filter((scope) => scope.scopeType === 'DEPT' || scope.scopeType === 'DEPT_AND_CHILD').length,
      resource_types: DATA_SCOPE_RESOURCE_DEFINITIONS,
    };
  }

  async list(currentUser: AuthenticatedUser, query: ListDataScopesDto = {}): Promise<RoleDataScopeItem[]> {
    const where: Prisma.RoleDataScopeWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
      role: {
        deletedAt: null,
      },
    };

    if (query.role_id) where.roleId = query.role_id;
    if (query.resource_type) where.resourceType = normalizeResourceType(query.resource_type);
    if (query.scope_type) where.scopeType = normalizeScopeType(query.scope_type);
    if (query.status) where.status = query.status;

    const scopes = await this.prisma.roleDataScope.findMany({
      where,
      include: {
        role: true,
      },
      orderBy: [
        {
          role: {
            name: 'asc',
          },
        },
        {
          resourceType: 'asc',
        },
      ],
    });

    return scopes.map((scope) => this.mapScope(scope));
  }

  async getRoleScopes(currentUser: AuthenticatedUser, roleId: string): Promise<RoleDataScopeDetail> {
    const role = await this.ensureRole(currentUser.tenantId, roleId);
    await this.ensureRoleResourceScopes(currentUser, role);

    const scopes = await this.prisma.roleDataScope.findMany({
      where: {
        tenantId: currentUser.tenantId,
        roleId,
        deletedAt: null,
      },
      include: {
        role: true,
      },
      orderBy: {
        resourceType: 'asc',
      },
    });

    return {
      role: this.mapRole(role),
      scopes: sortScopes(scopes.map((scope) => this.mapScope(scope))),
    };
  }

  async replaceRoleScopes(
    currentUser: AuthenticatedUser,
    roleId: string,
    dto: ReplaceRoleDataScopesDto,
  ): Promise<RoleDataScopeDetail> {
    const role = await this.ensureRole(currentUser.tenantId, roleId);
    if (role.isSystem && role.code === 'tenant_admin') {
      throw new BadRequestException('Tenant admin data scopes are managed by seed data');
    }

    const normalizedScopes = dto.scopes.map((scope) => ({
      resourceType: normalizeResourceType(scope.resource_type),
      scopeType: normalizeScopeType(scope.scope_type),
      scopeValue: normalizeScopeValue(scope.scope_value),
      status: scope.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    }));

    const resourceTypes = normalizedScopes.map((scope) => scope.resourceType);
    if (new Set(resourceTypes).size !== resourceTypes.length) {
      throw new BadRequestException('Duplicate resource_type values are not allowed');
    }

    for (const scope of normalizedScopes) {
      await this.validateScopeValue(currentUser.tenantId, scope.scopeValue);
    }

    await this.prisma.$transaction([
      this.prisma.roleDataScope.updateMany({
        where: {
          tenantId: currentUser.tenantId,
          roleId,
          deletedAt: null,
          resourceType: {
            notIn: resourceTypes,
          },
        },
        data: {
          deletedAt: new Date(),
          status: 'DELETED',
          updatedBy: currentUser.id,
        },
      }),
      ...normalizedScopes.map((scope) =>
        this.prisma.roleDataScope.upsert({
          where: {
            tenantId_roleId_resourceType: {
              tenantId: currentUser.tenantId,
              roleId,
              resourceType: scope.resourceType,
            },
          },
          create: {
            tenantId: currentUser.tenantId,
            roleId,
            resourceType: scope.resourceType,
            scopeType: scope.scopeType,
            scopeValue: toJson(scope.scopeValue),
            status: scope.status,
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
          },
          update: {
            scopeType: scope.scopeType,
            scopeValue: toJson(scope.scopeValue),
            status: scope.status,
            deletedAt: null,
            updatedBy: currentUser.id,
          },
        }),
      ),
    ]);

    return this.getRoleScopes(currentUser, roleId);
  }

  async preview(currentUser: AuthenticatedUser, dto: PreviewDataScopeDto): Promise<DataScopePreviewResult> {
    const role = await this.ensureRole(currentUser.tenantId, dto.role_id);
    const resourceType = normalizeResourceType(dto.resource_type);
    const scopeType = normalizeScopeType(dto.scope_type);
    const scopeValue = normalizeScopeValue(dto.scope_value);
    await this.validateScopeValue(currentUser.tenantId, scopeValue);

    const departments = await this.resolveDepartmentsForPreview(currentUser.tenantId, currentUser.id, scopeType, scopeValue);
    const users = await this.resolveUsersForPreview(currentUser.tenantId, currentUser.id, scopeType, scopeValue, departments);

    return {
      role_id: role.id,
      role_name: role.name,
      resource_type: resourceType,
      scope_type: scopeType,
      scope_label: DATA_SCOPE_TYPE_LABELS[scopeType],
      departments: departments.map(mapDepartment),
      users: users.map((user) => mapUser(user)),
      department_count: departments.length,
      user_count: users.length,
      note: buildPreviewNote(scopeType, departments.length, users.length),
    };
  }

  private async ensureRoleResourceScopes(currentUser: AuthenticatedUser, role: RoleRecord) {
    await this.prisma.$transaction(
      DATA_SCOPE_RESOURCE_TYPES.map((resourceType) =>
        this.prisma.roleDataScope.upsert({
          where: {
            tenantId_roleId_resourceType: {
              tenantId: currentUser.tenantId,
              roleId: role.id,
              resourceType,
            },
          },
          create: {
            tenantId: currentUser.tenantId,
            roleId: role.id,
            resourceType,
            scopeType: role.code === 'tenant_admin' ? 'ALL' : role.code === 'tenant_viewer' ? 'SELF' : 'TENANT',
            scopeValue: toJson(DEFAULT_SCOPE_VALUE),
            status: 'ACTIVE',
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
          },
          update: {},
        }),
      ),
    );
  }

  private async ensureRole(tenantId: string, roleId: string): Promise<RoleRecord> {
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

  private async validateScopeValue(tenantId: string, value: RoleDataScopeValue) {
    if (value.department_ids.length > 0) {
      const departmentCount = await this.prisma.department.count({
        where: {
          tenantId,
          id: {
            in: value.department_ids,
          },
          deletedAt: null,
        },
      });

      if (departmentCount !== value.department_ids.length) {
        throw new BadRequestException('Some department ids are invalid');
      }
    }

    if (value.user_ids.length > 0) {
      const userCount = await this.prisma.user.count({
        where: {
          tenantId,
          id: {
            in: value.user_ids,
          },
          deletedAt: null,
        },
      });

      if (userCount !== value.user_ids.length) {
        throw new BadRequestException('Some user ids are invalid');
      }
    }
  }

  private async resolveDepartmentsForPreview(
    tenantId: string,
    currentUserId: string,
    scopeType: DataScopeType,
    scopeValue: RoleDataScopeValue,
  ): Promise<DepartmentRecord[]> {
    if (scopeType === 'ALL' || scopeType === 'TENANT') {
      return this.prisma.department.findMany({
        where: {
          tenantId,
          deletedAt: null,
        },
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

    if (scopeType === 'CUSTOM') {
      const departmentIds = scopeValue.include_children
        ? await this.expandDepartmentIds(tenantId, scopeValue.department_ids)
        : scopeValue.department_ids;

      if (departmentIds.length === 0) return [];

      return this.prisma.department.findMany({
        where: {
          tenantId,
          id: {
            in: departmentIds,
          },
          deletedAt: null,
        },
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

    const currentUser = await this.prisma.user.findFirst({
      where: {
        tenantId,
        id: currentUserId,
        deletedAt: null,
      },
      select: {
        departmentId: true,
      },
    });
    if (!currentUser?.departmentId || scopeType === 'SELF') return [];

    const departmentIds = scopeType === 'DEPT_AND_CHILD'
      ? await this.expandDepartmentIds(tenantId, [currentUser.departmentId])
      : [currentUser.departmentId];

    return this.prisma.department.findMany({
      where: {
        tenantId,
        id: {
          in: departmentIds,
        },
        deletedAt: null,
      },
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

  private async resolveUsersForPreview(
    tenantId: string,
    currentUserId: string,
    scopeType: DataScopeType,
    scopeValue: RoleDataScopeValue,
    departments: DepartmentRecord[],
  ): Promise<UserRecord[]> {
    const baseWhere: Prisma.UserWhereInput = {
      tenantId,
      deletedAt: null,
      status: {
        not: 'DELETED',
      },
    };

    if (scopeType === 'SELF') {
      baseWhere.id = currentUserId;
    } else if (scopeType === 'CUSTOM') {
      const departmentIds = departments.map((department) => department.id);
      const userOr: Prisma.UserWhereInput[] = [];
      if (scopeValue.user_ids.length > 0) {
        userOr.push({
          id: {
            in: scopeValue.user_ids,
          },
        });
      }
      if (departmentIds.length > 0) {
        userOr.push({
          departmentId: {
            in: departmentIds,
          },
        });
      }
      if (userOr.length === 0) return [];
      baseWhere.OR = userOr;
    } else if (scopeType === 'DEPT' || scopeType === 'DEPT_AND_CHILD') {
      const departmentIds = departments.map((department) => department.id);
      if (departmentIds.length === 0) return [];
      baseWhere.departmentId = {
        in: departmentIds,
      };
    }

    return this.prisma.user.findMany({
      where: baseWhere,
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
      take: 200,
    });
  }

  private async expandDepartmentIds(tenantId: string, departmentIds: string[]) {
    if (departmentIds.length === 0) return [];

    const departments = await this.prisma.department.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        parentId: true,
      },
    });
    const childrenByParent = new Map<string, string[]>();
    for (const department of departments) {
      if (!department.parentId) continue;
      childrenByParent.set(department.parentId, [
        ...(childrenByParent.get(department.parentId) ?? []),
        department.id,
      ]);
    }

    const output = new Set<string>();
    const visit = (id: string) => {
      output.add(id);
      for (const childId of childrenByParent.get(id) ?? []) {
        visit(childId);
      }
    };
    departmentIds.forEach(visit);

    return Array.from(output);
  }

  private mapRole(role: RoleRecord): RoleListItem {
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

  private mapScope(scope: ScopeRecord): RoleDataScopeItem {
    const scopeValue = normalizeScopeValue(scope.scopeValue);
    const scopeType = normalizeScopeType(scope.scopeType);
    const resourceType = normalizeResourceType(scope.resourceType);

    return {
      id: scope.id,
      tenant_id: scope.tenantId,
      role_id: scope.roleId,
      role_code: scope.role.code,
      role_name: scope.role.name,
      resource_type: resourceType,
      resource_name: DATA_SCOPE_RESOURCE_LABELS[resourceType] ?? resourceType,
      scope_type: scopeType,
      scope_label: DATA_SCOPE_TYPE_LABELS[scopeType],
      scope_value: scopeValue,
      status: scope.status as RoleDataScopeItem['status'],
      department_count: scopeValue.department_ids.length,
      user_count: scopeValue.user_ids.length,
      resource_count: scopeValue.resource_ids.length,
      updated_at: scope.updatedAt.toISOString(),
    };
  }
}

function normalizeScopeType(value: string): DataScopeType {
  if (!DATA_SCOPE_TYPES.includes(value as DataScopeType)) {
    throw new BadRequestException('Invalid scope_type');
  }

  return value as DataScopeType;
}

function normalizeResourceType(value: string): DataScopeResourceType {
  if (!DATA_SCOPE_RESOURCE_TYPES.includes(value as DataScopeResourceType)) {
    throw new BadRequestException('Invalid resource_type');
  }

  return value as DataScopeResourceType;
}

function normalizeScopeValue(value: unknown): RoleDataScopeValue {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SCOPE_VALUE };
  const raw = value as Partial<RoleDataScopeValue>;

  return {
    department_ids: normalizeStringArray(raw.department_ids),
    user_ids: normalizeStringArray(raw.user_ids),
    resource_ids: normalizeStringArray(raw.resource_ids),
    include_children: Boolean(raw.include_children),
  };
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)));
}

function toJson(value: RoleDataScopeValue): Prisma.InputJsonObject {
  return {
    department_ids: value.department_ids,
    user_ids: value.user_ids,
    resource_ids: value.resource_ids,
    include_children: value.include_children,
  };
}

function sortScopes(scopes: RoleDataScopeItem[]) {
  const order = new Map(DATA_SCOPE_RESOURCE_TYPES.map((resourceType, index) => [resourceType, index]));

  return [...scopes].sort(
    (left, right) => (order.get(left.resource_type) ?? 999) - (order.get(right.resource_type) ?? 999),
  );
}

function mapDepartment(department: DepartmentRecord): DepartmentSummary {
  return {
    id: department.id,
    code: department.code,
    name: department.name,
    status: department.status as DepartmentSummary['status'],
  };
}

function mapUser(user: UserRecord): UserListItem {
  return {
    id: user.id,
    tenant_id: user.tenantId,
    department_id: user.departmentId,
    email: user.email,
    name: user.name,
    status: user.status as UserListItem['status'],
    department: user.department ? mapDepartment(user.department) : null,
    roles: user.userRoles.map((userRole) => ({
      id: userRole.role.id,
      code: userRole.role.code,
      name: userRole.role.name,
    })),
    last_login_at: user.lastLoginAt?.toISOString() ?? null,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

function buildPreviewNote(scopeType: DataScopeType, departmentCount: number, userCount: number) {
  if (scopeType === 'ALL') return `预览基于当前租户数据，实际授权会跨租户平台管理员场景扩展。当前命中 ${departmentCount} 个部门、${userCount} 个用户。`;
  if (scopeType === 'TENANT') return `本租户范围会命中当前租户内 ${departmentCount} 个部门、${userCount} 个用户。`;
  if (scopeType === 'SELF') return `本人范围仅命中当前登录用户，适用于普通成员查看自己的数据。`;
  if (scopeType === 'CUSTOM') return `自定义范围按已选部门、用户和是否包含子部门计算，当前命中 ${departmentCount} 个部门、${userCount} 个用户。`;

  return `部门范围按当前登录用户所在部门计算，当前命中 ${departmentCount} 个部门、${userCount} 个用户。`;
}
