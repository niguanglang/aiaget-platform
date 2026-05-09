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
  const callService = new BillingService(
    buildPrisma({
      policy: buildPolicy('API_CALL', 'BLOCK'),
      aggregate: async (where) => metricIn(where, ['external_agent_requests', 'api_key_requests', 'channel_external_requests', 'tool_calls'])
        ? { _sum: { amount: 0, quantity: 201 } }
        : { _sum: { amount: 0, quantity: 0 } },
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

function metricIn(where: AggregateWhere, metricTypes: string[]) {
  const value = where.metricType;
  if (typeof value === 'string') {
    return metricTypes.length === 1 && value === metricTypes[0];
  }
  return Boolean(value && typeof value === 'object' && value.in && metricTypes.every((metricType) => value.in?.includes(metricType)));
}
