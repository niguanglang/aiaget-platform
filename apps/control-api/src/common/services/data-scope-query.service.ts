import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { DataScopeResourceType, DataScopeType, RoleDataScopeValue } from '@aiaget/shared-types';

import { PrismaService } from '../../prisma/prisma.service';
import { ResourceAccessService } from './resource-access.service';
import type { AuthenticatedUser } from '../types/request-context';

const DEFAULT_SCOPE_VALUE: RoleDataScopeValue = {
  department_ids: [],
  user_ids: [],
  resource_ids: [],
  include_children: false,
};

export interface DataScopeQueryResult<TWhere> {
  where: TWhere | null;
  applied: boolean;
  reason: string;
}

export function mergeDataScopeWhere<TWhere extends { AND?: TWhere | TWhere[] }>(
  where: TWhere,
  dataScopeWhere: TWhere | null,
) {
  if (!dataScopeWhere) return;

  const current = where.AND;
  const currentItems = Array.isArray(current) ? current : current ? [current] : [];
  where.AND = [...currentItems, dataScopeWhere] as TWhere[];
}

@Injectable()
export class DataScopeQueryService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ResourceAccessService) private readonly resourceAccess: ResourceAccessService,
  ) {}

  async buildWhere<TWhere>(
    user: AuthenticatedUser,
    resourceType: DataScopeResourceType,
  ): Promise<DataScopeQueryResult<TWhere>> {
    if (user.roles.includes('tenant_admin')) {
      return { where: null, applied: false, reason: '租户管理员拥有全部数据范围。' };
    }

    const roleIds = await this.resolveRoleIds(user.tenantId, user.id, user.roleIds);
    if (roleIds.length === 0) {
      return {
        where: impossibleWhere(resourceType) as TWhere,
        applied: true,
        reason: '当前用户没有生效角色，列表数据范围为空。',
      };
    }

    const scopes = await this.prisma.roleDataScope.findMany({
      where: {
        tenantId: user.tenantId,
        roleId: {
          in: roleIds,
        },
        resourceType,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (scopes.length === 0) {
      return { where: null, applied: false, reason: '该资源类型未配置数据范围，保持兼容放行。' };
    }

    const or: Array<Record<string, unknown>> = [];

    for (const scope of scopes) {
      const scopeType = normalizeScopeType(scope.scopeType);
      const scopeValue = normalizeScopeValue(scope.scopeValue);
      const fragment = await this.scopeToWhere(user, resourceType, scopeType, scopeValue);
      if (fragment === 'ALL') {
        return { where: null, applied: false, reason: `命中 ${scopeType} 数据范围，列表不过滤。` };
      }
      if (fragment) or.push(fragment);
    }

    if (or.length === 0) {
      return {
        where: impossibleWhere(resourceType) as TWhere,
        applied: true,
        reason: '所有生效数据范围均未解析出可见资源。',
      };
    }

    return {
      where: (or.length === 1 ? or[0] : { OR: or }) as TWhere,
      applied: true,
      reason: `已应用 ${or.length} 个数据范围查询条件。`,
    };
  }

  private async resolveRoleIds(tenantId: string, userId: string, currentRoleIds: string[] | undefined) {
    if (currentRoleIds && currentRoleIds.length > 0) {
      return currentRoleIds;
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        tenantId,
        userId,
        deletedAt: null,
        role: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      },
      select: {
        roleId: true,
      },
    });

    return userRoles.map((userRole) => userRole.roleId);
  }

  private async scopeToWhere(
    user: AuthenticatedUser,
    resourceType: DataScopeResourceType,
    scopeType: DataScopeType,
    scopeValue: RoleDataScopeValue,
  ): Promise<Record<string, unknown> | 'ALL' | null> {
    if (scopeType === 'ALL' || scopeType === 'TENANT') return 'ALL';

    if (scopeType === 'SELF') {
      return userOwnedWhere(resourceType, [user.id]);
    }

    if (scopeType === 'DEPT' || scopeType === 'DEPT_AND_CHILD') {
      if (!user.departmentId) return null;
      const departmentIds = scopeType === 'DEPT_AND_CHILD'
        ? await this.resourceAccess.expandDepartmentIds(user.tenantId, [user.departmentId])
        : [user.departmentId];
      const userIds = await this.resolveUserIds(user.tenantId, departmentIds);

      return scopedWhere(resourceType, userIds, departmentIds);
    }

    const explicitResourceIds = normalizeResourceIds(resourceType, scopeValue.resource_ids);
    const departmentIds = scopeValue.include_children
      ? await this.resourceAccess.expandDepartmentIds(user.tenantId, scopeValue.department_ids)
      : scopeValue.department_ids;
    const departmentUserIds = await this.resolveUserIds(user.tenantId, departmentIds);
    const userIds = Array.from(new Set([...scopeValue.user_ids, ...departmentUserIds]));

    return scopedWhere(resourceType, userIds, departmentIds, explicitResourceIds);
  }

  private async resolveUserIds(tenantId: string, departmentIds: string[]) {
    if (departmentIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        departmentId: {
          in: departmentIds,
        },
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return users.map((user) => user.id);
  }
}

function scopedWhere(
  resourceType: DataScopeResourceType,
  userIds: string[],
  departmentIds: string[],
  resourceIds: string[] = [],
): Record<string, unknown> | null {
  const fragments: Array<Record<string, unknown>> = [];
  if (resourceIds.length > 0) fragments.push({ id: { in: resourceIds } });
  const owned = userOwnedWhere(resourceType, userIds);
  if (owned) fragments.push(owned);
  const department = departmentOwnedWhere(resourceType, departmentIds);
  if (department) fragments.push(department);

  if (fragments.length === 0) return null;
  if (fragments.length === 1) return fragments[0] ?? null;

  return { OR: fragments };
}

function userOwnedWhere(resourceType: DataScopeResourceType, userIds: string[]) {
  if (userIds.length === 0) return null;

    switch (resourceType) {
    case 'AGENT':
    case 'AGENT_TEAM':
    case 'ROLE_SCENARIO':
    case 'SOLUTION_PACKAGE':
    case 'DELIVERY_REVIEW':
    case 'DELIVERY_ASSET':
    case 'CUSTOMER_SUCCESS_PLAN':
    case 'CUSTOMER_SUCCESS_ACTION':
    case 'CUSTOMER_ASSESSMENT':
    case 'PLUGIN':
    case 'KNOWLEDGE_BASE':
      return { OR: [{ ownerId: { in: userIds } }, { createdBy: { in: userIds } }, { updatedBy: { in: userIds } }] };
    case 'CHANNEL':
      return {
        OR: [
          { createdBy: { in: userIds } },
          { updatedBy: { in: userIds } },
          { agent: { ownerId: { in: userIds } } },
          { agent: { createdBy: { in: userIds } } },
          { agent: { updatedBy: { in: userIds } } },
        ],
      };
    case 'DOCUMENT':
      return { OR: [{ uploadedBy: { in: userIds } }, { createdBy: { in: userIds } }, { updatedBy: { in: userIds } }] };
    case 'TOOL':
      return { OR: [{ createdBy: { in: userIds } }, { updatedBy: { in: userIds } }] };
    case 'MODEL':
      return { OR: [{ createdBy: { in: userIds } }, { updatedBy: { in: userIds } }] };
    case 'CONVERSATION':
      return { OR: [{ userId: { in: userIds } }, { createdBy: { in: userIds } }, { updatedBy: { in: userIds } }] };
    case 'AUDIT_LOG':
      return { userId: { in: userIds } };
  }

  return null;
}

function departmentOwnedWhere(resourceType: DataScopeResourceType, departmentIds: string[]) {
  if (departmentIds.length === 0) return null;

    switch (resourceType) {
    case 'AGENT':
    case 'AGENT_TEAM':
    case 'ROLE_SCENARIO':
    case 'SOLUTION_PACKAGE':
    case 'DELIVERY_REVIEW':
    case 'DELIVERY_ASSET':
    case 'CUSTOMER_SUCCESS_PLAN':
    case 'CUSTOMER_SUCCESS_ACTION':
    case 'CUSTOMER_ASSESSMENT':
    case 'PLUGIN':
    case 'KNOWLEDGE_BASE':
      return { owner: { departmentId: { in: departmentIds } } };
    case 'CHANNEL':
      return { agent: { owner: { departmentId: { in: departmentIds } } } };
    case 'DOCUMENT':
      return {
        OR: [
          { uploader: { departmentId: { in: departmentIds } } },
          { knowledge: { owner: { departmentId: { in: departmentIds } } } },
        ],
      };
    case 'TOOL':
      return null;
    case 'MODEL':
      return null;
    case 'CONVERSATION':
      return {
        OR: [
          { user: { departmentId: { in: departmentIds } } },
          { agent: { owner: { departmentId: { in: departmentIds } } } },
        ],
      };
    case 'AUDIT_LOG':
      return { user: { departmentId: { in: departmentIds } } };
  }

  return null;
}

function impossibleWhere(resourceType: DataScopeResourceType) {
  return resourceType === 'AUDIT_LOG' ? { id: '00000000-0000-0000-0000-000000000000' } : { id: { in: [] } };
}

function normalizeResourceIds(resourceType: DataScopeResourceType, values: string[]) {
  const prefix = `${resourceType}:`;
  return Array.from(new Set(values.map((value) => value.startsWith(prefix) ? value.slice(prefix.length) : value)));
}

function normalizeScopeType(value: string): DataScopeType {
  if (
    value === 'ALL' ||
    value === 'TENANT' ||
    value === 'DEPT' ||
    value === 'DEPT_AND_CHILD' ||
    value === 'SELF' ||
    value === 'CUSTOM'
  ) {
    return value;
  }

  return 'SELF';
}

function normalizeScopeValue(value: Prisma.JsonValue | null): RoleDataScopeValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULT_SCOPE_VALUE };
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
