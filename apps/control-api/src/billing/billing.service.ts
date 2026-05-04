import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  BillingApiKeyQuotaItem,
  BillingCycle,
  BillingConversationCostItem,
  BillingCostTrendPoint,
  BillingInvoiceItem,
  BillingModelCostItem,
  BillingOverview,
  BillingPlanItem,
  BillingProviderCostItem,
  BillingQuotaAction,
  BillingQuotaMetricType,
  BillingQuotaPeriod,
  BillingQuotaPolicyItem,
  BillingQuotaPolicyStatus,
  BillingQuotaRiskLevel,
  BillingQuotaSubjectType,
  BillingSubscriptionItem,
  BillingSubscriptionStatus,
  BillingWindow,
  UpdateBillingQuotaPolicyInput,
  UpdateBillingSubscriptionInput,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
  ) {}

  async getOverview(currentUser: AuthenticatedUser, window: string | undefined): Promise<BillingOverview> {
    const normalizedWindow = normalizeWindow(window);
    const since = windowStart(normalizedWindow);
    await this.ensureCommercialDefaults(currentUser);
    const period = currentBillingPeriod();
    const [modelLogs, apiKeys, conversationRuns, plans, subscription, invoices, quotaPolicies, periodUsage] = await this.prisma.$transaction([
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
      this.prisma.billingPlan.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            monthlyBasePrice: 'asc',
          },
        ],
      }),
      this.prisma.tenantSubscription.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        include: {
          plan: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      this.prisma.billingInvoice.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
      this.prisma.billingQuotaPolicy.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        orderBy: [
          {
            status: 'asc',
          },
          {
            updatedAt: 'desc',
          },
        ],
      }),
      this.prisma.platformUsageEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          occurredAt: {
            gte: period.start,
            lte: period.end,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 5000,
      }),
    ]);
    const quotaItems = apiKeys.map(mapApiKeyQuota);
    const modelCost = sum(modelLogs.map((log) => Number(log.totalCost)));
    const runStepCost = sum(conversationRuns.map((run) => extractRunStepCost(run.steps)));
    const totalTokens = modelLogs.reduce((total, log) => total + log.totalTokens, 0);
    const windowTotalCost = modelCost + runStepCost;
    const periodCost = roundMoney(sum(periodUsage.map((event) => Number(event.amount || event.quantity || 0))) || windowTotalCost);
    const periodTokens = Math.round(
      sum(periodUsage
        .filter((event) => event.metricType.toLowerCase().includes('token'))
        .map((event) => Number(event.quantity))),
    ) || totalTokens;
    const periodCalls = Math.round(
      sum(periodUsage
        .filter((event) => event.metricType.toLowerCase().includes('call') || event.metricType.toLowerCase().includes('run'))
        .map((event) => Number(event.quantity || event.amount || 1))),
    ) || modelLogs.length + conversationRuns.length;
    const mappedSubscription = subscription ? mapSubscription(subscription) : null;
    const mappedQuotaPolicies = quotaPolicies.map((policy) => mapQuotaPolicy(policy, {
      cost: periodCost,
      tokens: periodTokens,
      calls: periodCalls,
    }));
    const includedCost = mappedSubscription?.included_monthly_cost ?? 0;
    const overageCost = Math.max(0, periodCost - includedCost);
    const nextInvoiceAmount = (mappedSubscription?.base_price ?? 0) + overageCost;

    return {
      generated_at: new Date().toISOString(),
      window: normalizedWindow,
      summary: {
        total_cost: roundMoney(windowTotalCost),
        model_cost: roundMoney(modelCost),
        run_step_cost: roundMoney(runStepCost),
        total_tokens: totalTokens,
        model_calls: modelLogs.length,
        projected_monthly_cost: projectMonthlyCost(windowTotalCost, normalizedWindow),
        quota_usage_rate: average(quotaItems.map((item) => item.usage_rate).filter(isNumber)),
        risky_api_key_count: quotaItems.filter((item) => item.risk_level === 'WARNING' || item.risk_level === 'CRITICAL').length,
        subscription_status: mappedSubscription?.status ?? null,
        plan_name: mappedSubscription?.plan_name ?? null,
        plan_tier: mappedSubscription?.plan_tier ?? null,
        monthly_base_price: mappedSubscription?.base_price ?? 0,
        included_monthly_cost: includedCost,
        included_monthly_tokens: mappedSubscription?.included_monthly_tokens ?? 0,
        included_monthly_calls: mappedSubscription?.included_monthly_calls ?? 0,
        current_period_cost: periodCost,
        current_period_tokens: periodTokens,
        current_period_calls: periodCalls,
        overage_cost: roundMoney(overageCost),
        next_invoice_amount: roundMoney(nextInvoiceAmount),
        active_quota_policy_count: mappedQuotaPolicies.filter((policy) => policy.status === 'ACTIVE').length,
        quota_blocking_policy_count: mappedQuotaPolicies.filter((policy) => policy.action === 'BLOCK' && policy.status === 'ACTIVE').length,
      },
      plans: plans.map(mapPlan),
      subscription: mappedSubscription,
      invoices: invoices.map(mapInvoice),
      quota_policies: mappedQuotaPolicies,
      cost_trend: buildCostTrend(modelLogs, conversationRuns, normalizedWindow),
      provider_costs: buildProviderCosts(modelLogs),
      model_costs: buildModelCosts(modelLogs),
      quota_overview: quotaItems,
      risky_api_keys: quotaItems.filter((item) => item.risk_level === 'WARNING' || item.risk_level === 'CRITICAL'),
      conversation_costs: buildConversationCosts(conversationRuns),
    };
  }

  async updateSubscription(currentUser: AuthenticatedUser, dto: UpdateBillingSubscriptionInput): Promise<BillingSubscriptionItem> {
    const existing = await this.prisma.tenantSubscription.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
      include: {
        plan: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    if (!existing) {
      await this.ensureCommercialDefaults(currentUser);
      return this.updateSubscription(currentUser, dto);
    }

    const plan = dto.plan_id
      ? await this.prisma.billingPlan.findFirst({
          where: {
            tenantId: currentUser.tenantId,
            id: dto.plan_id,
            status: 'ACTIVE',
            deletedAt: null,
          },
        })
      : existing.plan;
    if (!plan) throw new NotFoundException('Billing plan not found');

    const billingCycle = dto.billing_cycle ?? existing.billingCycle;
    const updated = await this.prisma.tenantSubscription.update({
      where: {
        id: existing.id,
      },
      data: {
        planId: plan.id,
        status: dto.status ?? existing.status,
        billingCycle,
        currency: plan.currency,
        basePrice: billingCycle === 'YEARLY' ? plan.yearlyBasePrice : plan.monthlyBasePrice,
        includedMonthlyCost: plan.includedMonthlyCost,
        includedMonthlyTokens: plan.includedMonthlyTokens,
        includedMonthlyCalls: plan.includedMonthlyCalls,
        autoRenew: dto.auto_renew ?? existing.autoRenew,
        updatedBy: currentUser.id,
      },
      include: {
        plan: true,
      },
    });

    await this.recordBillingEvent(currentUser, {
      resourceType: 'BILLING_SUBSCRIPTION',
      resourceId: updated.id,
      eventType: 'billing.subscription.updated',
      summary: `租户订阅已更新为 ${updated.plan.name} / ${updated.status}。`,
      payloadJson: {
        subscription_id: updated.id,
        plan_id: updated.planId,
        plan_name: updated.plan.name,
        status: updated.status,
        billing_cycle: updated.billingCycle,
        base_price: Number(updated.basePrice),
        auto_renew: updated.autoRenew,
      },
      sourceId: updated.id,
    });

    return mapSubscription(updated);
  }

  async updateQuotaPolicy(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateBillingQuotaPolicyInput,
  ): Promise<BillingQuotaPolicyItem> {
    const existing = await this.prisma.billingQuotaPolicy.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id,
        deletedAt: null,
      },
    });
    if (!existing) throw new NotFoundException('Billing quota policy not found');

    const warnThreshold = dto.warn_threshold ?? Number(existing.warnThreshold);
    const hardThreshold = dto.hard_threshold ?? Number(existing.hardThreshold);
    if (warnThreshold > hardThreshold) {
      throw new BadRequestException('warn_threshold must be less than or equal to hard_threshold');
    }

    const updated = await this.prisma.billingQuotaPolicy.update({
      where: {
        id,
      },
      data: {
        limitValue: dto.limit_value === undefined ? undefined : new Prisma.Decimal(dto.limit_value),
        warnThreshold: dto.warn_threshold === undefined ? undefined : new Prisma.Decimal(dto.warn_threshold),
        hardThreshold: dto.hard_threshold === undefined ? undefined : new Prisma.Decimal(dto.hard_threshold),
        action: dto.action ?? undefined,
        status: dto.status ?? undefined,
        lastEvaluatedAt: new Date(),
        updatedBy: currentUser.id,
      },
    });

    await this.recordBillingEvent(currentUser, {
      resourceType: 'BILLING_QUOTA_POLICY',
      resourceId: updated.id,
      eventType: 'billing.quota_policy.updated',
      summary: `额度策略 ${updated.name} 已更新。`,
      payloadJson: {
        quota_policy_id: updated.id,
        subject_type: updated.subjectType,
        subject_id: updated.subjectId,
        metric_type: updated.metricType,
        limit_value: Number(updated.limitValue),
        warn_threshold: Number(updated.warnThreshold),
        hard_threshold: Number(updated.hardThreshold),
        action: updated.action,
        status: updated.status,
      },
      sourceId: updated.id,
    });

    return mapQuotaPolicy(updated, { cost: 0, tokens: 0, calls: 0 });
  }

  private async recordBillingEvent(
    currentUser: AuthenticatedUser,
    input: {
      resourceType: string;
      resourceId: string;
      eventType: string;
      summary: string;
      payloadJson: Prisma.InputJsonValue;
      sourceId: string;
    },
  ) {
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      parentTraceId: currentUser.parentSpanId ?? null,
      eventSource: 'billing',
      eventType: input.eventType,
      status: 'SUCCESS',
      severity: 'INFO',
      securityLevel: 'INTERNAL',
      billable: false,
      summary: input.summary,
      payloadJson: input.payloadJson,
      sourceSystem: 'billing',
      sourceId: input.sourceId,
      dedupeKey: `billing:${input.eventType}:${input.sourceId}:${Date.now()}`,
    });
  }

  private async ensureCommercialDefaults(currentUser: AuthenticatedUser) {
    const existingPlans = await this.prisma.billingPlan.count({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
    });
    if (existingPlans > 0) {
      await this.ensureDefaultSubscriptionAndPolicies(currentUser);
      return;
    }

    for (const plan of DEFAULT_BILLING_PLANS) {
      await this.prisma.billingPlan.upsert({
        where: {
          tenantId_code: {
            tenantId: currentUser.tenantId,
            code: plan.code,
          },
        },
        create: {
          tenantId: currentUser.tenantId,
          code: plan.code,
          name: plan.name,
          tier: plan.tier,
          description: plan.description,
          monthlyBasePrice: plan.monthlyBasePrice,
          yearlyBasePrice: plan.yearlyBasePrice,
          currency: plan.currency,
          includedMonthlyCost: plan.includedMonthlyCost,
          includedMonthlyTokens: plan.includedMonthlyTokens,
          includedMonthlyCalls: plan.includedMonthlyCalls,
          includedStorageGb: plan.includedStorageGb,
          overageUnitPrice: plan.overageUnitPrice,
          featureLimits: plan.featureLimits as Prisma.InputJsonValue,
          status: 'ACTIVE',
          sortOrder: plan.sortOrder,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
        update: {
          name: plan.name,
          tier: plan.tier,
          description: plan.description,
          monthlyBasePrice: plan.monthlyBasePrice,
          yearlyBasePrice: plan.yearlyBasePrice,
          currency: plan.currency,
          includedMonthlyCost: plan.includedMonthlyCost,
          includedMonthlyTokens: plan.includedMonthlyTokens,
          includedMonthlyCalls: plan.includedMonthlyCalls,
          includedStorageGb: plan.includedStorageGb,
          overageUnitPrice: plan.overageUnitPrice,
          featureLimits: plan.featureLimits as Prisma.InputJsonValue,
          status: 'ACTIVE',
          sortOrder: plan.sortOrder,
          deletedAt: null,
          updatedBy: currentUser.id,
        },
      });
    }

    await this.ensureDefaultSubscriptionAndPolicies(currentUser);
  }

  private async ensureDefaultSubscriptionAndPolicies(currentUser: AuthenticatedUser) {
    const period = currentBillingPeriod();
    const subscription = await this.prisma.tenantSubscription.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        deletedAt: null,
      },
    });
    if (!subscription) {
      const plan = await this.prisma.billingPlan.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          code: 'business',
          deletedAt: null,
        },
      });
      if (plan) {
        await this.prisma.tenantSubscription.create({
          data: {
            tenantId: currentUser.tenantId,
            planId: plan.id,
            status: 'ACTIVE',
            billingCycle: 'MONTHLY',
            currency: plan.currency,
            basePrice: plan.monthlyBasePrice,
            includedMonthlyCost: plan.includedMonthlyCost,
            includedMonthlyTokens: plan.includedMonthlyTokens,
            includedMonthlyCalls: plan.includedMonthlyCalls,
            startedAt: period.start,
            currentPeriodStart: period.start,
            currentPeriodEnd: period.end,
            autoRenew: true,
            metadata: { source: 'M63-3 seed' },
            createdBy: currentUser.id,
            updatedBy: currentUser.id,
          },
        });
      }
    }

    for (const policy of DEFAULT_QUOTA_POLICIES) {
      const existing = await this.prisma.billingQuotaPolicy.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          subjectType: policy.subjectType,
          subjectId: null,
          metricType: policy.metricType,
          period: policy.period,
          deletedAt: null,
        },
      });
      if (existing) continue;
      await this.prisma.billingQuotaPolicy.create({
        data: {
          tenantId: currentUser.tenantId,
          name: policy.name,
          subjectType: policy.subjectType,
          subjectId: null,
          metricType: policy.metricType,
          period: policy.period,
          limitValue: policy.limitValue,
          warnThreshold: policy.warnThreshold,
          hardThreshold: policy.hardThreshold,
          action: policy.action,
          status: 'ACTIVE',
          lastEvaluatedAt: new Date(),
          metadata: { source: 'M63-3 seed' },
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
      });
    }
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

