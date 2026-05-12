import assert from 'node:assert/strict';
import test from 'node:test';

import { HttpPluginSandboxExecutor } from './plugin-sandbox-executor';

test('HttpPluginSandboxExecutor is disabled when remote executor URL is not configured', async () => {
  const originalUrl = process.env.PLUGIN_SANDBOX_EXECUTOR_URL;
  process.env.PLUGIN_SANDBOX_EXECUTOR_URL = '';
  const executor = new HttpPluginSandboxExecutor();

  assert.equal(executor.isConfigured(), false);
  await assert.rejects(
    () => executor.execute(buildSandboxInput()),
    /Plugin sandbox executor is not configured/,
  );

  restoreEnv('PLUGIN_SANDBOX_EXECUTOR_URL', originalUrl);
});

test('HttpPluginSandboxExecutor posts sandbox execution request to configured remote executor', async () => {
  const originalUrl = process.env.PLUGIN_SANDBOX_EXECUTOR_URL;
  const originalToken = process.env.PLUGIN_SANDBOX_EXECUTOR_TOKEN;
  const originalTimeout = process.env.PLUGIN_SANDBOX_EXECUTOR_TIMEOUT_MS;
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; init: RequestInit }> = [];
  process.env.PLUGIN_SANDBOX_EXECUTOR_URL = 'https://sandbox.example.test/api/';
  process.env.PLUGIN_SANDBOX_EXECUTOR_TOKEN = 'sandbox-token';
  process.env.PLUGIN_SANDBOX_EXECUTOR_TIMEOUT_MS = '3000';
  globalThis.fetch = (async (url: URL | Request, init?: RequestInit) => {
    requests.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({
      status: 'SUCCESS',
      latency_ms: 37,
      output_preview: '执行完成',
      output: { ok: true },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  const executor = new HttpPluginSandboxExecutor();
  const result = await executor.execute(buildSandboxInput());

  assert.equal(executor.isConfigured(), true);
  assert.equal(requests[0]?.url, 'https://sandbox.example.test/execute');
  assert.equal(requests[0]?.init.method, 'POST');
  const headers = requests[0]?.init.headers as Record<string, string>;
  assert.equal(headers.authorization, 'Bearer sandbox-token');
  assert.equal(headers['x-request-id'], 'request-1');
  assert.equal(headers['x-trace-id'], 'trace-1');
  assert.deepEqual(JSON.parse(String(requests[0]?.init.body)), {
    tenant_id: 'tenant-1',
    plugin_id: 'plugin-1',
    hook_id: 'hook-1',
    hook_code: 'custom.entry',
    event_id: 'event-1',
    entry: 'dist/index.js',
    payload: { id: 'payload-1' },
    sandbox_policy: { status: 'DECLARED', isolation: 'REMOTE', entry: 'dist/index.js' },
  });
  assert.deepEqual(result, {
    status: 'SUCCESS',
    latency_ms: 37,
    output_preview: '执行完成',
    output: { ok: true },
    error_message: null,
  });

  globalThis.fetch = originalFetch;
  restoreEnv('PLUGIN_SANDBOX_EXECUTOR_URL', originalUrl);
  restoreEnv('PLUGIN_SANDBOX_EXECUTOR_TOKEN', originalToken);
  restoreEnv('PLUGIN_SANDBOX_EXECUTOR_TIMEOUT_MS', originalTimeout);
});

function buildSandboxInput() {
  return {
    tenantId: 'tenant-1',
    pluginId: 'plugin-1',
    hookId: 'hook-1',
    hookCode: 'custom.entry',
    eventId: 'event-1',
    entry: 'dist/index.js',
    payload: { id: 'payload-1' },
    sandboxPolicy: { status: 'DECLARED', isolation: 'REMOTE', entry: 'dist/index.js' },
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
