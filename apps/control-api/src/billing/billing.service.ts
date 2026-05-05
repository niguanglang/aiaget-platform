import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  BillingAdjustmentItem,
  BillingAdjustmentStatus,
  BillingAdjustmentType,
  BillingApiKeyQuotaItem,
  BillingCycle,
  BillingConversationCostItem,
  BillingCostTrendPoint,
  BillingInvoiceItem,
  BillingModelCostItem,
  BillingOverview,
  BillingQuotaEnforcementInput,
  BillingQuotaEnforcementResult,
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
  CreateBillingAdjustmentInput,
  UpdateBillingInvoiceStatusInput,
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
    await this.syncCurrentBillingInvoice(currentUser, period);
    const [modelLogs, apiKeys, conversationRuns, plans, subscription, invoices, quotaPolicies, periodUsage, adjustments] = await this.prisma.$transaction([
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
      this.prisma.billingAdjustment.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
        },
        include: {
          invoice: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 12,
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
    const adjustmentTotal = roundMoney(sum(adjustments
      .filter((item) => item.status === 'APPROVED' || item.status === 'APPLIED')
      .map((item) => signedAdjustmentAmount(item.type, Number(item.amount)))));
    const nextInvoiceAmount = Math.max(0, (mappedSubscription?.base_price ?? 0) + overageCost + adjustmentTotal);

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
        adjustment_total: adjustmentTotal,
        next_invoice_amount: roundMoney(nextInvoiceAmount),
        active_quota_policy_count: mappedQuotaPolicies.filter((policy) => policy.status === 'ACTIVE').length,
        quota_blocking_policy_count: mappedQuotaPolicies.filter((policy) => policy.action === 'BLOCK' && policy.status === 'ACTIVE').length,
      },
      plans: plans.map(mapPlan),
      subscription: mappedSubscription,
      invoices: invoices.map(mapInvoice),
      quota_policies: mappedQuotaPolicies,
      adjustments: adjustments.map(mapAdjustment),
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

  async createAdjustment(currentUser: AuthenticatedUser, dto: CreateBillingAdjustmentInput): Promise<BillingAdjustmentItem> {
    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Adjustment amount must be greater than 0');
    }
    if (!dto.reason?.trim()) {
      throw new BadRequestException('Adjustment reason is required');
    }

    const invoice = dto.invoice_id
      ? await this.prisma.billingInvoice.findFirst({
          where: {
            id: dto.invoice_id,
            tenantId: currentUser.tenantId,
            deletedAt: null,
          },
        })
      : null;
    if (dto.invoice_id && !invoice) throw new NotFoundException('Billing invoice not found');

    const status = dto.status ?? 'PENDING';
    const now = new Date();
    const adjustment = await this.prisma.billingAdjustment.create({
      data: {
        tenantId: currentUser.tenantId,
        invoiceId: invoice?.id ?? null,
        adjustmentNo: await this.nextAdjustmentNo(currentUser.tenantId),
        type: dto.type,
        status,
        currency: invoice?.currency ?? 'USD',
        amount: new Prisma.Decimal(amount),
        reason: dto.reason.trim(),
        description: dto.description?.trim() || null,
        effectiveAt: status === 'APPROVED' || status === 'APPLIED' ? now : null,
        approvedAt: status === 'APPROVED' || status === 'APPLIED' ? now : null,
        approvedBy: status === 'APPROVED' || status === 'APPLIED' ? currentUser.id : null,
        sourceType: 'MANUAL',
        sourceId: currentUser.id,
        metadata: {
          request_id: currentUser.requestId ?? null,
          trace_id: currentUser.traceId ?? null,
        },
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      include: {
        invoice: true,
      },
    });

    await this.recordBillingEvent(currentUser, {
      resourceType: 'BILLING_ADJUSTMENT',
      resourceId: adjustment.id,
      eventType: 'billing.adjustment.created',
      summary: `创建计费调整单 ${adjustment.adjustmentNo}`,
      sourceId: adjustment.id,
      payloadJson: {
        adjustment_no: adjustment.adjustmentNo,
        invoice_id: adjustment.invoiceId,
        type: adjustment.type,
        status: adjustment.status,
        amount: Number(adjustment.amount),
        signed_amount: signedAdjustmentAmount(adjustment.type, Number(adjustment.amount)),
        reason: adjustment.reason,
      },
    });

    return mapAdjustment(adjustment);
  }

  async approveAdjustment(
    currentUser: AuthenticatedUser,
    id: string,
    dto: { reason?: string | null },
  ): Promise<BillingAdjustmentItem> {
    const existing = await this.findAdjustment(currentUser, id);
    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Only pending billing adjustments can be approved');
    }

    const updated = await this.prisma.billingAdjustment.update({
      where: {
        id: existing.id,
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: currentUser.id,
        updatedBy: currentUser.id,
        metadata: mergeMetadata(existing.metadata, {
          approved_reason: dto.reason?.trim() || null,
        }),
      },
      include: {
        invoice: true,
      },
    });

    await this.recordAdjustmentEvent(currentUser, updated, 'billing.adjustment.approved', `调账单 ${updated.adjustmentNo} 已审批通过。`, dto.reason);

    return mapAdjustment(updated);
  }

  async applyAdjustment(
    currentUser: AuthenticatedUser,
    id: string,
    dto: { reason?: string | null },
  ): Promise<BillingAdjustmentItem> {
    const existing = await this.findAdjustment(currentUser, id);
    if (existing.status !== 'APPROVED') {
      throw new BadRequestException('Only approved billing adjustments can be applied');
    }

    const now = new Date();
    const updated = await this.prisma.billingAdjustment.update({
      where: {
        id: existing.id,
      },
      data: {
        status: 'APPLIED',
        effectiveAt: existing.effectiveAt ?? now,
        updatedBy: currentUser.id,
        metadata: mergeMetadata(existing.metadata, {
          applied_reason: dto.reason?.trim() || null,
        }),
      },
      include: {
        invoice: true,
      },
    });

    await this.rebuildInvoiceForAdjustment(currentUser, updated);
    await this.recordAdjustmentEvent(currentUser, updated, 'billing.adjustment.applied', `调账单 ${updated.adjustmentNo} 已应用到账单。`, dto.reason);

    return mapAdjustment(updated);
  }

  async voidAdjustment(
    currentUser: AuthenticatedUser,
    id: string,
    dto: { reason: string },
  ): Promise<BillingAdjustmentItem> {
    const reason = dto.reason?.trim();
    if (!reason) throw new BadRequestException('Void reason is required');

    const existing = await this.findAdjustment(currentUser, id);
    if (existing.status === 'VOID') {
      return mapAdjustment(existing);
    }
    if (existing.status === 'APPLIED') {
      throw new BadRequestException('Applied billing adjustments cannot be voided');
    }

    const updated = await this.prisma.billingAdjustment.update({
      where: {
        id: existing.id,
      },
      data: {
        status: 'VOID',
        updatedBy: currentUser.id,
        metadata: mergeMetadata(existing.metadata, {
          void_reason: reason,
        }),
      },
      include: {
        invoice: true,
      },
    });

    await this.recordAdjustmentEvent(currentUser, updated, 'billing.adjustment.voided', `调账单 ${updated.adjustmentNo} 已作废。`, reason);

    return mapAdjustment(updated);
  }

  async recalculateCurrentInvoice(currentUser: AuthenticatedUser): Promise<BillingInvoiceItem> {
    await this.ensureCommercialDefaults(currentUser);
    const invoice = await this.syncCurrentBillingInvoice(currentUser, currentBillingPeriod(), true);
    if (!invoice) throw new NotFoundException('Billing invoice not found');
    return mapInvoice(invoice);
  }

  async lockInvoice(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateBillingInvoiceStatusInput,
  ): Promise<BillingInvoiceItem> {
    const invoice = await this.findInvoice(currentUser, id);
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only draft billing invoices can be locked');
    }

    return this.updateInvoiceStatus(currentUser, invoice, 'OPEN', dto, 'billing.invoice.locked', `账单 ${invoice.invoiceNo} 已锁账。`);
  }

  async markInvoicePaid(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateBillingInvoiceStatusInput,
  ): Promise<BillingInvoiceItem> {
    const invoice = await this.findInvoice(currentUser, id);
    if (invoice.status !== 'OPEN' && invoice.status !== 'OVERDUE') {
      throw new BadRequestException('Only open or overdue billing invoices can be marked paid');
    }

    return this.updateInvoiceStatus(currentUser, invoice, 'PAID', dto, 'billing.invoice.paid', `账单 ${invoice.invoiceNo} 已标记为已支付。`);
  }

  async voidInvoice(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateBillingInvoiceStatusInput,
  ): Promise<BillingInvoiceItem> {
    const invoice = await this.findInvoice(currentUser, id);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Paid billing invoices cannot be voided');
    }
    if (invoice.status === 'VOID') {
      return mapInvoice(invoice);
    }

    return this.updateInvoiceStatus(currentUser, invoice, 'VOID', dto, 'billing.invoice.voided', `账单 ${invoice.invoiceNo} 已作废。`);
  }

  async markInvoiceOverdue(
    currentUser: AuthenticatedUser,
    id: string,
    dto: UpdateBillingInvoiceStatusInput,
  ): Promise<BillingInvoiceItem> {
    const invoice = await this.findInvoice(currentUser, id);
    if (invoice.status !== 'OPEN') {
      throw new BadRequestException('Only open billing invoices can be marked overdue');
    }

    return this.updateInvoiceStatus(currentUser, invoice, 'OVERDUE', dto, 'billing.invoice.overdue', `账单 ${invoice.invoiceNo} 已标记逾期。`);
  }

  async enforceQuota(
    currentUser: AuthenticatedUser,
    dto: BillingQuotaEnforcementInput,
  ): Promise<BillingQuotaEnforcementResult> {
    await this.ensureCommercialDefaults(currentUser);
    const period = quotaPeriodRange(dto.period ?? 'MONTH');
    const usage = await this.calculateQuotaUsage(currentUser, dto, period);
    const currentUsage = roundMoney(usage + (dto.usage_delta ?? 0));
    const policy = await this.prisma.billingQuotaPolicy.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        subjectType: dto.subject_type,
        subjectId: dto.subject_id ?? null,
        metricType: dto.metric_type,
        period: dto.period ?? 'MONTH',
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }) ?? await this.prisma.billingQuotaPolicy.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        subjectType: dto.subject_type,
        subjectId: null,
        metricType: dto.metric_type,
        period: dto.period ?? 'MONTH',
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!policy) {
      return {
        allow: true,
        block: false,
        reason: 'No active billing quota policy matched',
        current_usage: currentUsage,
        limit: null,
        action: null,
        policy_id: null,
        policy_name: null,
        usage_rate: null,
      };
    }

    await this.prisma.billingQuotaPolicy.update({
      where: {
        id: policy.id,
      },
      data: {
        lastEvaluatedAt: new Date(),
      },
    });

    const limit = Number(policy.limitValue);
    const usageRate = limit <= 0 ? null : Number(((currentUsage / limit) * 100).toFixed(1));
    const hardThreshold = Number(policy.hardThreshold);
    const action = policy.action as BillingQuotaAction;
    const block = usageRate !== null && usageRate >= hardThreshold && (action === 'BLOCK' || action === 'REQUIRE_APPROVAL');
    const reason = block
      ? `Quota ${policy.name} reached ${usageRate}% and requires ${action}`
      : usageRate !== null && usageRate >= Number(policy.warnThreshold)
        ? `Quota ${policy.name} reached warning threshold ${usageRate}%`
        : `Quota ${policy.name} allows current usage`;

    return {
      allow: !block,
      block,
      reason,
      current_usage: currentUsage,
      limit,
      action,
      policy_id: policy.id,
      policy_name: policy.name,
      usage_rate: usageRate,
    };
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

  private async findAdjustment(currentUser: AuthenticatedUser, id: string): Promise<BillingAdjustmentRecord> {
    const adjustment = await this.prisma.billingAdjustment.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id,
        deletedAt: null,
      },
      include: {
        invoice: true,
      },
    });
    if (!adjustment) throw new NotFoundException('Billing adjustment not found');
    return adjustment;
  }

  private async findInvoice(currentUser: AuthenticatedUser, id: string): Promise<BillingInvoiceRecord> {
    const invoice = await this.prisma.billingInvoice.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id,
        deletedAt: null,
      },
    });
    if (!invoice) throw new NotFoundException('Billing invoice not found');
    return invoice;
  }

  private async updateInvoiceStatus(
    currentUser: AuthenticatedUser,
    invoice: BillingInvoiceRecord,
    status: BillingInvoiceItem['status'],
    dto: UpdateBillingInvoiceStatusInput,
    eventType: string,
    summary: string,
  ): Promise<BillingInvoiceItem> {
    const paidAmount = status === 'PAID' ? dto.paid_amount ?? Number(invoice.totalAmount) : undefined;
    const updated = await this.prisma.billingInvoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status,
        paidAmount: paidAmount === undefined ? undefined : new Prisma.Decimal(paidAmount),
        paidAt: status === 'PAID' ? (dto.paid_at ? new Date(dto.paid_at) : new Date()) : status === 'VOID' ? null : undefined,
        updatedBy: currentUser.id,
      },
    });

    await this.recordBillingEvent(currentUser, {
      resourceType: 'BILLING_INVOICE',
      resourceId: updated.id,
      eventType,
      summary,
      payloadJson: {
        invoice_id: updated.id,
        invoice_no: updated.invoiceNo,
        previous_status: invoice.status,
        status: updated.status,
        reason: dto.reason?.trim() || null,
        total_amount: Number(updated.totalAmount),
        paid_amount: Number(updated.paidAmount),
      },
      sourceId: updated.id,
    });

    return mapInvoice(updated);
  }

  private async rebuildInvoiceForAdjustment(currentUser: AuthenticatedUser, adjustment: BillingAdjustmentRecord) {
    if (adjustment.invoiceId) {
      const invoice = await this.loadBillingInvoice(currentUser.tenantId, adjustment.invoiceId);
      await this.rebuildInvoiceItems(currentUser, invoice, false);
      return;
    }

    await this.syncCurrentBillingInvoice(currentUser, currentBillingPeriod(), false);
  }

  private async recordAdjustmentEvent(
    currentUser: AuthenticatedUser,
    adjustment: BillingAdjustmentRecord,
    eventType: string,
    summary: string,
    reason?: string | null,
  ) {
    await this.recordBillingEvent(currentUser, {
      resourceType: 'BILLING_ADJUSTMENT',
      resourceId: adjustment.id,
      eventType,
      summary,
      sourceId: adjustment.id,
      payloadJson: {
        adjustment_id: adjustment.id,
        adjustment_no: adjustment.adjustmentNo,
        invoice_id: adjustment.invoiceId,
        invoice_no: adjustment.invoice?.invoiceNo ?? null,
        type: adjustment.type,
        status: adjustment.status,
        amount: Number(adjustment.amount),
        signed_amount: signedAdjustmentAmount(adjustment.type, Number(adjustment.amount)),
        reason: reason?.trim() || null,
      },
    });
  }

  private async calculateQuotaUsage(
    currentUser: AuthenticatedUser,
    dto: BillingQuotaEnforcementInput,
    period: { start: Date; end: Date },
  ) {
    const where: Prisma.PlatformUsageEventWhereInput = {
      tenantId: currentUser.tenantId,
      subjectType: dto.subject_type,
      metricType: dto.metric_type,
      occurredAt: {
        gte: period.start,
        lt: period.end,
      },
    };
    if (dto.subject_id !== undefined) {
      where.subjectId = dto.subject_id;
    }

    const usage = await this.prisma.platformUsageEvent.aggregate({
      where,
      _sum: {
        quantity: true,
        amount: true,
      },
    });

    if (dto.metric_type === 'COST') return Number(usage._sum.amount ?? 0);
    return Number(usage._sum.quantity ?? 0);
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

  private async syncCurrentBillingInvoice(currentUser: AuthenticatedUser, period: { start: Date; end: Date }, forceRebuild = false) {
    const subscription = await this.prisma.tenantSubscription.findFirst({
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
    if (!subscription) return null;

    const invoiceNo = await this.nextInvoiceNo(currentUser.tenantId, period.start);
    const existing = await this.prisma.billingInvoice.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        subscriptionId: subscription.id,
        periodStart: period.start,
        periodEnd: period.end,
        deletedAt: null,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        invoiceItems: true,
        adjustments: {
          where: {
            deletedAt: null,
          },
        },
      },
    });
    if (existing) {
      return this.rebuildInvoiceItems(currentUser, existing, forceRebuild);
    }

    const created = await this.prisma.billingInvoice.create({
      data: {
        tenantId: currentUser.tenantId,
        subscriptionId: subscription.id,
        invoiceNo,
        status: 'OPEN',
        currency: subscription.currency,
        subtotalAmount: new Prisma.Decimal(0),
        discountAmount: new Prisma.Decimal(0),
        taxAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(0),
        paidAmount: new Prisma.Decimal(0),
        periodStart: period.start,
        periodEnd: period.end,
        dueAt: period.end,
        lineItems: [],
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        invoiceItems: true,
        adjustments: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    return this.rebuildInvoiceItems(currentUser, created, forceRebuild);
  }

  private async rebuildInvoiceItems(
    currentUser: AuthenticatedUser,
    invoice: BillingInvoiceWithDetailsRecord,
    forceRebuild = false,
  ): Promise<BillingInvoiceWithDetailsRecord> {
    const subscription = invoice.subscription;
    if (!subscription) return invoice;
    const [modelUsage, conversationRuns, usageEvents, adjustments] = await this.prisma.$transaction([
      this.prisma.modelCallLog.findMany({
        where: {
          tenantId: currentUser.tenantId,
          createdAt: {
            gte: invoice.periodStart,
            lt: invoice.periodEnd,
          },
        },
        include: {
          provider: true,
          modelConfig: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.conversationRun.findMany({
        where: {
          tenantId: currentUser.tenantId,
          createdAt: {
            gte: invoice.periodStart,
            lt: invoice.periodEnd,
          },
        },
        include: {
          agent: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.platformUsageEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          occurredAt: {
            gte: invoice.periodStart,
            lt: invoice.periodEnd,
          },
          billable: true,
        },
        orderBy: {
          occurredAt: 'asc',
        },
      }),
      this.prisma.billingAdjustment.findMany({
        where: {
          tenantId: currentUser.tenantId,
          deletedAt: null,
          OR: [
            {
              invoiceId: invoice.id,
            },
            {
              invoiceId: null,
              effectiveAt: {
                gte: invoice.periodStart,
                lt: invoice.periodEnd,
              },
              status: {
                in: ['APPROVED', 'APPLIED'],
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    const lineItems = buildInvoiceLineItems({
      invoice,
      subscription,
      modelUsage,
      conversationRuns,
      usageEvents,
      adjustments,
    });
    const financials = summarizeInvoiceLineItems(lineItems);
    const updatedInvoice = await this.prisma.billingInvoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        subtotalAmount: new Prisma.Decimal(financials.subtotalAmount),
        discountAmount: new Prisma.Decimal(financials.discountAmount),
        taxAmount: new Prisma.Decimal(financials.taxAmount),
        totalAmount: new Prisma.Decimal(financials.totalAmount),
        paidAmount: new Prisma.Decimal(financials.paidAmount),
        lineItems: {
          generated_at: new Date().toISOString(),
          totals: financials,
          items: lineItems.map((item) => item.metadata),
        } as Prisma.InputJsonValue,
        status: forceRebuild ? 'DRAFT' : invoice.status,
        updatedBy: currentUser.id,
      },
    });

    await this.prisma.billingInvoiceLineItem.deleteMany({
      where: {
        invoiceId: updatedInvoice.id,
      },
    });
    if (lineItems.length > 0) {
      await this.prisma.billingInvoiceLineItem.createMany({
        data: lineItems.map((item, index) => ({
          tenantId: currentUser.tenantId,
          invoiceId: updatedInvoice.id,
          itemNo: item.item_no || `ITEM-${String(index + 1).padStart(4, '0')}`,
          itemType: item.item_type,
          title: item.title,
          description: item.description,
          sourceType: item.source_type,
          sourceId: item.source_id,
          metricType: item.metric_type,
          quantity: new Prisma.Decimal(item.quantity),
          unit: item.unit,
          unitPrice: new Prisma.Decimal(item.unit_price),
          amount: new Prisma.Decimal(item.amount),
          currency: item.currency,
          status: item.status,
          metadata: item.metadata as Prisma.InputJsonValue,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        })),
      });
    }

    if (forceRebuild) {
      await this.recordBillingEvent(currentUser, {
        resourceType: 'BILLING_INVOICE',
        resourceId: updatedInvoice.id,
        eventType: 'billing.invoice.recalculated',
        summary: `账单 ${updatedInvoice.invoiceNo} 已重算。`,
        payloadJson: {
          invoice_id: updatedInvoice.id,
          invoice_no: updatedInvoice.invoiceNo,
          item_count: lineItems.length,
          subtotal_amount: financials.subtotalAmount,
          discount_amount: financials.discountAmount,
          tax_amount: financials.taxAmount,
          total_amount: financials.totalAmount,
        },
        sourceId: updatedInvoice.id,
      });
    }

    return this.loadBillingInvoice(currentUser.tenantId, updatedInvoice.id);
  }

  private async loadBillingInvoice(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.billingInvoice.findFirst({
      where: {
        tenantId,
        id: invoiceId,
        deletedAt: null,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        invoiceItems: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        adjustments: {
          where: {
            deletedAt: null,
          },
          include: {
            invoice: true,
          },
        },
      },
    });
    if (!invoice) throw new NotFoundException('Billing invoice not found');
    return invoice;
  }

  private async nextAdjustmentNo(tenantId: string) {
    const date = new Date();
    const prefix = `ADJ-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.billingAdjustment.count({
      where: {
        tenantId,
        adjustmentNo: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private async nextInvoiceNo(tenantId: string, periodStart: Date) {
    const prefix = `INV-${periodStart.getFullYear()}${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.billingInvoice.count({
      where: {
        tenantId,
        invoiceNo: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
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
type BillingInvoiceWithDetailsRecord = Prisma.BillingInvoiceGetPayload<{
  include: {
    subscription: {
      include: {
        plan: true;
      };
    };
    invoiceItems: true;
    adjustments: true;
  };
}>;
type BillingAdjustmentBaseRecord = Prisma.BillingAdjustmentGetPayload<object>;
type BillingAdjustmentRecord = Prisma.BillingAdjustmentGetPayload<{ include: { invoice: true } }>;
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

function currentDailyPeriod() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function quotaPeriodRange(period: BillingQuotaPeriod) {
  return period === 'DAY' ? currentDailyPeriod() : currentBillingPeriod();
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
    line_items: normalizeInvoiceLineItems(invoice.lineItems),
    created_at: invoice.createdAt.toISOString(),
  };
}

function mapAdjustment(adjustment: BillingAdjustmentRecord): BillingAdjustmentItem {
  const amount = Number(adjustment.amount);

  return {
    id: adjustment.id,
    invoice_id: adjustment.invoiceId,
    invoice_no: adjustment.invoice?.invoiceNo ?? null,
    adjustment_no: adjustment.adjustmentNo,
    type: adjustment.type as BillingAdjustmentType,
    status: adjustment.status as BillingAdjustmentStatus,
    currency: adjustment.currency,
    amount,
    signed_amount: signedAdjustmentAmount(adjustment.type, amount),
    reason: adjustment.reason,
    description: adjustment.description,
    effective_at: adjustment.effectiveAt?.toISOString() ?? null,
    approved_at: adjustment.approvedAt?.toISOString() ?? null,
    approved_by: adjustment.approvedBy,
    source_type: adjustment.sourceType,
    source_id: adjustment.sourceId,
    created_at: adjustment.createdAt.toISOString(),
    updated_at: adjustment.updatedAt.toISOString(),
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

function signedAdjustmentAmount(type: string, amount: number) {
  if (type === 'DEBIT') return roundMoney(Math.abs(amount));
  return roundMoney(-Math.abs(amount));
}

function normalizeJson(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function mergeMetadata(value: Prisma.JsonValue | null, patch: Record<string, unknown>): Prisma.InputJsonValue {
  const current = normalizeJson(value) ?? {};
  return JSON.parse(JSON.stringify({
    ...current,
    ...patch,
  })) as Prisma.InputJsonValue;
}

function normalizeInvoiceLineItems(value: Prisma.JsonValue | null) {
  if (!value) return null;
  if (Array.isArray(value)) {
    return { items: value } as Record<string, unknown>;
  }
  if (typeof value === 'object') {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  }
  return null;
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

function buildInvoiceLineItems(input: {
  invoice: BillingInvoiceWithDetailsRecord;
  subscription: BillingSubscriptionRecord;
  modelUsage: ModelLogRecord[];
  conversationRuns: ConversationRunRecord[];
  usageEvents: PlatformUsageEventRecord[];
  adjustments: BillingAdjustmentBaseRecord[];
}): PreparedInvoiceLineItem[] {
  const lineItems: PreparedInvoiceLineItem[] = [];
  const invoiceCurrency = input.invoice.currency;

  lineItems.push({
    item_no: 'ITEM-0001',
    item_type: 'PLAN_BASE',
    title: `${input.subscription.plan.name} ${input.subscription.billingCycle === 'YEARLY' ? '年费' : '月费'}`,
    description: `订阅周期 ${input.subscription.currentPeriodStart.toISOString()} - ${input.subscription.currentPeriodEnd.toISOString()}`,
    source_type: 'TENANT_SUBSCRIPTION',
    source_id: input.subscription.id,
    metric_type: 'SUBSCRIPTION_BASE',
    quantity: 1,
    unit: 'seat',
    unit_price: roundMoney(Number(input.subscription.basePrice)),
    amount: roundMoney(Number(input.subscription.basePrice)),
    currency: invoiceCurrency,
    status: 'POSTED',
    metadata: {
      kind: 'subscription',
      subscription_id: input.subscription.id,
      plan_id: input.subscription.planId,
      plan_code: input.subscription.plan.code,
      billing_cycle: input.subscription.billingCycle,
      current_period_start: input.subscription.currentPeriodStart.toISOString(),
      current_period_end: input.subscription.currentPeriodEnd.toISOString(),
      included_monthly_cost: Number(input.subscription.includedMonthlyCost),
    },
  });

  const modelGroups = groupBy(input.modelUsage, (log) => `${log.providerId}:${log.modelConfigId ?? log.requestModel}`);
  let nextItemNo = 2;
  for (const items of modelGroups.values()) {
    const first = items[0];
    const amount = roundMoney(sum(items.map((item) => Number(item.totalCost))));
    if (amount <= 0) continue;
    lineItems.push({
      item_no: `ITEM-${String(nextItemNo++).padStart(4, '0')}`,
      item_type: 'MODEL_USAGE',
      title: `模型调用 ${first?.modelConfig?.name ?? first?.requestModel ?? '未知模型'}`,
      description: `${first?.provider.name ?? '未知供应商'} · ${items.length} 次调用`,
      source_type: 'MODEL_CALL',
      source_id: first?.modelConfigId ?? first?.requestModel ?? first?.providerId ?? null,
      metric_type: 'MODEL_COST',
      quantity: items.reduce((total, item) => total + item.totalTokens, 0),
      unit: 'token',
      unit_price: roundMoney(amount / Math.max(1, items.reduce((total, item) => total + item.totalTokens, 0))),
      amount,
      currency: invoiceCurrency,
      status: 'POSTED',
      metadata: {
        kind: 'model_usage',
        provider_id: first?.providerId ?? null,
        provider_name: first?.provider.name ?? null,
        model_config_id: first?.modelConfigId ?? null,
        model_name: first?.modelConfig?.name ?? null,
        request_model: first?.requestModel ?? null,
        call_count: items.length,
        total_tokens: items.reduce((total, item) => total + item.totalTokens, 0),
        total_cost: amount,
      },
    });
  }

  const runGroups = groupBy(input.conversationRuns, (run) => run.agentId);
  for (const items of runGroups.values()) {
    const first = items[0];
    const amount = roundMoney(sum(items.map((item) => extractRunStepCost(item.steps))));
    if (amount <= 0) continue;
    lineItems.push({
      item_no: `ITEM-${String(nextItemNo++).padStart(4, '0')}`,
      item_type: 'RUN_USAGE',
      title: `对话运行 ${first?.agent.name ?? '未知智能体'}`,
      description: `${items.length} 次运行`,
      source_type: 'CONVERSATION_RUN',
      source_id: first?.agentId ?? null,
      metric_type: 'RUN_STEP_COST',
      quantity: items.reduce((total, item) => total + item.totalTokens, 0),
      unit: 'token',
      unit_price: roundMoney(amount / Math.max(1, items.reduce((total, item) => total + item.totalTokens, 0))),
      amount,
      currency: invoiceCurrency,
      status: 'POSTED',
      metadata: {
        kind: 'conversation_run',
        agent_id: first?.agentId ?? null,
        agent_name: first?.agent.name ?? null,
        run_count: items.length,
        total_tokens: items.reduce((total, item) => total + item.totalTokens + extractRunStepTokens(item.steps), 0),
        total_cost: amount,
      },
    });
  }

  const usageGroups = groupBy(input.usageEvents, (event) => `${event.metricType}:${event.resourceType}:${event.sourceSystem ?? 'unknown'}`);
  for (const items of usageGroups.values()) {
    const first = items[0];
    const amount = roundMoney(sum(items.map((item) => Number(item.amount || item.quantity || 0))));
    if (amount <= 0) continue;
    lineItems.push({
      item_no: `ITEM-${String(nextItemNo++).padStart(4, '0')}`,
      item_type: 'PLATFORM_USAGE',
      title: `平台用量 ${first?.metricType ?? 'UNKNOWN'}`,
      description: `${first?.resourceType ?? 'UNKNOWN'} · ${items.length} 条记录`,
      source_type: first?.sourceSystem ?? 'PLATFORM_USAGE_EVENT',
      source_id: first?.sourceId ?? first?.eventId ?? null,
      metric_type: first?.metricType ?? null,
      quantity: items.reduce((total, item) => total + Number(item.quantity), 0),
      unit: first?.unit ?? 'unit',
      unit_price: roundMoney(sum(items.map((item) => Number(item.unitPrice)))),
      amount,
      currency: first?.currency ?? invoiceCurrency,
      status: 'POSTED',
      metadata: {
        kind: 'platform_usage',
        metric_type: first?.metricType ?? null,
        resource_type: first?.resourceType ?? null,
        resource_id: first?.resourceId ?? null,
        source_system: first?.sourceSystem ?? null,
        source_id: first?.sourceId ?? null,
        event_count: items.length,
        quantity_total: items.reduce((total, item) => total + Number(item.quantity), 0),
        amount_total: amount,
      },
    });
  }

  const adjustmentItems = input.adjustments.filter((item) => item.status === 'APPROVED' || item.status === 'APPLIED');
  for (const adjustment of adjustmentItems) {
    const signedAmount = signedAdjustmentAmount(adjustment.type, Number(adjustment.amount));
    lineItems.push({
      item_no: `ITEM-${String(nextItemNo++).padStart(4, '0')}`,
      item_type: 'ADJUSTMENT',
      title: `调整单 ${adjustment.adjustmentNo}`,
      description: adjustment.reason,
      source_type: 'BILLING_ADJUSTMENT',
      source_id: adjustment.id,
      metric_type: 'ADJUSTMENT',
      quantity: 1,
      unit: 'adj',
      unit_price: signedAmount,
      amount: signedAmount,
      currency: adjustment.currency,
      status: 'POSTED',
      metadata: {
        kind: 'adjustment',
        adjustment_id: adjustment.id,
        adjustment_no: adjustment.adjustmentNo,
        invoice_id: adjustment.invoiceId,
        type: adjustment.type,
        status: adjustment.status,
        signed_amount: signedAmount,
        reason: adjustment.reason,
      },
    });
  }

  return lineItems;
}

function summarizeInvoiceLineItems(items: PreparedInvoiceLineItem[]) {
  const subtotalAmount = roundMoney(sum(items.map((item) => item.amount)));
  const discountAmount = roundMoney(Math.abs(sum(items.filter((item) => item.item_type === 'ADJUSTMENT' && item.amount < 0).map((item) => item.amount))));
  const taxAmount = 0;
  const paidAmount = 0;
  const totalAmount = roundMoney(Math.max(0, subtotalAmount + taxAmount));

  return {
    subtotalAmount,
    discountAmount,
    taxAmount,
    totalAmount,
    paidAmount,
  };
}

type PlatformUsageEventRecord = Prisma.PlatformUsageEventGetPayload<object>;
type PreparedInvoiceLineItem = {
  item_no: string;
  item_type: string;
  title: string;
  description: string | null;
  source_type: string | null;
  source_id: string | null;
  metric_type: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  currency: string;
  status: 'POSTED';
  metadata: Prisma.InputJsonValue;
};
