import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

import type {
  ConversationRunStepItem,
  CreateTenantApiKeyResult,
  ExternalApiCallLogItem,
  ExternalApiCallStatus,
  ExternalApiObservabilityOverview,
  ExternalApiObservabilityWindow,
  ExternalApiQuotaRiskLevel,
  ExternalApiQuotaWatchItem,
  ExternalApiSecurityDenialItem,
  ListWebhookDeliveriesResult,
  RetryWebhookDeliveryResult,
  WebhookDeliveryDetail,
  TenantApiKeyListItem,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { encryptSecret } from '../models/model-secrets';
import { PrismaService } from '../prisma/prisma.service';
import { ExternalWebhookService } from '../external-api/external-webhook.service';
import type { CreateApiKeyDto } from './dto/create-api-key.dto';

const DEFAULT_WEBHOOK_EVENTS = ['agent.run.completed'] as const;
const SUPPORTED_WEBHOOK_EVENTS = new Set<string>(DEFAULT_WEBHOOK_EVENTS);

@Injectable()
export class ApiKeysService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ExternalWebhookService) private readonly webhookService: ExternalWebhookService,
  ) {}

  async list(currentUser: AuthenticatedUser): Promise<TenantApiKeyListItem[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return keys.map((key) => this.mapKey(key));
  }

  async getExternalObservability(
    currentUser: AuthenticatedUser,
    window: string | undefined,
  ): Promise<ExternalApiObservabilityOverview> {
    const normalizedWindow = normalizeWindow(window);
    const since = windowStart(normalizedWindow);
    const [apiKeys, operationLogs, conversationRuns, securityDenials] = await this.prisma.$transaction([
      this.prisma.apiKey.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        orderBy: {
          lastUsedAt: 'desc',
        },
      }),
      this.prisma.operationLog.findMany({
        where: {
          tenantId: currentUser.tenantId,
          method: 'POST',
          path: {
            contains: '/external/agents/',
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 120,
      }),
      this.prisma.conversationRun.findMany({
        where: {
          tenantId: currentUser.tenantId,
          createdAt: {
            gte: since,
          },
        },
        include: {
          agent: true,
          conversation: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 240,
      }),
      this.prisma.operationLog.findMany({
        where: {
          tenantId: currentUser.tenantId,
          module: 'security',
          action: 'deny',
          createdAt: {
            gte: since,
          },
          OR: [
            {
              path: {
                contains: '/external/agents/',
              },
            },
            {
              requestSummary: {
                path: ['subject', 'api_key_id'],
                not: Prisma.JsonNull,
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 80,
      }),
    ]);
    const apiKeyById = new Map(apiKeys.map((key) => [key.id, key]));
    const apiKeyByPrefix = new Map(apiKeys.map((key) => [key.keyPrefix, key]));
    const runsById = new Map(conversationRuns.map((run) => [run.id, run]));
    const runsByTraceId = new Map<string, (typeof conversationRuns)[number]>();

    for (const run of conversationRuns) {
      const traceId = extractTraceId(run.steps);
      if (traceId && !runsByTraceId.has(traceId)) {
        runsByTraceId.set(traceId, run);
      }
    }

    const recentCalls = operationLogs.map((log) =>
      mapExternalCallLog(log, apiKeyById, apiKeyByPrefix, runsById, runsByTraceId),
    );
    const quotaWatch = apiKeys.map(mapQuotaWatch).sort(sortQuotaWatch);
    const deniedRequestIds = new Set(
      recentCalls
        .filter((call) => call.status !== 'SUCCESS')
        .map((call) => call.request_id),
    );
    const securityDenialItems = securityDenials.map((log) => mapSecurityDenial(log));
    const deniedCount = new Set([
      ...deniedRequestIds,
      ...securityDenialItems.map((item) => item.request_id),
    ]).size;
    const successCount = recentCalls.filter((call) => call.status === 'SUCCESS').length;

    return {
      generated_at: new Date().toISOString(),
      window: normalizedWindow,
      summary: {
        total_requests: recentCalls.length,
        success_requests: successCount,
        denied_requests: deniedCount,
        success_rate: ratioPercent(successCount, recentCalls.length),
        total_tokens: recentCalls.reduce((total, item) => total + item.total_tokens, 0),
        total_cost: roundMoney(recentCalls.reduce((total, item) => total + item.cost_total, 0)),
        average_latency_ms: average(recentCalls.map((item) => item.latency_ms).filter(isNumber)),
        active_key_count: apiKeys.filter((key) => key.status === 'ACTIVE').length,
        risky_key_count: quotaWatch.filter((item) => item.risk_level === 'WARNING' || item.risk_level === 'CRITICAL').length,
      },
      recent_calls: recentCalls.slice(0, 40),
      quota_watch: quotaWatch.slice(0, 12),
      security_denials: securityDenialItems.slice(0, 20),
    };
  }

  async create(currentUser: AuthenticatedUser, dto: CreateApiKeyDto): Promise<CreateTenantApiKeyResult> {
    const plainTextToken = `ak_${randomUUID().replaceAll('-', '')}${randomUUID().replaceAll('-', '')}`;
    const allowedAgentIds = normalizeStringArray(dto.allowed_agent_ids);
    const webhookConfig = normalizeWebhookConfig(dto);
    await this.ensureAgentsExist(currentUser.tenantId, allowedAgentIds);

    const key = await this.prisma.apiKey.create({
      data: {
        tenantId: currentUser.tenantId,
        name: dto.name.trim(),
        keyPrefix: plainTextToken.slice(0, 12),
        keyHash: hashToken(plainTextToken),
        status: 'ACTIVE',
        scopes: normalizeScopes(dto.scopes) as Prisma.InputJsonValue,
        allowedAgentIds: allowedAgentIds as Prisma.InputJsonValue,
        ipAllowlist: normalizeStringArray(dto.ip_allowlist) as Prisma.InputJsonValue,
        rateLimitPerMinute: dto.rate_limit_per_minute ?? 60,
        dailyQuota: dto.daily_quota ?? null,
        usedCountToday: 0,
        quotaResetDate: null,
        allowStream: dto.allow_stream ?? true,
        webhookEnabled: webhookConfig.enabled,
        webhookUrl: webhookConfig.url,
        webhookEvents: webhookConfig.events as Prisma.InputJsonValue,
        webhookSecretEncrypted: webhookConfig.secret ? encryptSecret(webhookConfig.secret) : null,
        expiresAt: dto.expires_at ? new Date(dto.expires_at) : null,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
    });

    return {
      api_key: plainTextToken,
      item: this.mapKey(key),
    };
  }

  async remove(currentUser: AuthenticatedUser, keyId: string): Promise<{ success: boolean }> {
    const key = await this.prisma.apiKey.findFirst({
      where: {
        id: keyId,
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: {
        id: keyId,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    return { success: true };
  }

  async listWebhookDeliveries(currentUser: AuthenticatedUser, apiKeyId?: string): Promise<ListWebhookDeliveriesResult> {
    return this.webhookService.listDeliveries(currentUser, apiKeyId);
  }

  async getWebhookDelivery(currentUser: AuthenticatedUser, deliveryId: string): Promise<WebhookDeliveryDetail> {
    return this.webhookService.getDeliveryDetail(currentUser, deliveryId);
  }

  async retryWebhookDelivery(currentUser: AuthenticatedUser, deliveryId: string): Promise<RetryWebhookDeliveryResult> {
    return this.webhookService.retryDelivery(currentUser, deliveryId);
  }

  private async ensureAgentsExist(tenantId: string, agentIds: string[]) {
    if (agentIds.length === 0) return;

    const count = await this.prisma.agent.count({
      where: {
        tenantId,
        id: {
          in: agentIds,
        },
        deletedAt: null,
      },
    });

    if (count !== agentIds.length) {
      throw new BadRequestException('Allowed agent list contains unavailable agents');
    }
  }

  private mapKey(key: {
    id: string;
    tenantId: string;
    name: string;
    keyPrefix: string;
    status: string;
    scopes: Prisma.JsonValue | null;
    allowedAgentIds: Prisma.JsonValue | null;
    ipAllowlist: Prisma.JsonValue | null;
    rateLimitPerMinute: number;
    dailyQuota: number | null;
    usedCountToday: number;
    quotaResetDate: Date | null;
    allowStream: boolean;
    webhookEnabled: boolean;
    webhookUrl: string | null;
    webhookEvents: Prisma.JsonValue | null;
    webhookSecretEncrypted: string | null;
    webhookLastStatus: string | null;
    webhookLastError: string | null;
    webhookLastSentAt: Date | null;
    expiresAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
  }): TenantApiKeyListItem {
    return {
      id: key.id,
      tenant_id: key.tenantId,
      name: key.name,
      key_prefix: key.keyPrefix,
      masked_key: `${key.keyPrefix}****`,
      status: key.status as TenantApiKeyListItem['status'],
      scopes: parseStringArray(key.scopes),
      allowed_agent_ids: parseStringArray(key.allowedAgentIds),
      ip_allowlist: parseStringArray(key.ipAllowlist),
      rate_limit_per_minute: key.rateLimitPerMinute,
      daily_quota: key.dailyQuota,
      used_count_today: key.usedCountToday,
      quota_reset_date: key.quotaResetDate?.toISOString().slice(0, 10) ?? null,
      allow_stream: key.allowStream,
      webhook_enabled: key.webhookEnabled,
      webhook_url: key.webhookUrl,
      webhook_events: parseWebhookEvents(key.webhookEvents),
      webhook_secret_configured: Boolean(key.webhookSecretEncrypted),
      webhook_last_status: key.webhookLastStatus as TenantApiKeyListItem['webhook_last_status'],
      webhook_last_error: key.webhookLastError,
      webhook_last_sent_at: key.webhookLastSentAt?.toISOString() ?? null,
      expires_at: key.expiresAt?.toISOString() ?? null,
      last_used_at: key.lastUsedAt?.toISOString() ?? null,
      created_at: key.createdAt.toISOString(),
    };
  }
}

export function hashApiKeyToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function hashToken(token: string) {
  return hashApiKeyToken(token);
}

function normalizeScopes(value: string[] | undefined) {
  const scopes = normalizeStringArray(value);
  return scopes.length > 0 ? scopes : ['external:agent:chat'];
}

function normalizeStringArray(value: string[] | undefined | null) {
  return Array.from(new Set((value ?? []).map((item) => item.trim()).filter(Boolean)));
}

function parseStringArray(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeWebhookConfig(dto: CreateApiKeyDto) {
  const enabled = Boolean(dto.webhook_enabled);
  const url = nullableTrim(dto.webhook_url);
  const events = normalizeWebhookEvents(dto.webhook_events);
  const secret = nullableTrim(dto.webhook_secret);

  if (enabled && !url) {
    throw new BadRequestException('Webhook URL is required when webhook is enabled');
  }

  return {
    enabled,
    url,
    events,
    secret,
  };
}

function normalizeWebhookEvents(value: string[] | undefined | null) {
  const events = normalizeStringArray(value).filter((event) => SUPPORTED_WEBHOOK_EVENTS.has(event));
  return events.length > 0 ? events : [...DEFAULT_WEBHOOK_EVENTS];
}

function parseWebhookEvents(value: Prisma.JsonValue | null): TenantApiKeyListItem['webhook_events'] {
  return parseStringArray(value).filter((event): event is TenantApiKeyListItem['webhook_events'][number] =>
    SUPPORTED_WEBHOOK_EVENTS.has(event),
  );
}

function nullableTrim(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeWindow(window: string | undefined): ExternalApiObservabilityWindow {
  return window === '7d' ? '7d' : '24h';
}

function windowStart(window: ExternalApiObservabilityWindow) {
  const date = new Date();
  if (window === '7d') {
    date.setDate(date.getDate() - 7);
    return date;
  }
  date.setHours(date.getHours() - 24);
  return date;
}

function mapExternalCallLog(
  log: Prisma.OperationLogGetPayload<object>,
  apiKeyById: Map<string, Prisma.ApiKeyGetPayload<object>>,
  apiKeyByPrefix: Map<string, Prisma.ApiKeyGetPayload<object>>,
  runsById: Map<string, Prisma.ConversationRunGetPayload<{ include: { agent: true; conversation: true } }>>,
  runsByTraceId: Map<string, Prisma.ConversationRunGetPayload<{ include: { agent: true; conversation: true } }>>,
): ExternalApiCallLogItem {
  const summary = normalizeJsonObject(log.requestSummary);
  const apiKeyId = stringValue(summary?.api_key_id);
  const apiKeyPrefix = stringValue(summary?.api_key_prefix);
  const apiKey = (apiKeyId ? apiKeyById.get(apiKeyId) : null) ?? (apiKeyPrefix ? apiKeyByPrefix.get(apiKeyPrefix) : null) ?? null;
  const traceId = stringValue(summary?.external_trace_id) ?? extractTraceId(log.requestSummary);
  const runId = stringValue(summary?.external_run_id);
  const run = (runId ? runsById.get(runId) : null) ?? (traceId ? runsByTraceId.get(traceId) : null) ?? null;
  const steps = parseSteps(run?.steps ?? null);

  return {
    event_id: `operation:${log.id}`,
    api_key_id: apiKey?.id ?? apiKeyId,
    api_key_name: apiKey?.name ?? null,
    masked_key: apiKey ? `${apiKey.keyPrefix}****` : apiKeyPrefix ? `${apiKeyPrefix}****` : null,
    agent_id: run?.agentId ?? stringValue(summary?.external_agent_id) ?? extractAgentIdFromPath(log.path),
    agent_name: run?.agent.name ?? null,
    status: operationStatus(log.statusCode),
    status_code: log.statusCode,
    trace_id: traceId,
    request_id: log.requestId,
    latency_ms: run?.latencyMs ?? null,
    total_tokens: run?.totalTokens ?? extractStepTokens(steps),
    cost_total: roundMoney(extractStepCost(steps)),
    ip: log.ip,
    path: log.path,
    error_message: log.errorMessage,
    occurred_at: log.createdAt.toISOString(),
  };
}

function mapQuotaWatch(key: Prisma.ApiKeyGetPayload<object>): ExternalApiQuotaWatchItem {
  const remaining = key.dailyQuota === null ? null : Math.max(0, key.dailyQuota - key.usedCountToday);
  const usageRate = key.dailyQuota === null || key.dailyQuota <= 0
    ? null
    : Number(((key.usedCountToday / key.dailyQuota) * 100).toFixed(1));

  return {
    api_key_id: key.id,
    api_key_name: key.name,
    masked_key: `${key.keyPrefix}****`,
    status: key.status as ExternalApiQuotaWatchItem['status'],
    used_count_today: key.usedCountToday,
    daily_quota: key.dailyQuota,
    remaining_today: remaining,
    usage_rate: usageRate,
    risk_level: quotaRiskLevel(usageRate),
    last_used_at: key.lastUsedAt?.toISOString() ?? null,
  };
}

function mapSecurityDenial(log: Prisma.OperationLogGetPayload<object>): ExternalApiSecurityDenialItem {
  const summary = normalizeJsonObject(log.requestSummary);
  const subject = normalizeJsonObject(summary?.subject);
  const resource = normalizeJsonObject(summary?.resource);
  const context = normalizeJsonObject(summary?.context);

  return {
    event_id: `operation:${log.id}`,
    source: stringValue(summary?.source) ?? stringValue(summary?.guard_source),
    reason: stringValue(summary?.reason) ?? log.errorMessage ?? '外部调用被安全策略拒绝',
    api_key_id: stringValue(subject?.api_key_id),
    api_key_prefix: stringValue(subject?.api_key_prefix),
    agent_id: stringValue(resource?.id) ?? stringValue(summary?.resource_id),
    trace_id: stringValue(context?.trace_id) ?? extractTraceId(log.requestSummary),
    request_id: stringValue(context?.request_id) ?? log.requestId,
    path: stringValue(context?.path) ?? log.path,
    status_code: log.statusCode,
    occurred_at: log.createdAt.toISOString(),
  };
}

function sortQuotaWatch(left: ExternalApiQuotaWatchItem, right: ExternalApiQuotaWatchItem) {
  const riskOrder: Record<ExternalApiQuotaRiskLevel, number> = {
    CRITICAL: 4,
    WARNING: 3,
    NORMAL: 2,
    UNLIMITED: 1,
  };
  const riskDelta = riskOrder[right.risk_level] - riskOrder[left.risk_level];
  if (riskDelta !== 0) return riskDelta;

  return Date.parse(right.last_used_at ?? '1970-01-01') - Date.parse(left.last_used_at ?? '1970-01-01');
}

function quotaRiskLevel(usageRate: number | null): ExternalApiQuotaRiskLevel {
  if (usageRate === null) return 'UNLIMITED';
  if (usageRate >= 100) return 'CRITICAL';
  if (usageRate >= 80) return 'WARNING';
  return 'NORMAL';
}

function operationStatus(statusCode: number): ExternalApiCallStatus {
  if (statusCode >= 500) return 'FAILED';
  if (statusCode >= 400) return 'DEGRADED';
  return 'SUCCESS';
}

function parseSteps(value: Prisma.JsonValue | null): ConversationRunStepItem[] {
  return Array.isArray(value) ? (value as unknown as ConversationRunStepItem[]) : [];
}

function extractTraceId(value: Prisma.JsonValue | null): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const traceId = extractTraceId(item as Prisma.JsonValue);
      if (traceId) return traceId;
    }
    return null;
  }
  if (typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const directTraceId = stringValue(record.trace_id ?? record.traceId ?? record['x-trace-id']);
  if (directTraceId && /^[0-9a-f]{32}$/.test(directTraceId)) {
    return directTraceId;
  }
  const traceparent = stringValue(record.traceparent);
  const traceparentMatch = traceparent?.match(/^00-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/i);
  if (traceparentMatch?.[1]) return traceparentMatch[1].toLowerCase();

  for (const entry of Object.values(record)) {
    if (entry && typeof entry === 'object') {
      const traceId = extractTraceId(entry as Prisma.JsonValue);
      if (traceId) return traceId;
    }
  }
  return null;
}

function extractStepCost(steps: ConversationRunStepItem[]) {
  return steps.reduce((total, step) => total + (step.cost_total ?? 0), 0);
}

function extractStepTokens(steps: ConversationRunStepItem[]) {
  return steps.reduce((total, step) => total + (step.total_tokens ?? 0), 0);
}

function extractAgentIdFromPath(path: string) {
  return path.match(/\/external\/agents\/([^/?#]+)\/chat/)?.[1] ?? null;
}

function normalizeJsonObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function ratioPercent(success: number, total: number) {
  if (total === 0) return 0;
  return Number(((success / total) * 100).toFixed(1));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function roundMoney(value: number) {
  return Number(value.toFixed(6));
}
