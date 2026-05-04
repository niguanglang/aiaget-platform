import { ForbiddenException, HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { expandPermissionCodes, hasPermission } from '@aiaget/shared-types';

import { hashApiKeyToken } from '../api-keys/api-keys.service';
import { DataScopeQueryService } from '../common/services/data-scope-query.service';
import { ResourceAccessService } from '../common/services/resource-access.service';
import { SecurityEventService } from '../common/services/security-event.service';
import type { AuthenticatedUser, RequestWithContext } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';

const EXTERNAL_CHAT_SCOPE = 'external:agent:chat';
const EXTERNAL_STREAM_SCOPE = 'external:agent:stream';

type ExternalApiKeyRecord = Prisma.ApiKeyGetPayload<object>;

export interface ExternalApiPrincipal {
  key: ExternalApiKeyRecord;
  user: AuthenticatedUser;
  channelId?: string | null;
}

@Injectable()
export class ExternalApiKeyService {
  private readonly minuteBuckets = new Map<string, { windowStart: number; count: number }>();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
    @Inject(ResourceAccessService) private readonly resourceAccess: ResourceAccessService,
    @Inject(SecurityEventService) private readonly securityEvents: SecurityEventService,
  ) {}

  async authenticate(request: RequestWithContext, agentId: string, options: { stream: boolean }): Promise<ExternalApiPrincipal> {
    const token = extractApiKey(request);
    if (!token) {
      throw new UnauthorizedException('Missing API key');
    }

    const key = await this.prisma.apiKey.findFirst({
      where: {
        keyHash: hashApiKeyToken(token),
        deletedAt: null,
      },
    });

    if (!key || key.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid API key');
    }

    if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Expired API key');
    }

    if (options.stream && !key.allowStream) {
      throw new ForbiddenException('API key does not allow streaming');
    }

    const user = await this.resolveKeyUser(key, request);
    request.user = user;
    request.apiKeyId = key.id;
    request.apiKeyPrefix = key.keyPrefix;
    request.externalAgentId = agentId;

    ensureScope(key, options.stream ? EXTERNAL_STREAM_SCOPE : EXTERNAL_CHAT_SCOPE);
    ensureAgentAllowed(key, agentId);
    ensureIpAllowed(key, request);
    this.ensureMinuteLimit(key);
    await this.ensureDailyQuota(key);

    await this.ensurePermission(user, 'system:api_key:invoke', request, key, agentId);
    await this.ensurePermission(user, 'conversation:chat:manage', request, key, agentId);
    await this.ensurePermission(user, 'agent:agent:use', request, key, agentId);
    await this.ensureDataScopeAccess(user, agentId, request, key);
    await this.ensureResourcePermission(user, agentId, 'agent:agent:use', request, key, agentId);

    return { key, user };
  }

  async authenticateChannel(
    request: RequestWithContext,
    channelId: string,
    options: { stream: boolean },
  ): Promise<ExternalApiPrincipal & { channelId: string; agentId: string }> {
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        id: channelId,
        deletedAt: null,
      },
      include: {
        agent: true,
      },
    });

    if (!channel || channel.status !== 'ACTIVE' || channel.agent.deletedAt) {
      throw new ForbiddenException('Publish channel is unavailable');
    }
    if (channel.agent.status !== 'PUBLISHED') {
      throw new ForbiddenException('Publish channel agent is unavailable');
    }

    const principal = await this.authenticate(request, channel.agentId, options);
    if (principal.user.tenantId !== channel.tenantId) {
      throw new ForbiddenException('Publish channel tenant mismatch');
    }

    await this.ensureChannelDataScopeAccess(principal.user, channel.id, request, principal.key, channel.agentId);
    await this.ensureResourcePermission(
      principal.user,
      channel.id,
      'channel:publish:view',
      request,
      principal.key,
      channel.agentId,
      'CHANNEL',
    );

    request.externalChannelId = channel.id;

    return {
      ...principal,
      channelId: channel.id,
      agentId: channel.agentId,
    };
  }

  async authenticateChannelConversation(
    request: RequestWithContext,
    channelId: string,
    conversationId: string,
    options: { stream: boolean },
  ): Promise<ExternalApiPrincipal & { channelId: string; agentId: string }> {
    const principal = await this.authenticateChannel(request, channelId, options);
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId: principal.user.tenantId,
        id: conversationId,
        agentId: principal.agentId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new ForbiddenException('External channel conversation is unavailable');
    }

    await this.ensureConversationDataScopeAccess(principal.user, conversationId, request, principal.key, principal.agentId);
    await this.ensureResourcePermission(
      principal.user,
      conversationId,
      'conversation:chat:manage',
      request,
      principal.key,
      principal.agentId,
      'CONVERSATION',
    );

    return principal;
  }

  async authenticateConversation(
    request: RequestWithContext,
    agentId: string,
    conversationId: string,
    options: { stream: boolean },
  ): Promise<ExternalApiPrincipal> {
    const principal = await this.authenticate(request, agentId, options);
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId: principal.user.tenantId,
        id: conversationId,
        agentId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new ForbiddenException('External API conversation is unavailable');
    }

    await this.ensureConversationDataScopeAccess(principal.user, conversationId, request, principal.key, agentId);
    await this.ensureResourcePermission(principal.user, conversationId, 'conversation:chat:manage', request, principal.key, agentId, 'CONVERSATION');

    return principal;
  }

  async markUsed(keyId: string) {
    const key = await this.prisma.apiKey.findUnique({
      where: {
        id: keyId,
      },
      select: {
        id: true,
        usedCountToday: true,
        quotaResetDate: true,
      },
    });

    if (!key) return;

    const today = quotaDate();
    const shouldReset = !key.quotaResetDate || key.quotaResetDate.toISOString().slice(0, 10) !== today.toISOString().slice(0, 10);

    await this.prisma.apiKey.update({
      where: {
        id: keyId,
      },
      data: {
        lastUsedAt: new Date(),
        quotaResetDate: today,
        usedCountToday: shouldReset ? 1 : { increment: 1 },
      },
    });
  }

  private ensureMinuteLimit(key: ExternalApiKeyRecord) {
    const limit = Math.max(1, key.rateLimitPerMinute);
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000;
    const bucket = this.minuteBuckets.get(key.id);

    if (!bucket || bucket.windowStart !== windowStart) {
      this.minuteBuckets.set(key.id, { windowStart, count: 1 });
      this.cleanupMinuteBuckets(windowStart);
      return;
    }

    if (bucket.count >= limit) {
      throw new HttpException('API key rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.count += 1;
  }

  private cleanupMinuteBuckets(currentWindowStart: number) {
    for (const [key, bucket] of this.minuteBuckets.entries()) {
      if (bucket.windowStart < currentWindowStart - 60000) {
        this.minuteBuckets.delete(key);
      }
    }
  }

  private async ensureDailyQuota(key: ExternalApiKeyRecord) {
    if (!key.dailyQuota) return;

    const today = quotaDate();
    const usedToday = key.quotaResetDate?.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
      ? key.usedCountToday
      : 0;

    if (usedToday >= key.dailyQuota) {
      throw new HttpException('API key daily quota exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async resolveKeyUser(key: ExternalApiKeyRecord, request: RequestWithContext): Promise<AuthenticatedUser> {
    if (!key.createdBy) {
      throw new UnauthorizedException('API key has no owner user');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: key.createdBy,
        tenantId: key.tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        userRoles: {
          where: {
            deletedAt: null,
            role: {
              status: 'ACTIVE',
              deletedAt: null,
            },
          },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: {
                    deletedAt: null,
                  },
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('API key owner is unavailable');
    }

    const activeRoles = user.userRoles.filter((userRole) => userRole.role);
    const permissions = expandPermissionCodes(
      Array.from(
        new Set(
          activeRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.code),
          ),
        ),
      ),
    );

    return {
      id: user.id,
      tenantId: user.tenantId,
      departmentId: user.departmentId,
      email: user.email,
      roles: activeRoles.map((userRole) => userRole.role.code),
      roleIds: activeRoles.map((userRole) => userRole.role.id),
      permissions,
      requestId: request.requestId,
      traceId: request.traceId,
      spanId: request.spanId,
      parentSpanId: request.parentSpanId,
      traceparent: request.traceparent,
    };
  }

  private async ensurePermission(
    user: AuthenticatedUser,
    permissionCode: string,
    request: RequestWithContext,
    key: ExternalApiKeyRecord,
    agentId: string,
  ) {
    if (user.roles.includes('tenant_admin') || hasPermission(user.permissions, permissionCode)) return;

    await this.recordDeny(request, user, key, agentId, permissionCode, 'External API key permission denied');
    throw new ForbiddenException('External API key permission denied');
  }

  private async ensureDataScopeAccess(
    user: AuthenticatedUser,
    agentId: string,
    request: RequestWithContext,
    key: ExternalApiKeyRecord,
  ) {
    const dataScope = await this.dataScopeQuery.buildWhere<Record<string, unknown>>(user, 'AGENT');
    if (!dataScope.where) return;

    const exists = await this.prisma.agent.count({
      where: {
        tenantId: user.tenantId,
        id: agentId,
        deletedAt: null,
        AND: [dataScope.where],
      },
    });

    if (exists > 0) return;

    await this.recordDeny(request, user, key, agentId, 'agent:agent:use', 'External API key data scope denied');
    throw new ForbiddenException('External API key data scope denied');
  }

  private async ensureConversationDataScopeAccess(
    user: AuthenticatedUser,
    conversationId: string,
    request: RequestWithContext,
    key: ExternalApiKeyRecord,
    agentId: string,
  ) {
    const dataScope = await this.dataScopeQuery.buildWhere<Record<string, unknown>>(user, 'CONVERSATION');
    if (!dataScope.where) return;

    const exists = await this.prisma.conversation.count({
      where: {
        tenantId: user.tenantId,
        id: conversationId,
        deletedAt: null,
        AND: [dataScope.where],
      },
    });

    if (exists > 0) return;

    await this.recordDeny(request, user, key, conversationId, 'conversation:chat:manage', 'External API key conversation data scope denied', {
      agent_id: agentId,
      resource_type: 'CONVERSATION',
    });
    throw new ForbiddenException('External API key conversation data scope denied');
  }

  private async ensureChannelDataScopeAccess(
    user: AuthenticatedUser,
    channelId: string,
    request: RequestWithContext,
    key: ExternalApiKeyRecord,
    agentId: string,
  ) {
    const dataScope = await this.dataScopeQuery.buildWhere<Record<string, unknown>>(user, 'CHANNEL');
    if (!dataScope.where) return;

    const exists = await this.prisma.agentPublishChannel.count({
      where: {
        tenantId: user.tenantId,
        id: channelId,
        deletedAt: null,
        AND: [dataScope.where],
      },
    });

    if (exists > 0) return;

    await this.recordDeny(request, user, key, channelId, 'channel:publish:view', 'External channel data scope denied', {
      agent_id: agentId,
      resource_type: 'CHANNEL',
    });
    throw new ForbiddenException('External channel data scope denied');
  }

  private async ensureResourcePermission(
    user: AuthenticatedUser,
    resourceId: string,
    permissionCode: string,
    request: RequestWithContext,
    key: ExternalApiKeyRecord,
    agentId: string,
    resourceType: 'AGENT' | 'CHANNEL' | 'CONVERSATION' = 'AGENT',
  ) {
    const acls = await this.prisma.resourceAcl.findMany({
      where: {
        tenantId: user.tenantId,
        resourceType,
        resourceId,
        permissionCode,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (acls.length === 0) return;

    const subjectKeys = await this.resourceAccess.buildResourceAclSubjectKeys(user);
    const resourceInfo = await this.resourceAccess.getResourceAccessInfo(user.tenantId, resourceType, resourceId);
    const matched = acls.filter((acl) => subjectKeys.has(resourceAclSubjectKey(acl.subjectType, acl.subjectId)));

    if (matched.some((acl) => acl.effect === 'DENY')) {
      await this.recordDeny(request, user, key, resourceId, permissionCode, 'External API key resource ACL denied', {
        user_ids: resourceInfo?.userIds ?? [],
        department_ids: resourceInfo?.departmentIds ?? [],
        agent_id: agentId,
        resource_type: resourceType,
      });
      throw new ForbiddenException('External API key resource ACL denied');
    }

    if (user.roles.includes('tenant_admin')) return;
    if (matched.some((acl) => acl.effect === 'ALLOW')) return;

    await this.recordDeny(request, user, key, resourceId, permissionCode, 'External API key resource ACL denied', {
      user_ids: resourceInfo?.userIds ?? [],
      department_ids: resourceInfo?.departmentIds ?? [],
      agent_id: agentId,
      resource_type: resourceType,
    });
    throw new ForbiddenException('External API key resource ACL denied');
  }

  private async recordDeny(
    request: RequestWithContext,
    user: AuthenticatedUser,
    key: ExternalApiKeyRecord,
    resourceId: string,
    action: string,
    reason: string,
    resourceExtra: Record<string, unknown> = {},
  ) {
    const resourceType = typeof resourceExtra.resource_type === 'string' ? resourceExtra.resource_type : 'AGENT';
    request.user = user;
    await this.securityEvents.recordDeny(request, {
      source: 'RESOURCE_ACL',
      resourceType,
      resourceId,
      action,
      reason,
      subject: {
        id: user.id,
        tenant_id: user.tenantId,
        department_id: user.departmentId ?? null,
        role_codes: user.roles,
        role_ids: user.roleIds ?? [],
        email: user.email,
        api_key_id: key.id,
        api_key_prefix: key.keyPrefix,
      },
      resource: {
        id: resourceId,
        type: resourceType.toLowerCase(),
        resource_type: resourceType,
        ...resourceExtra,
      },
      context: {
        method: request.method,
        path: request.path,
        request_id: request.requestId ?? null,
        trace_id: request.traceId ?? null,
        ip: getClientIp(request),
      },
    });
  }
}

function extractApiKey(request: RequestWithContext) {
  const headerKey = request.headers['x-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) return headerKey.trim();
  if (Array.isArray(headerKey) && headerKey[0]?.trim()) return headerKey[0].trim();

  const authorization = request.headers.authorization;
  if (authorization?.startsWith('Bearer ')) return authorization.slice('Bearer '.length).trim();

  return null;
}

function ensureScope(key: ExternalApiKeyRecord, requiredScope: string) {
  const scopes = parseStringArray(key.scopes);
  if (scopes.includes('*') || scopes.includes(requiredScope)) return;
  throw new ForbiddenException('API key scope denied');
}

function ensureAgentAllowed(key: ExternalApiKeyRecord, agentId: string) {
  const allowedAgentIds = parseStringArray(key.allowedAgentIds);
  if (allowedAgentIds.length === 0 || allowedAgentIds.includes(agentId)) return;
  throw new ForbiddenException('API key is not allowed to call this agent');
}

function ensureIpAllowed(key: ExternalApiKeyRecord, request: RequestWithContext) {
  const allowlist = parseStringArray(key.ipAllowlist);
  if (allowlist.length === 0) return;

  const clientIp = getClientIp(request);
  if (allowlist.includes(clientIp)) return;

  throw new ForbiddenException('API key IP allowlist denied');
}

function getClientIp(request: RequestWithContext) {
  const forwardedFor = request.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return firstForwarded?.split(',')[0]?.trim() || request.ip || '';
}

function parseStringArray(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function resourceAclSubjectKey(subjectType: string, subjectId: string) {
  return `${subjectType}:${subjectId}`;
}

function quotaDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