type BillingPlanRecord = Prisma.BillingPlanGetPayload<object>;
type BillingSubscriptionRecord = Prisma.TenantSubscriptionGetPayload<{ include: { plan: true } }>;
type BillingInvoiceRecord = Prisma.BillingInvoiceGetPayload<object>;
type BillingQuotaPolicyRecord = Prisma.BillingQuotaPolicyGetPayload<object>;

const DEFAULT_BILLING_PLANS = [
  {
    code: 'team',
    name: '团队版',
    tier: 'TEAM',
    description: '适合小团队试点，包含基础 Agent、模型调用和知识库额度。',
    monthlyBasePrice: new Prisma.Decimal(199),
    yearlyBasePrice: new Prisma.Decimal(1990),
    currency: 'USD',
    includedMonthlyCost: new Prisma.Decimal(80),
    includedMonthlyTokens: 2_000_000,
    includedMonthlyCalls: 20_000,
    includedStorageGb: new Prisma.Decimal(100),
    overageUnitPrice: new Prisma.Decimal(0.00002),
    featureLimits: { agents: 30, api_keys: 20, agent_teams: 5, plugins: 5 },
    sortOrder: 10,
  },
  {
    code: 'business',
    name: '企业版',
    tier: 'BUSINESS',
    description: '适合企业内部运营，包含更高额度、多 Agent 协作和插件生态治理。',
    monthlyBasePrice: new Prisma.Decimal(699),
    yearlyBasePrice: new Prisma.Decimal(6990),
    currency: 'USD',
    includedMonthlyCost: new Prisma.Decimal(350),
    includedMonthlyTokens: 10_000_000,
    includedMonthlyCalls: 120_000,
    includedStorageGb: new Prisma.Decimal(500),
    overageUnitPrice: new Prisma.Decimal(0.000015),
    featureLimits: { agents: 200, api_keys: 100, agent_teams: 30, plugins: 30 },
    sortOrder: 20,
  },
  {
    code: 'enterprise',
    name: '旗舰版',
    tier: 'ENTERPRISE',
    description: '适合私有化和集团级部署，支持高级安全、全渠道发布和专属容量。',
    monthlyBasePrice: new Prisma.Decimal(1999),
    yearlyBasePrice: new Prisma.Decimal(19990),
    currency: 'USD',
    includedMonthlyCost: new Prisma.Decimal(1200),
    includedMonthlyTokens: 50_000_000,
    includedMonthlyCalls: 500_000,
    includedStorageGb: new Prisma.Decimal(2048),
    overageUnitPrice: new Prisma.Decimal(0.00001),
    featureLimits: { agents: 1000, api_keys: 500, agent_teams: 200, plugins: 200 },
    sortOrder: 30,
  },
] as const;

