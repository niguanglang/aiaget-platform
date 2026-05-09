import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { evaluateSecurityPolicies, type PolicyLike } from '../../security-policies/security-policy-evaluator';
import { RESOURCE_ACL_KEY, type ResourceAclRequirement } from '../decorators/resource-acl.decorator';
import { SECURITY_POLICY_KEY, type SecurityPolicyRequirement } from '../decorators/security-policy.decorator';
import { ResourceAccessService } from '../services/resource-access.service';
import { SecurityEventService } from '../services/security-event.service';
import type { RequestWithContext } from '../types/request-context';

@Injectable()
export class SecurityPolicyGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ResourceAccessService) private readonly resourceAccess: ResourceAccessService,
    @Inject(SecurityEventService) private readonly securityEvents: SecurityEventService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.resolveRequirement(context);
    if (!requirement) return true;

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Missing authenticated user');

    const resourceId = resolveRequestParam(request, requirement.idParam ?? 'id');
    if (!resourceId) return true;

    const canonicalResourceId = await this.resourceAccess.resolveCanonicalResourceId(
      user.tenantId,
      requirement.resourceType,
      resourceId,
    );
    if (!canonicalResourceId) return true;

    const policies = await this.prisma.securityPolicy.findMany({
      where: {
        tenantId: user.tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          effect: 'desc',
        },
      ],
    });

    if (policies.length === 0) return true;

    const accessInfo = await this.resourceAccess.getResourceAccessInfo(
      user.tenantId,
      requirement.resourceType,
      canonicalResourceId,
    );
    const subject = buildSubject(user);
    const resource = {
      id: canonicalResourceId,
      type: requirement.resourceType.toLowerCase(),
      resource_type: requirement.resourceType,
      requested_id: resourceId,
      user_ids: accessInfo?.userIds ?? [],
      department_ids: accessInfo?.departmentIds ?? [],
    };
    const action = normalizeAction(requirement.action);
    const actionAliases = buildActionAliases(requirement.action);
    const contextPayload = buildContext(request);
    const result = evaluateSecurityPolicies(policies.map(toPolicyLike), {
      subject,
      resource,
      action,
      actionAliases,
      context: contextPayload,
    });

    await this.persistEvaluation(user.id, user.tenantId, request, subject, resource, action, contextPayload, result);

    if (result.decision === 'DENY') {
      await this.securityEvents.recordDeny(request, {
        source: 'SECURITY_POLICY',
        resourceType: requirement.resourceType,
        resourceId: canonicalResourceId,
        action,
        reason: result.reason,
        matchedCode: result.matchedPolicy?.code ?? null,
        subject,
        resource,
        context: contextPayload,
      });
      throw new ForbiddenException('Security policy denied');
    }

    return true;
  }

  private resolveRequirement(context: ExecutionContext): SecurityPolicyRequirement | null {
    const securityRequirement = this.reflector.getAllAndOverride<SecurityPolicyRequirement>(SECURITY_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (securityRequirement) return securityRequirement;

    const resourceAclRequirement = this.reflector.getAllAndOverride<ResourceAclRequirement>(RESOURCE_ACL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!resourceAclRequirement) return null;

    return {
      resourceType: resourceAclRequirement.resourceType,
      idParam: resourceAclRequirement.idParam,
      action: resourceAclRequirement.permissionCode,
    };
  }

  private async persistEvaluation(
    userId: string,
    tenantId: string,
    request: RequestWithContext,
    subject: Record<string, unknown>,
    resource: Record<string, unknown>,
    action: string,
    contextPayload: Record<string, unknown>,
    result: ReturnType<typeof evaluateSecurityPolicies>,
  ) {
    await this.prisma.securityPolicyEvaluation.create({
      data: {
        tenantId,
        requestId: request.requestId ?? 'unknown',
        traceId: request.traceId ?? null,
        subject: subject as Prisma.InputJsonObject,
        resource: resource as Prisma.InputJsonObject,
        action,
        decision: result.decision,
        matchedPolicyId: result.matchedPolicy?.id ?? null,
        matchedPolicyCode: result.matchedPolicy?.code ?? null,
        reason: result.reason,
        context: contextPayload as Prisma.InputJsonObject,
        createdBy: userId,
      },
    });
  }
}

function buildSubject(user: NonNullable<RequestWithContext['user']>) {
  return {
    id: user.id,
    tenant_id: user.tenantId,
    department_id: user.departmentId ?? null,
    role_codes: user.roles,
    role_ids: user.roleIds ?? [],
    email: user.email,
  };
}

function buildContext(request: RequestWithContext) {
  return {
    method: request.method,
    path: request.path,
    route: request.route?.path ?? null,
    request_id: request.requestId ?? null,
    trace_id: request.traceId ?? null,
    ip: request.ip ?? null,
    user_agent: request.headers['user-agent'] ?? null,
  };
}

function buildActionAliases(action: string) {
  const normalized = normalizeAction(action);
  const aliases = [normalized];
  const parts = normalized.split(':');
  const module = parts[0];
  const verb = parts[2];

  if (module && verb) {
    aliases.push(verb);
    aliases.push(`${module}:${verb}`);
  }

  return aliases;
}

function resolveRequestParam(request: RequestWithContext, paramName: string) {
  const value = request.params?.[paramName];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeAction(action: string) {
  return action.trim().toLowerCase();
}

function toPolicyLike(policy: Prisma.SecurityPolicyGetPayload<object>): PolicyLike {
  return {
    id: policy.id,
    code: policy.code,
    name: policy.name,
    effect: policy.effect,
    resourceType: policy.resourceType,
    action: policy.action,
    priority: policy.priority,
    conditions: policy.conditions,
  };
}
