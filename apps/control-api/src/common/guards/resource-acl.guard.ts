import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { RESOURCE_ACL_KEY, type ResourceAclRequirement } from '../decorators/resource-acl.decorator';
import { SecurityEventService } from '../services/security-event.service';
import type { RequestWithContext } from '../types/request-context';

@Injectable()
export class ResourceAclGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SecurityEventService) private readonly securityEvents: SecurityEventService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<ResourceAclRequirement>(RESOURCE_ACL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requirement) return true;

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Missing authenticated user');

    const resourceId = resolveRequestParam(request, requirement.idParam ?? 'id');
    if (!resourceId) return true;

    const acls = await this.prisma.resourceAcl.findMany({
      where: {
        tenantId: user.tenantId,
        resourceType: requirement.resourceType,
        resourceId,
        permissionCode: requirement.permissionCode,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (acls.length === 0) {
      return true;
    }

    const subjectKeys = buildSubjectKeys(user);
    const resource = {
      id: resourceId,
      type: requirement.resourceType.toLowerCase(),
      resource_type: requirement.resourceType,
    };
    const subject = {
      id: user.id,
      tenant_id: user.tenantId,
      department_id: user.departmentId ?? null,
      role_codes: user.roles,
      role_ids: user.roleIds ?? [],
      email: user.email,
    };
    const conditionInput = {
      subject,
      resource,
      action: requirement.permissionCode,
      context: {
        method: request.method,
        path: request.path,
        request_id: request.requestId ?? null,
        trace_id: request.traceId ?? null,
      },
    };
    const matched = acls.filter(
      (acl) => subjectKeys.has(subjectKey(acl.subjectType, acl.subjectId)) && conditionsMatch(acl.conditions, conditionInput),
    );
    const denyMatch = matched.find((acl) => acl.effect === 'DENY');
    if (denyMatch) {
      await this.securityEvents.recordDeny(request, {
        source: 'RESOURCE_ACL',
        resourceType: requirement.resourceType,
        resourceId,
        action: requirement.permissionCode,
        reason: 'Resource ACL denied',
        matchedCode: denyMatch.id,
        subject,
        resource,
        context: conditionInput.context,
      });
      throw new ForbiddenException('Resource ACL denied');
    }

    if (user.roles.includes('tenant_admin')) {
      return true;
    }

    const allowMatch = matched.find((acl) => acl.effect === 'ALLOW');
    if (allowMatch) {
      return true;
    }

    await this.securityEvents.recordDeny(request, {
      source: 'RESOURCE_ACL',
      resourceType: requirement.resourceType,
      resourceId,
      action: requirement.permissionCode,
      reason: 'Resource ACL denied',
      subject,
      resource,
      context: conditionInput.context,
    });

    throw new ForbiddenException('Resource ACL denied');
  }
}

function resolveRequestParam(request: RequestWithContext, paramName: string) {
  const value = request.params?.[paramName];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function buildSubjectKeys(user: NonNullable<RequestWithContext['user']>) {
  const output = new Set<string>();
  output.add(subjectKey('USER', user.id));
  output.add(subjectKey('TENANT', user.tenantId));

  for (const roleId of user.roleIds ?? []) {
    output.add(subjectKey('ROLE', roleId));
  }

  if (user.departmentId) {
    output.add(subjectKey('DEPARTMENT', user.departmentId));
  }

  return output;
}

function subjectKey(subjectType: string, subjectId: string) {
  return `${subjectType}:${subjectId}`;
}

interface AclConditionInput {
  subject: Record<string, unknown>;
  resource: Record<string, unknown>;
  action: string;
  context: Record<string, unknown>;
}

interface NormalizedCondition {
  path?: string;
  field?: string;
  operator?: string;
  value?: unknown;
}

function conditionsMatch(value: Prisma.JsonValue | null, input: AclConditionInput) {
  const conditions = extractConditions(value);
  if (conditions.length === 0) return true;

  return conditions.every((condition) => matchCondition(condition, input));
}

function extractConditions(value: unknown): NormalizedCondition[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as NormalizedCondition[];
  if (!isPlainObject(value)) return [];

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.all)) return record.all as NormalizedCondition[];
  if (Array.isArray(record.conditions)) return record.conditions as NormalizedCondition[];
  if (record.path || record.field) return [record as NormalizedCondition];

  return [];
}

function matchCondition(condition: NormalizedCondition, input: AclConditionInput) {
  const path = condition.path ?? condition.field;
  if (typeof path !== 'string' || path.trim().length === 0) return false;

  const actual = getByPath(
    {
      subject: input.subject,
      resource: input.resource,
      context: input.context,
      action: input.action,
    },
    path,
  );

  switch (condition.operator) {
    case 'eq':
      return looseEqual(actual, condition.value);
    case 'neq':
      return !looseEqual(actual, condition.value);
    case 'in':
      return Array.isArray(condition.value) && condition.value.some((item) => looseEqual(actual, item));
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.some((item) => looseEqual(actual, item));
    case 'contains':
      if (Array.isArray(actual)) return actual.some((item) => looseEqual(item, condition.value));
      return typeof actual === 'string' && typeof condition.value === 'string'
        ? actual.includes(condition.value)
        : false;
    case 'exists': {
      const expected = condition.value === undefined ? true : Boolean(condition.value);
      return expected ? actual !== undefined && actual !== null : actual === undefined || actual === null;
    }
    default:
      return false;
  }
}

function getByPath(root: Record<string, unknown>, path: string) {
  const parts = path.split('.').filter(Boolean);
  let current: unknown = root;

  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function looseEqual(left: unknown, right: unknown) {
  if (left === right) return true;
  if (left === null || left === undefined || right === null || right === undefined) return false;
  return String(left) === String(right);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
