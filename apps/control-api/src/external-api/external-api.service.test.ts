import assert from 'node:assert/strict';
import test from 'node:test';

import { HttpException, HttpStatus } from '@nestjs/common';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.CONTROL_API_INTERNAL_BASE_URL ??= 'http://control-api.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

test('blocks external agent chat when billing API_CALL quota is exhausted', async () => {
  const { ExternalApiService } = await import('./external-api.service');
  const createdConversations: unknown[] = [];
  const usageEvents: Array<Record<string, unknown>> = [];
  const service = new ExternalApiService(
    {
      create: async () => {
        createdConversations.push({});
        return buildConversation();
      },
    } as never,
    { markUsed: async () => undefined } as never,
    { evaluateForApiPrincipal: async () => undefined } as never,
    { notifyRunCompleted: async () => undefined } as never,
    {
      recordEvent: async () => ({ id: 'event-1' }),
      recordUsage: async (event: Record<string, unknown>) => {
        usageEvents.push(event);
        return { id: 'usage-1' };
      },
    } as never,
    { platformEvent: { findFirst: async () => null } } as never,
    {
      enforceQuota: async () => ({
        allow: false,
        block: true,
        reason: 'API call quota exhausted',
        current_usage: 101,
        limit: 100,
        action: 'BLOCK',
        policy_id: 'policy-1',
        policy_name: 'API calls',
        usage_rate: 101,
      }),
    } as never,
  );

  await assert.rejects(
    () => service.chat(buildPrincipal(), 'agent-1', { message: 'hello' }),
    (error) => error instanceof HttpException && error.getStatus() === HttpStatus.FORBIDDEN,
  );
  assert.equal(createdConversations.length, 0);
  assert.equal(usageEvents.length, 0);
});

test('records one billable external API request usage for successful non-cached agent chat', async () => {
  const { ExternalApiService } = await import('./external-api.service');
  const usageEvents: Array<Record<string, unknown>> = [];
  const service = new ExternalApiService(
    { create: async () => buildConversation() } as never,
    { markUsed: async () => undefined } as never,
    { evaluateForApiPrincipal: async () => undefined } as never,
    { notifyRunCompleted: async () => undefined } as never,
    {
      recordEvent: async () => ({ id: 'event-1' }),
      recordUsage: async (event: Record<string, unknown>) => {
        usageEvents.push(event);
        return { id: 'usage-1' };
      },
    } as never,
    { platformEvent: { findFirst: async () => null } } as never,
    {
      enforceQuota: async () => ({
        allow: true,
        block: false,
        reason: 'ok',
        current_usage: 1,
        limit: 100,
        action: 'BLOCK',
        policy_id: 'policy-1',
        policy_name: 'API calls',
        usage_rate: 1,
      }),
    } as never,
  );

  await service.chat(buildPrincipal(), 'agent-1', { message: 'hello', idempotency_key: 'once' });

  const requestUsage = usageEvents.filter((event) => event.metricType === 'external_agent_requests');
  assert.equal(requestUsage.length, 1);
  assert.equal(requestUsage[0]?.billable, true);
  assert.equal(requestUsage[0]?.quantity, 1);
});

test('returns cached idempotent agent chat without billing enforcement or API key quota charge', async () => {
  const { ExternalApiService } = await import('./external-api.service');
  let enforceCalls = 0;
  let markUsedCalls = 0;
  const service = new ExternalApiService(
    {
      create: async () => {
        throw new Error('create should not run for cached replay');
      },
    } as never,
    { markUsed: async () => { markUsedCalls += 1; } } as never,
    { evaluateForApiPrincipal: async () => undefined } as never,
    { notifyRunCompleted: async () => undefined } as never,
    { recordEvent: async () => ({ id: 'event-1' }), recordUsage: async () => ({ id: 'usage-1' }) } as never,
    {
      platformEvent: {
        findFirst: async () => ({
          payloadJson: {
            result: buildExternalResult({ idempotency_key: 'once' }),
          },
        }),
      },
    } as never,
    {
      enforceQuota: async () => {
        enforceCalls += 1;
        return { allow: true, block: false };
      },
    } as never,
  );

  const result = await service.chat(buildPrincipal(), 'agent-1', { message: 'hello', idempotency_key: 'once' });

  assert.equal(result.idempotency_replayed, true);
  assert.equal(enforceCalls, 0);
  assert.equal(markUsedCalls, 0);
});

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
      webhookEnabled: false,
      webhookUrl: null,
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

function buildConversation() {
  return {
    id: 'conversation-1',
    agent_id: 'agent-1',
    agent_name: 'Support Agent',
    agent_code: 'support',
    messages: [
      {
        id: 'message-1',
        role: 'ASSISTANT',
        content: 'answer',
        references: [],
        tool_calls: [],
        created_at: '2026-05-11T00:00:00.000Z',
      },
    ],
    runs: [
      {
        id: 'run-1',
        trace_id: 'trace-1',
        status: 'COMPLETED',
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
        latency_ms: 120,
        cost_total: 0.01,
        created_at: '2026-05-11T00:00:00.000Z',
      },
    ],
  };
}

function buildExternalResult(overrides: Record<string, unknown> = {}) {
  return {
    conversation_id: 'conversation-1',
    agent_id: 'agent-1',
    agent_name: 'Support Agent',
    agent_code: 'support',
    message_id: 'message-1',
    run_id: 'run-1',
    trace_id: 'trace-1',
    status: 'COMPLETED',
    answer: 'answer',
    references: [],
    tool_calls: [],
    usage: null,
    created_at: '2026-05-11T00:00:00.000Z',
    ...overrides,
  };
}