const DEFAULT_QUOTA_POLICIES = [
  {
    name: '租户月度成本额度',
    subjectType: 'TENANT',
    metricType: 'COST',
    period: 'MONTH',
    limitValue: new Prisma.Decimal(500),
    warnThreshold: new Prisma.Decimal(80),
    hardThreshold: new Prisma.Decimal(100),
    action: 'WARN',
  },
  {
    name: '租户月度词元额度',
    subjectType: 'TENANT',
    metricType: 'TOKEN',
    period: 'MONTH',
    limitValue: new Prisma.Decimal(10_000_000),
    warnThreshold: new Prisma.Decimal(80),
    hardThreshold: new Prisma.Decimal(100),
    action: 'THROTTLE',
  },
  {
    name: '租户月度调用额度',
    subjectType: 'TENANT',
    metricType: 'API_CALL',
    period: 'MONTH',
    limitValue: new Prisma.Decimal(120_000),
    warnThreshold: new Prisma.Decimal(80),
    hardThreshold: new Prisma.Decimal(100),
    action: 'BLOCK',
  },
] as const satisfies Array<{
  name: string;
  subjectType: BillingQuotaSubjectType;
  metricType: BillingQuotaMetricType;
  period: BillingQuotaPeriod;
  limitValue: Prisma.Decimal;
  warnThreshold: Prisma.Decimal;
  hardThreshold: Prisma.Decimal;
  action: BillingQuotaAction;
}>;

