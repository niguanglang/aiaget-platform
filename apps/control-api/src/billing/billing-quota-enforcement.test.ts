import assert from 'node:assert/strict';
import test from 'node:test';

import type { BillingQuotaMetricType } from '@aiaget/shared-types';

type AggregateWhere = {
  metricType?: string | { in?: string[] };
  subjectType?: string;
  subjectId?: string | null;
  resourceType?: string;
  resourceId?: string | null;
};

test('billing overview maps customer success opportunity adjustment source to a detail link', async () => {
  const { BillingService } = await import('./billing.service');
  const adjustment = buildAdjustment({
    sourceType: 'CUSTOMER_SUCCESS_OPPORTUNITY',
    sourceId: 'opportunity-1',
    reason: '续约机会成交入账：华中设计院二期续约扩展机会',
  });
  const prisma = {
    $transaction: async (queries: unknown[]) => Promise.all(queries),
    modelCallLog: {
      findMany: async () => [],
    },
    apiKey: {
      findMany: async () => [],
    },
    conversationRun: {
      findMany: async () => [],
    },
    billingPlan: {
      findMany: async () => [],
    },
    tenantSubscription: {
      findFirst: async () => null,
    },
    billingInvoice: {
      findMany: async () => [],
    },
    billingQuotaPolicy: {
      findMany: async () => [],
    },
    platformUsageEvent: {
      findMany: async () => [],
    },
    billingAdjustment: {
      findMany: async () => [adjustment],
    },
    customerSuccessOpportunity: {
      findMany: async (args: { where: { tenantId: string; id: { in: string[] }; deletedAt: null }; select: Record<string, boolean> }) => {
        assert.equal(args.where.tenantId, 'tenant-1');
        assert.deepEqual(args.where.id.in, ['opportunity-1']);
        assert.equal(args.where.deletedAt, null);
        assert.equal(args.select.id, true);
        assert.equal(args.select.name, true);
        return [
          {
            id: 'opportunity-1',
            name: '华中设计院二期续约扩展机会',
          },
        ];
      },
    },
  };
  const service = new BillingService(
    prisma as never,
    { recordEvent: async () => ({ id: 'event-1' }) } as never,
  );
  (service as unknown as { ensureCommercialDefaults: () => Promise<void> }).ensureCommercialDefaults = async () => {};
  (service as unknown as { syncCurrentBillingInvoice: () => Promise<null> }).syncCurrentBillingInvoice = async () => null;

  const overview = await service.getOverview(buildUser(), '24h');

  assert.equal(overview.adjustments.length, 1);
  assert.equal(overview.adjustments[0]?.source_type, 'CUSTOMER_SUCCESS_OPPORTUNITY');
  assert.equal(overview.adjustments[0]?.source_label, '续约机会：华中设计院二期续约扩展机会');
  assert.equal(overview.adjustments[0]?.source_href, '/customer-success-opportunities/opportunity-1');
});

test('enforceQuota aggregates concrete cost metrics and records a blocked event', async () => {
  const { BillingService } = await import('./billing.service');
  const events: Array<Record<string, unknown>> = [];
  const aggregateWheres: AggregateWhere[] = [];
  const service = new BillingService(
    buildPrisma({
      policy: buildPolicy('COST', 'BLOCK'),
      aggregate: async (where) => {
        aggregateWheres.push(where);
        return metricIn(where, ['model_cost', 'agent_team_cost'])
          ? { _sum: { amount: 120, quantity: 0 } }
          : { _sum: { amount: 0, quantity: 0 } };
      },
    }) as never,
    {
      recordEvent: async (event: Record<string, unknown>) => {
        events.push(event);
        return { id: 'event-1' };
      },
    } as never,
  );

  const result = await service.enforceQuota(buildUser(), {
    subject_type: 'TENANT',
    metric_type: 'COST',
    period: 'MONTH',
  });

  assert.equal(result.block, true);
  assert.equal(result.allow, false);
  assert.equal(result.current_usage, 120);
  assert.equal(result.usage_rate, 120);
  assert.ok(aggregateWheres.some((where) => metricIn(where, ['model_cost', 'agent_team_cost'])));
  assert.ok(aggregateWheres.every((where) => where.subjectType === undefined));
  assert.equal(events.length, 1);
  assert.equal(events[0]?.eventType, 'billing.quota.blocked');
  assert.equal(events[0]?.resourceType, 'BILLING_QUOTA_POLICY');
  assert.equal(events[0]?.severity, 'WARN');
});

