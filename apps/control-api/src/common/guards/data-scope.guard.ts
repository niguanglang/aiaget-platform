import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';

import type { DataScopeResourceType, DataScopeType, RoleDataScopeValue } from '@aiaget/shared-types';

import { PrismaService } from '../../prisma/prisma.service';
import { DATA_SCOPE_KEY, type DataScopeRequirement } from '../decorators/data-scope.decorator';
import { ResourceAccessService } from '../services/resource-access.service';
import { SecurityEventService } from '../services/security-event.service';
import type { RequestWithContext } from '../types/request-context';

const DEFAULT_SCOPE_VALUE: RoleDataScopeValue = {
  department_ids: [],
  user_ids: [],
  resource_ids: [],
  include_children: false,
};

@Injectable()
export class DataScopeGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ResourceAccessService) private readonly resourceAccess: ResourceAccessService,
    @Inject(SecurityEventService) private readonly securityEvents: SecurityEventService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<DataScopeRequirement>(DATA_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requirement) return true;

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Missing authenticated user');
    if (user.roles.includes('tenant_admin')) return true;

    const resourceId = resolveRequestParam(request, requirement.idParam ?? 'id');
    if (!resourceId) return true;

    const roleIds = await this.resolveRoleIds(user.tenantId, user.id, user.roleIds);
    if (roleIds.length === 0) {
      await this.securityEvents.recordDeny(request, {
        source: 'DATA_SCOPE',
        resourceType: requirement.resourceType,
        resourceId,
        reason: 'Data scope denied: user has no active roles',
      });
      throw new ForbiddenException('Data scope denied');
    }

    const scopes = await this.prisma.roleDataScope.findMany({
      where: {
        tenantId: user.tenantId,
        roleId: {
          in: roleIds,
        },
        resourceType: requirement.resourceType,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (scopes.length === 0) {
      return true;
    }

    const resource = await this.resourceAccess.getResourceAccessInfo(
      user.tenantId,
      requirement.resourceType,
      resourceId,
    );

    if (!resource) {
      return true;
    }

    const canonicalResourceId = resource.resourceId;
    for (const scope of scopes) {
      const allowed = await this.scopeAllowsResource(
        user.tenantId,
        user.id,
        user.departmentId ?? null,
        requirement.resourceType,
        canonicalResourceId,
        normalizeScopeType(scope.scopeType),
        normalizeScopeValue(scope.scopeValue),
        resource.userIds,
        resource.departmentIds,
      );

      if (allowed) return true;
    }

    await this.securityEvents.recordDeny(request, {
      source: 'DATA_SCOPE',
      resourceType: requirement.resourceType,
      resourceId: canonicalResourceId,
      reason: 'Data scope denied',
      resource: {
        id: canonicalResourceId,
        type: requirement.resourceType,
        requested_id: resourceId,
        user_ids: resource.userIds,
        department_ids: resource.departmentIds,
      },
    });

    throw new ForbiddenException('Data scope denied');
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

  private async scopeAllowsResource(
    tenantId: string,
    userId: string,
    userDepartmentId: string | null,
    resourceType: DataScopeResourceType,
    resourceId: string,
    scopeType: DataScopeType,
    scopeValue: RoleDataScopeValue,
    resourceUserIds: string[],
    resourceDepartmentIds: string[],
  ) {
    if (scopeType === 'ALL' || scopeType === 'TENANT') {
      return true;
    }

    if (scopeType === 'SELF') {
      return resourceUserIds.includes(userId);
    }

    if (scopeType === 'DEPT' || scopeType === 'DEPT_AND_CHILD') {
      if (!userDepartmentId) return false;
      const allowedDepartmentIds = scopeType === 'DEPT_AND_CHILD'
        ? await this.resourceAccess.expandDepartmentIds(tenantId, [userDepartmentId])
        : [userDepartmentId];

      return intersects(resourceDepartmentIds, allowedDepartmentIds);
    }

    if (scopeType === 'CUSTOM') {
      if (scopeValue.resource_ids.includes(resourceId)) return true;
      if (scopeValue.resource_ids.includes(`${resourceType}:${resourceId}`)) return true;
      if (intersects(resourceUserIds, scopeValue.user_ids)) return true;

      const allowedDepartmentIds = scopeValue.include_children
        ? await this.resourceAccess.expandDepartmentIds(tenantId, scopeValue.department_ids)
        : scopeValue.department_ids;

      return intersects(resourceDepartmentIds, allowedDepartmentIds);
    }

    return false;
  }
}

function resolveRequestParam(request: RequestWithContext, paramName: string) {
  const value = request.params?.[paramName];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
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

  throw new ForbiddenException('Invalid data scope type');
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

function intersects(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return false;
  const rightSet = new Set(right);

  return left.some((item) => rightSet.has(item));
}