function normalizeWindow(window: string | undefined): BillingWindow {
  return window === '7d' ? '7d' : '24h';
}

function currentBillingPeriod() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);

  return { start, end };
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

function mapPlan(plan: BillingPlanRecord): BillingPlanItem {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    tier: plan.tier as BillingPlanItem['tier'],
    description: plan.description,
    monthly_base_price: Number(plan.monthlyBasePrice),
    yearly_base_price: Number(plan.yearlyBasePrice),
    currency: plan.currency,
    included_monthly_cost: Number(plan.includedMonthlyCost),
    included_monthly_tokens: plan.includedMonthlyTokens,
    included_monthly_calls: plan.includedMonthlyCalls,
    included_storage_gb: Number(plan.includedStorageGb),
    overage_unit_price: Number(plan.overageUnitPrice),
    feature_limits: normalizeJson(plan.featureLimits),
    status: plan.status as BillingPlanItem['status'],
    sort_order: plan.sortOrder,
    created_at: plan.createdAt.toISOString(),
    updated_at: plan.updatedAt.toISOString(),
  };
}

function mapSubscription(subscription: BillingSubscriptionRecord): BillingSubscriptionItem {
  return {
    id: subscription.id,
    plan_id: subscription.planId,
    plan_code: subscription.plan.code,
    plan_name: subscription.plan.name,
    plan_tier: subscription.plan.tier as BillingSubscriptionItem['plan_tier'],
    status: subscription.status as BillingSubscriptionStatus,
    billing_cycle: subscription.billingCycle as BillingCycle,
    currency: subscription.currency,
    base_price: Number(subscription.basePrice),
    included_monthly_cost: Number(subscription.includedMonthlyCost),
    included_monthly_tokens: subscription.includedMonthlyTokens,
    included_monthly_calls: subscription.includedMonthlyCalls,
    started_at: subscription.startedAt.toISOString(),
    current_period_start: subscription.currentPeriodStart.toISOString(),
    current_period_end: subscription.currentPeriodEnd.toISOString(),
    trial_ends_at: subscription.trialEndsAt?.toISOString() ?? null,
    canceled_at: subscription.canceledAt?.toISOString() ?? null,
    auto_renew: subscription.autoRenew,
    updated_at: subscription.updatedAt.toISOString(),
  };
}