test('enforceQuota aggregates token and API call usage from concrete platform metrics', async () => {
  const { BillingService } = await import('./billing.service');
  const tokenService = new BillingService(
    buildPrisma({
      policy: buildPolicy('TOKEN', 'THROTTLE'),
      aggregate: async (where) => metricIn(where, ['model_tokens', 'channel_external_tokens'])
        ? { _sum: { amount: 0, quantity: 950 } }
        : { _sum: { amount: 0, quantity: 0 } },
    }) as never,
    { recordEvent: async () => ({ id: 'event-1' }) } as never,
  );
  const callAggregateWheres: AggregateWhere[] = [];
  const callService = new BillingService(
    buildPrisma({
      policy: buildPolicy('API_CALL', 'BLOCK'),
      aggregate: async (where) => {
        callAggregateWheres.push(where);
        return metricIn(where, ['external_agent_requests', 'api_key_requests', 'channel_external_requests', 'tool_calls'])
          ? { _sum: { amount: 0, quantity: 201 } }
          : { _sum: { amount: 0, quantity: 0 } };
      },
    }) as never,
    { recordEvent: async () => ({ id: 'event-1' }) } as never,
  );

  const tokenResult = await tokenService.enforceQuota(buildUser(), {
    subject_type: 'TENANT',
    metric_type: 'TOKEN',
    period: 'MONTH',
    usage_delta: 75,
  });
  const callResult = await callService.enforceQuota(buildUser(), {
    subject_type: 'TENANT',
    metric_type: 'API_CALL',
    period: 'MONTH',
  });

  assert.equal(tokenResult.current_usage, 1025);
  assert.equal(tokenResult.block, true);
  assert.equal(callResult.current_usage, 201);
  assert.equal(callResult.block, true);
  assert.ok(callAggregateWheres.some((where) => metricIn(where, ['webhook_deliveries'])));
});

test('enforceQuota uses call counts for model calls and agent runs instead of summing tokens', async () => {
  const { BillingService } = await import('./billing.service');
  const modelService = new BillingService(
    buildPrisma({
      policy: buildPolicy('MODEL_CALL', 'BLOCK'),
      modelCallCount: async () => 7,
      aggregate: async (where) => metricIn(where, ['model_tokens'])
        ? { _sum: { amount: 0, quantity: 9000 } }
        : { _sum: { amount: 0, quantity: 0 } },
    }) as never,
    { recordEvent: async () => ({ id: 'event-1' }) } as never,
  );
  const agentRunService = new BillingService(
    buildPrisma({
      policy: buildPolicy('AGENT_RUN', 'BLOCK'),
      conversationRunCount: async () => 3,
      aggregate: async (where) => metricIn(where, ['agent_team_runs'])
        ? { _sum: { amount: 0, quantity: 2 } }
        : { _sum: { amount: 0, quantity: 0 } },
    }) as never,
    { recordEvent: async () => ({ id: 'event-1' }) } as never,
  );

  const modelResult = await modelService.enforceQuota(buildUser(), {
    subject_type: 'TENANT',
    metric_type: 'MODEL_CALL',
    period: 'MONTH',
  });
  const agentRunResult = await agentRunService.enforceQuota(buildUser(), {
    subject_type: 'TENANT',
    metric_type: 'AGENT_RUN',
    period: 'MONTH',
  });

  assert.equal(modelResult.current_usage, 7);
  assert.equal(agentRunResult.current_usage, 5);
});

