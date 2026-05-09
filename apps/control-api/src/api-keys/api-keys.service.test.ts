import assert from 'node:assert/strict';
import test from 'node:test';

test('updates api key governance and webhook config without rotating secret', async () => {
  const { ApiKeysService } = await import('./api-keys.service');
  const updates: Array<Record<string, unknown>> = [];
  const service = new ApiKeysService(
    {
      agent: {
        count: async () => 1,
      },
      apiKey: {
        findFirst: async () => buildApiKey(),
        update: async (args: { data: Record<string, unknown> }) => {
          updates.push(args.data);
          return {
            ...buildApiKey(),
            name: args.data.name,
            allowedAgentIds: args.data.allowedAgentIds,
            webhookEnabled: args.data.webhookEnabled,
            webhookUrl: args.data.webhookUrl,
          };
        },
      },
    } as never,
    null as never,
  );

  const result = await service.update(buildUser(), 'key-1', {
    name: 'CRM 外部调用',
    allowed_agent_ids: ['11111111-1111-4111-8111-111111111111'],
    ip_allowlist: ['10.0.0.1'],
    rate_limit_per_minute: 120,
    daily_quota: 10000,
    allow_stream: true,
    webhook_enabled: true,
    webhook_url: 'https://hooks.example.test/aiaget',
    webhook_events: ['agent.run.completed'],
    webhook_secret: 'new-secret',
    expires_at: '2026-06-01T00:00:00.000Z',
  });

  assert.equal(updates.length, 1);
  assert.equal(updates[0]?.name, 'CRM 外部调用');
  assert.equal(updates[0]?.keyHash, undefined);
  assert.equal(updates[0]?.keyPrefix, undefined);
  assert.equal(updates[0]?.webhookEnabled, true);
  assert.equal(updates[0]?.webhookUrl, 'https://hooks.example.test/aiaget');
  assert.equal(result.name, 'CRM 外部调用');
  assert.equal(result.webhook_enabled, true);
});

test('sets api key status and rotates secret with one-time plaintext', async () => {
  const { ApiKeysService, hashApiKeyToken } = await import('./api-keys.service');
  const updates: Array<Record<string, unknown>> = [];
  const service = new ApiKeysService(
    {
      apiKey: {
        findFirst: async () => buildApiKey(),
        update: async (args: { data: Record<string, unknown> }) => {
          updates.push(args.data);
          return {
            ...buildApiKey(),
            ...args.data,
          };
        },
      },
    } as never,
    null as never,
  );

  const disabled = await service.setStatus(buildUser(), 'key-1', 'DISABLED');
  const enabled = await service.setStatus(buildUser(), 'key-1', 'ACTIVE');
  const rotated = await service.rotate(buildUser(), 'key-1');

  assert.equal(disabled.status, 'DISABLED');
  assert.equal(enabled.status, 'ACTIVE');
  assert.match(rotated.api_key, /^ak_[a-f0-9]+$/);
  assert.equal(rotated.item.key_prefix, rotated.api_key.slice(0, 12));
  assert.equal(updates[2]?.keyPrefix, rotated.api_key.slice(0, 12));
  assert.equal(updates[2]?.keyHash, hashApiKeyToken(rotated.api_key));
  assert.equal(updates[2]?.usedCountToday, 0);
  assert.equal(updates[2]?.quotaResetDate, null);
});

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    departmentId: 'dept-1',
    email: 'operator@example.test',
    roles: [],
    permissions: ['system:api_key:manage'],
  };
}

function buildApiKey() {
  return {
    id: 'key-1',
    tenantId: 'tenant-1',
    name: '旧密钥',
    keyPrefix: 'ak_oldprefix',
    keyHash: 'old-hash',
    status: 'ACTIVE',
    scopes: ['external:agent:chat'],
    allowedAgentIds: [],
    ipAllowlist: [],
    rateLimitPerMinute: 60,
    dailyQuota: null,
    usedCountToday: 8,
    quotaResetDate: new Date('2026-05-08T00:00:00.000Z'),
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
    createdAt: new Date('2026-05-08T01:00:00.000Z'),
  };
}
