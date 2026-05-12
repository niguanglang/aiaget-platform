import assert from 'node:assert/strict';
import test from 'node:test';

test('records one billable webhook delivery usage for each run completed delivery', async () => {
  const { ExternalWebhookService } = await import('./external-webhook.service');
  const usageEvents: Array<Record<string, unknown>> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('ok', { status: 200 });

  try {
    const service = new ExternalWebhookService(
      buildPrisma() as never,
      {
        recordUsage: async (event: Record<string, unknown>) => {
          usageEvents.push(event);
          return { id: 'usage-1' };
        },
      } as never,
    );

    await service.notifyRunCompleted(buildPrincipal(), buildExternalResult());

    assert.equal(usageEvents.length, 1);
    assert.equal(usageEvents[0]?.tenantId, 'tenant-1');
    assert.equal(usageEvents[0]?.departmentId, 'dept-1');
    assert.equal(usageEvents[0]?.userId, 'user-1');
    assert.equal(usageEvents[0]?.subjectType, 'API_KEY');
    assert.equal(usageEvents[0]?.subjectId, 'key-1');
    assert.equal(usageEvents[0]?.resourceType, 'WEBHOOK');
    assert.equal(usageEvents[0]?.resourceId, 'key-1');
    assert.equal(usageEvents[0]?.metricType, 'webhook_deliveries');
    assert.equal(usageEvents[0]?.unit, 'delivery');
    assert.equal(usageEvents[0]?.quantity, 1);
    assert.equal(usageEvents[0]?.billable, true);
    assert.equal(usageEvents[0]?.costSource, 'external_webhook');
    assert.equal(usageEvents[0]?.traceId, 'trace-1');
    assert.equal(usageEvents[0]?.requestId, 'request-1');
    assert.match(String(usageEvents[0]?.sourceId), /^evt_/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function buildPrisma() {
  let deliveryRecord: ReturnType<typeof buildDeliveryRecord> | null = null;

  return {
    webhookDelivery: {
      create: async (args: { data: Record<string, unknown> }) => {
        deliveryRecord = buildDeliveryRecord(args.data);
        return deliveryRecord;
      },
      update: async (args: { data: Record<string, unknown> }) => {
        assert.ok(deliveryRecord);
        deliveryRecord = {
          ...deliveryRecord,
          ...args.data,
          updatedAt: new Date('2026-05-12T00:00:01.000Z'),
        };
        return deliveryRecord;
      },
    },
    apiKey: {
      update: async () => ({ id: 'key-1' }),
    },
    operationLog: {
      create: async () => ({ id: 'log-1' }),
    },
    $transaction: async (queries: unknown[]) => Promise.all(queries),
  };
}

function buildDeliveryRecord(data: Record<string, unknown>) {
  return {
    id: 'delivery-row-1',
    tenantId: data.tenantId,
    apiKeyId: data.apiKeyId,
    apiKey: {
      id: 'key-1',
      name: 'External key',
      keyPrefix: 'ak_test',
    },
    event: data.event,
    deliveryId: data.deliveryId,
    parentDeliveryId: data.parentDeliveryId,
    targetUrl: data.targetUrl,
    payload: data.payload,
    requestHeaders: data.requestHeaders,
    status: data.status,
    responseStatus: null,
    responseBody: null,
    latencyMs: null,
    retryCount: data.retryCount,
    errorMessage: null,
    deliveredAt: null,
    createdAt: new Date('2026-05-12T00:00:00.000Z'),
    updatedAt: new Date('2026-05-12T00:00:00.000Z'),
  };
}

function buildPrincipal() {
  return {
    key: {
      id: 'key-1',
      tenantId: 'tenant-1',
      name: 'External key',
      keyPrefix: 'ak_test',
      keyHash: 'hash',
      status: 'ACTIVE',
      scopes: ['external:agent:chat'],
      allowedAgentIds: [],
      ipAllowlist: [],
      rateLimitPerMinute: 60,
      dailyQuota: 100,
      usedCountToday: 0,
      quotaResetDate: null,
      allowStream: true,
      webhookEnabled: true,
      webhookUrl: 'https://webhook.example.test/run-completed?secret=redacted',
      webhookEvents: ['agent.run.completed'],
      webhookSecretEncrypted: null,
      webhookLastStatus: null,
      webhookLastError: null,
      webhookLastSentAt: null,
      expiresAt: null,
      lastUsedAt: null,
      createdAt: new Date('2026-05-11T00:00:00.000Z'),
      updatedAt: new Date('2026-05-11T00:00:00.000Z'),
      deletedAt: null,
      createdBy: 'user-1',
      updatedBy: null,
    },
    user: {
      id: 'user-1',
      tenantId: 'tenant-1',
      departmentId: 'dept-1',
      email: 'operator@example.test',
      roles: [],
      permissions: [],
      requestId: 'request-1',
      traceId: 'trace-1',
    },
  };
}

function buildExternalResult() {
  return {
    conversation_id: 'conversation-1',
    agent_id: 'agent-1',
    agent_name: 'Support Agent',
    agent_code: 'support',
    message_id: 'message-1',
    run_id: 'run-1',
    trace_id: 'trace-1',
    status: 'SUCCESS' as const,
    answer: 'answer',
    created_at: '2026-05-12T00:00:00.000Z',
    references: [],
    tool_calls: [],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
      latency_ms: 120,
      cost_total: 0.01,
    },
  };
}