test('enforceQuota converts storage byte metrics to GB for storage quotas', async () => {
  const { BillingService } = await import('./billing.service');
  const service = new BillingService(
    buildPrisma({
      policy: buildPolicy('STORAGE_GB', 'BLOCK'),
      aggregate: async (where) => metricIn(where, ['storage_bytes'])
        ? { _sum: { amount: 0, quantity: 2 * 1024 * 1024 * 1024 } }
        : { _sum: { amount: 0, quantity: 0 } },
    }) as never,
    { recordEvent: async () => ({ id: 'event-1' }) } as never,
  );

  const result = await service.enforceQuota(buildUser(), {
    subject_type: 'TENANT',
    metric_type: 'STORAGE_GB',
    period: 'MONTH',
  });

  assert.equal(result.current_usage, 2);
});

function buildPrisma(input: {
  policy: ReturnType<typeof buildPolicy>;
  aggregate: (where: AggregateWhere) => Promise<{ _sum: { amount: number; quantity: number } }>;
  modelCallCount?: (where: Record<string, unknown>) => Promise<number>;
  conversationRunCount?: (where: Record<string, unknown>) => Promise<number>;
}) {
  return {
    billingPlan: {
      count: async () => 1,
    },
    tenantSubscription: {
      findFirst: async () => ({ id: 'subscription-1' }),
    },
    billingQuotaPolicy: {
      findFirst: async (args: { where: { metricType?: string; status?: string } }) => {
        if (args.where.status === undefined) return input.policy;
        if (args.where.metricType !== input.policy.metricType) return null;
        return input.policy;
      },
      create: async () => input.policy,
      update: async () => input.policy,
    },
    platformUsageEvent: {
      aggregate: async (args: { where: AggregateWhere }) => input.aggregate(args.where),
    },
    modelCallLog: {
      count: async (args: { where: Record<string, unknown> }) => input.modelCallCount?.(args.where) ?? 0,
    },
    conversationRun: {
      count: async (args: { where: Record<string, unknown> }) => input.conversationRunCount?.(args.where) ?? 0,
    },
  };
}

function buildPolicy(metricType: BillingQuotaMetricType, action: 'BLOCK' | 'THROTTLE') {
  return {
    id: `policy-${metricType}`,
    tenantId: 'tenant-1',
    name: `${metricType} 月度额度`,
    subjectType: 'TENANT',
    subjectId: null,
    metricType,
    period: 'MONTH',
    limitValue: 100,
    warnThreshold: 80,
    hardThreshold: 100,
    action,
    status: 'ACTIVE',
    lastEvaluatedAt: null,
    metadata: null,
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-01T00:00:00.000Z'),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };
}

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    departmentId: 'dept-1',
    email: 'operator@example.test',
    roles: [],
    permissions: ['billing:center:view'],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}

function buildAdjustment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'adjustment-1',
    tenantId: 'tenant-1',
    invoiceId: null,
    invoice: null,
    adjustmentNo: 'ADJ-20260510-0001',
    type: 'DEBIT',
    status: 'APPLIED',
    currency: 'USD',
    amount: 680000,
    reason: '续约机会成交入账',
    description: '客户已确认二期续约扩展合同，进入商务入账。',
    effectiveAt: new Date('2026-05-10T10:00:00.000Z'),
    approvedAt: new Date('2026-05-10T10:00:00.000Z'),
    approvedBy: 'user-1',
    sourceType: 'MANUAL',
    sourceId: 'user-1',
    metadata: null,
    createdAt: new Date('2026-05-10T10:00:00.000Z'),
    updatedAt: new Date('2026-05-10T10:00:00.000Z'),
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    ...overrides,
  };
}

function metricIn(where: AggregateWhere, metricTypes: string[]) {
  const value = where.metricType;
  if (typeof value === 'string') {
    return metricTypes.length === 1 && value === metricTypes[0];
  }
  return Boolean(value && typeof value === 'object' && value.in && metricTypes.every((metricType) => value.in?.includes(metricType)));
}