function mapInvoice(invoice: BillingInvoiceRecord): BillingInvoiceItem {
  return {
    id: invoice.id,
    invoice_no: invoice.invoiceNo,
    status: invoice.status as BillingInvoiceItem['status'],
    currency: invoice.currency,
    subtotal_amount: Number(invoice.subtotalAmount),
    discount_amount: Number(invoice.discountAmount),
    tax_amount: Number(invoice.taxAmount),
    total_amount: Number(invoice.totalAmount),
    paid_amount: Number(invoice.paidAmount),
    period_start: invoice.periodStart.toISOString(),
    period_end: invoice.periodEnd.toISOString(),
    due_at: invoice.dueAt?.toISOString() ?? null,
    paid_at: invoice.paidAt?.toISOString() ?? null,
    line_items: normalizeJson(invoice.lineItems),
    created_at: invoice.createdAt.toISOString(),
  };
}

function mapQuotaPolicy(
  policy: BillingQuotaPolicyRecord,
  usage: { cost: number; tokens: number; calls: number },
): BillingQuotaPolicyItem {
  const currentUsage = quotaUsageFor(policy.metricType, usage);
  const limit = Number(policy.limitValue);
  const usageRate = limit <= 0 ? 0 : Number(((currentUsage / limit) * 100).toFixed(1));

  return {
    id: policy.id,
    name: policy.name,
    subject_type: policy.subjectType as BillingQuotaSubjectType,
    subject_id: policy.subjectId,
    metric_type: policy.metricType as BillingQuotaMetricType,
    period: policy.period as BillingQuotaPeriod,
    limit_value: limit,
    warn_threshold: Number(policy.warnThreshold),
    hard_threshold: Number(policy.hardThreshold),
    action: policy.action as BillingQuotaAction,
    status: policy.status as BillingQuotaPolicyStatus,
    current_usage: roundMoney(currentUsage),
    usage_rate: usageRate,
    risk_level: quotaRiskLevelByThreshold(usageRate, Number(policy.warnThreshold), Number(policy.hardThreshold)),
    last_evaluated_at: policy.lastEvaluatedAt?.toISOString() ?? null,
    created_at: policy.createdAt.toISOString(),
    updated_at: policy.updatedAt.toISOString(),
  };
}

function quotaUsageFor(metricType: string, usage: { cost: number; tokens: number; calls: number }) {
  if (metricType === 'COST') return usage.cost;
  if (metricType === 'TOKEN') return usage.tokens;
  if (metricType === 'MODEL_CALL' || metricType === 'API_CALL' || metricType === 'AGENT_RUN') return usage.calls;
  return 0;
}

function quotaRiskLevelByThreshold(usageRate: number, warnThreshold: number, hardThreshold: number): BillingQuotaRiskLevel {
  if (usageRate >= hardThreshold) return 'CRITICAL';
  if (usageRate >= warnThreshold) return 'WARNING';
  return 'NORMAL';
}

function quotaRiskLevel(usageRate: number | null): BillingQuotaRiskLevel {
  if (usageRate === null) return 'UNLIMITED';
  if (usageRate >= 90) return 'CRITICAL';
  if (usageRate >= 70) return 'WARNING';
  return 'NORMAL';
}

function normalizeJson(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
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
