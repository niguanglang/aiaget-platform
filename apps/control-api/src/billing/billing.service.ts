import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  BillingApiKeyQuotaItem,
  BillingConversationCostItem,
  BillingCostTrendPoint,
  BillingModelCostItem,
  BillingOverview,
  BillingProviderCostItem,
  BillingQuotaRiskLevel,
  BillingWindow,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(currentUser: AuthenticatedUser, window: string | undefined): Promise<BillingOverview> {
    const normalizedWindow = normalizeWindow(window);
    const since = windowStart(normalizedWindow);
    const [modelLogs, apiKeys, conversationRuns] = await this.prisma.$transaction([
      this.prisma.modelCallLog.findMany({
        where: {
          tenantId: currentUser.tenantId,
          createdAt: {
            gte: since,
          },
        },
        include: {
          provider: true,
          modelConfig: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1000,
      }),
      this.prisma.apiKey.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1000,
      }),
    ]);
    const quotaItems = apiKeys.map(mapApiKeyQuota);
    const modelCost = sum(modelLogs.map((log) => Number(log.totalCost)));
    const runStepCost = sum(conversationRuns.map((run) => extractRunStepCost(run.steps)));
    const totalTokens = modelLogs.reduce((total, log) => total + log.totalTokens, 0);

    return {
      generated_at: new Date().toISOString(),
      window: normalizedWindow,
      summary: {
        total_cost: roundMoney(modelCost + runStepCost),
        model_cost: roundMoney(modelCost),
        run_step_cost: roundMoney(runStepCost),
        total_tokens: totalTokens,
        model_calls: modelLogs.length,
        projected_monthly_cost: projectMonthlyCost(modelCost + runStepCost, normalizedWindow),
        quota_usage_rate: average(quotaItems.map((item) => item.usage_rate).filter(isNumber)),
        risky_api_key_count: quotaItems.filter((item) => item.risk_level === 'WARNING' || item.risk_level === 'CRITICAL').length,
      },
      cost_trend: buildCostTrend(modelLogs, conversationRuns, normalizedWindow),
      provider_costs: buildProviderCosts(modelLogs),
      model_costs: buildModelCosts(modelLogs),
      quota_overview: quotaItems,
      risky_api_keys: quotaItems.filter((item) => item.risk_level === 'WARNING' || item.risk_level === 'CRITICAL'),
      conversation_costs: buildConversationCosts(conversationRuns),
    };
  }
}

type ModelLogRecord = Prisma.ModelCallLogGetPayload<{
  include: {
    provider: true;
    modelConfig: true;
  };
}>;

type ConversationRunRecord = Prisma.ConversationRunGetPayload<{
  include: {
    agent: true;
  };
}>;

function normalizeWindow(window: string | undefined): BillingWindow {
  return window === '7d' ? '7d' : '24h';
}

function windowStart(window: BillingWindow) {
  const now = new Date();
  if (window === '7d') {
    now.setDate(now.getDate() - 7);
    return now;
  }
  now.setHours(now.getHours() - 24);
  return now;
}

function buildCostTrend(
  modelLogs: ModelLogRecord[],
  runs: ConversationRunRecord[],
  window: BillingWindow,
): BillingCostTrendPoint[] {
  const buckets = new Map<string, BillingCostTrendPoint>();

  for (const log of modelLogs) {
    const bucket = bucketLabel(log.createdAt, window);
    const current = getTrendBucket(buckets, bucket);
    current.model_cost = roundMoney(current.model_cost + Number(log.totalCost));
    current.total_cost = roundMoney(current.total_cost + Number(log.totalCost));
    current.total_tokens += log.totalTokens;
  }

  for (const run of runs) {
    const bucket = bucketLabel(run.createdAt, window);
    const current = getTrendBucket(buckets, bucket);
    const stepCost = extractRunStepCost(run.steps);
    const stepTokens = extractRunStepTokens(run.steps);
    current.run_step_cost = roundMoney(current.run_step_cost + stepCost);
    current.total_cost = roundMoney(current.total_cost + stepCost);
    current.total_tokens += stepTokens;
  }

  return Array.from(buckets.values()).sort((left, right) => left.bucket.localeCompare(right.bucket));
}

function buildProviderCosts(modelLogs: ModelLogRecord[]): BillingProviderCostItem[] {
  const grouped = groupBy(modelLogs, (log) => log.providerId);
  return Array.from(grouped.values())
    .map((items) => {
      const first = items[0];
      return {
        provider_id: first?.providerId ?? '',
        provider_name: first?.provider.name ?? '未知供应商',
        provider_type: first?.provider.providerType ?? 'UNKNOWN',
        call_count: items.length,
        success_rate: ratioPercent(items.filter((item) => item.status === 'SUCCESS').length, items.length),
        total_tokens: items.reduce((total, item) => total + item.totalTokens, 0),
        total_cost: roundMoney(sum(items.map((item) => Number(item.totalCost)))),
      };
    })
    .sort((left, right) => right.total_cost - left.total_cost)
    .slice(0, 8);
}

