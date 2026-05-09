import assert from 'node:assert/strict';
import test from 'node:test';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.CONTROL_API_INTERNAL_BASE_URL ??= 'http://control-api.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

test('runtime model call log is projected to platform event and usage ledgers', async () => {
  const { ConversationsService } = await import('./conversations.service');
  const calls: Array<{ type: string; value: unknown }> = [];
  const prisma = {
    modelCallLog: {
      create: async (value: unknown) => {
        calls.push({ type: 'model_call_log', value });
        return { id: 'model-call-1' };
      },
    },
    modelApiKey: {
      update: async (value: unknown) => {
        calls.push({ type: 'model_api_key', value });
        return { id: 'key-1' };
      },
    },
  };
  const platformEvents = {
    recordEvent: async (value: unknown) => {
      calls.push({ type: 'platform_event', value });
      return { id: 'event-1' };
    },
    recordUsage: async (value: unknown) => {
      calls.push({ type: 'platform_usage', value });
      return { id: `usage-${calls.length}` };
    },
  };
  const service = new ConversationsService(
    prisma as never,
    null as never,
    null as never,
    null as never,
    platformEvents as never,
  );

  await callPrivate(service, 'writeRuntimeModelCallLog', [
    {
      id: 'user-1',
      tenantId: 'tenant-1',
      departmentId: 'dept-1',
      email: 'operator@example.test',
      roles: [],
      permissions: [],
      requestId: 'request-1',
    },
    {
      providerId: 'provider-1',
      modelConfigId: 'model-config-1',
      providerType: 'DEEPSEEK',
      baseUrl: 'https://api.example.test/v1',
      apiKey: 'secret',
      model: 'deepseek-chat',
      temperature: 0.2,
      inputPrice: 0.001,
      outputPrice: 0.002,
      providerKeyId: 'key-1',
    },
    {
      model_call: {
        trace_id: '0'.repeat(32),
        status: 'SUCCESS',
        request_model: 'deepseek-chat',
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500,
        latency_ms: 120,
        request_summary: { runtime: 'langgraph' },
        response_summary: { output_preview: 'ok' },
        error_message: null,
      },
    },
  ]);

  assert.equal(calls.filter((call) => call.type === 'model_call_log').length, 1);
  assert.equal(calls.filter((call) => call.type === 'model_api_key').length, 1);
  assert.equal(calls.filter((call) => call.type === 'platform_event').length, 1);
  assert.equal(calls.filter((call) => call.type === 'platform_usage').length, 2);
  assert.equal(getCall(calls, 'platform_event').eventType, 'runtime.model.call.finished');
  assert.equal(getCall(calls, 'platform_event').traceId, '0'.repeat(32));
  assert.equal(getCall(calls, 'platform_event').requestId, 'request-1');
  assert.equal(getCall(calls, 'platform_event').resourceType, 'MODEL');
  assert.deepEqual(
    calls
      .filter((call) => call.type === 'platform_usage')
      .map((call) => getRecord(call.value).metricType),
    ['model_tokens', 'model_cost'],
  );
  assert.equal(getRecord(calls.find((call) => call.type === 'platform_usage' && getRecord(call.value).metricType === 'model_tokens')?.value).quantity, 1500);
  assert.equal(getRecord(calls.find((call) => call.type === 'platform_usage' && getRecord(call.value).metricType === 'model_cost')?.value).amount, 0.002);
});

async function callPrivate(target: unknown, methodName: string, args: unknown[]) {
  const record = getRecord(target);
  const method = record[methodName];
  assert.equal(typeof method, 'function');
  await (method as (...input: unknown[]) => Promise<unknown>).apply(target, args);
}

function getCall(calls: Array<{ type: string; value: unknown }>, type: string) {
  const found = calls.find((call) => call.type === type);
  assert.ok(found);
  return getRecord(found.value);
}

function getRecord(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}