function buildModelCosts(modelLogs: ModelLogRecord[]): BillingModelCostItem[] {
  const grouped = groupBy(modelLogs, (log) => `${log.providerId}:${log.modelConfigId ?? log.requestModel}`);
  return Array.from(grouped.values())
    .map((items) => {
      const first = items[0];
      return {
        model_config_id: first?.modelConfigId ?? null,
        model_name: first?.modelConfig?.name ?? first?.requestModel ?? '未知模型',
        request_model: first?.requestModel ?? 'unknown',
        provider_name: first?.provider.name ?? '未知供应商',
        call_count: items.length,
        success_rate: ratioPercent(items.filter((item) => item.status === 'SUCCESS').length, items.length),
        total_tokens: items.reduce((total, item) => total + item.totalTokens, 0),
        total_cost: roundMoney(sum(items.map((item) => Number(item.totalCost)))),
        average_latency_ms: average(items.map((item) => item.latencyMs)),
      };
    })
    .sort((left, right) => right.total_cost - left.total_cost)
    .slice(0, 10);
}

function buildConversationCosts(runs: ConversationRunRecord[]): BillingConversationCostItem[] {
  const grouped = groupBy(runs, (run) => run.agentId);
  return Array.from(grouped.values())
    .map((items) => {
      const first = items[0];
      return {
        agent_id: first?.agentId ?? '',
        agent_name: first?.agent.name ?? '未知智能体',
        run_count: items.length,
        total_tokens: items.reduce((total, item) => total + item.totalTokens + extractRunStepTokens(item.steps), 0),
        total_cost: roundMoney(sum(items.map((item) => extractRunStepCost(item.steps)))),
        average_latency_ms: average(items.map((item) => item.latencyMs)),
      };
    })
    .sort((left, right) => right.total_cost - left.total_cost)
    .slice(0, 8);
}

function mapApiKeyQuota(key: {
  id: string;
  name: string;
  keyPrefix: string;
  status: string;
  rateLimitPerMinute: number;
  dailyQuota: number | null;
  usedCountToday: number;
  allowStream: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
}): BillingApiKeyQuotaItem {
  const remainingToday = key.dailyQuota === null ? null : Math.max(0, key.dailyQuota - key.usedCountToday);
  const usageRate = key.dailyQuota === null || key.dailyQuota === 0 ? null : Number(((key.usedCountToday / key.dailyQuota) * 100).toFixed(1));

  return {
    id: key.id,
    name: key.name,
    masked_key: `${key.keyPrefix}****`,
    status: key.status as BillingApiKeyQuotaItem['status'],
    rate_limit_per_minute: key.rateLimitPerMinute,
    daily_quota: key.dailyQuota,
    used_count_today: key.usedCountToday,
    remaining_today: remainingToday,
    usage_rate: usageRate,
    risk_level: quotaRiskLevel(usageRate),
    allow_stream: key.allowStream,
    expires_at: key.expiresAt?.toISOString() ?? null,
    last_used_at: key.lastUsedAt?.toISOString() ?? null,
  };
}

function quotaRiskLevel(usageRate: number | null): BillingQuotaRiskLevel {
  if (usageRate === null) return 'UNLIMITED';
  if (usageRate >= 90) return 'CRITICAL';
  if (usageRate >= 70) return 'WARNING';
  return 'NORMAL';
}

function getTrendBucket(buckets: Map<string, BillingCostTrendPoint>, bucket: string) {
  const current = buckets.get(bucket);
  if (current) return current;
  const next = {
    bucket,
    total_cost: 0,
    model_cost: 0,
    run_step_cost: 0,
    total_tokens: 0,
  };
  buckets.set(bucket, next);
  return next;
}

function bucketLabel(date: Date, window: BillingWindow) {
  if (window === '7d') {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  }
  return `${String(date.getHours()).padStart(2, '0')}:00`;
}

function extractRunStepCost(value: Prisma.JsonValue | null) {
  return sum(parseSteps(value).map((step) => numberValue(step['cost_total'])));
}

function extractRunStepTokens(value: Prisma.JsonValue | null) {
  return Math.round(sum(parseSteps(value).map((step) => numberValue(step['total_tokens']))));
}

function parseSteps(value: Prisma.JsonValue | null): Prisma.JsonObject[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Prisma.JsonObject => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function projectMonthlyCost(cost: number, window: BillingWindow) {
  const multiplier = window === '7d' ? 30 / 7 : 30;
  return roundMoney(cost * multiplier);
}

function ratioPercent(success: number, total: number) {
  if (total === 0) return 0;
  return Number(((success / total) * 100).toFixed(1));
}

function average(values: number[]) {
  const numbers = values.filter(isNumber);
  if (numbers.length === 0) return 0;
  return Number((numbers.reduce((total, value) => total + value, 0) / numbers.length).toFixed(1));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function roundMoney(value: number) {
  return Number(value.toFixed(6));
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const output = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    output.set(key, [...(output.get(key) ?? []), item]);
  }
  return output;
}
