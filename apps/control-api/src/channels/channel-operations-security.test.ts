import assert from 'node:assert/strict';
import test from 'node:test';

import { ChannelOperationsService } from './channel-operations.service';

const tenantId = '00000000-0000-0000-0000-000000000001';
const userId = '00000000-0000-0000-0000-000000000002';

test('redacts normalized channel delivery audit metadata when listing historical records', async () => {
  const delivery = {
    id: 'delivery-row-1',
    deliveryKey: 'delivery-1',
    status: 'FAILED',
    provider: { code: 'CUSTOM_WEBHOOK', name: 'Custom webhook' },
    providerId: null,
    publishChannelId: 'channel-1',
    publishChannel: { name: 'Webhook channel' },
    accountId: null,
    account: null,
    target: 'https://hooks.example.test/target?token=target-token&plain=1',
    responseStatus: 502,
    latencyMs: 120,
    retryCount: 1,
    traceId: 'trace-1',
    errorMessage: 'failed with Authorization=Bearer response-auth-token',
    deliveredAt: new Date('2026-05-05T00:00:00.000Z'),
    createdAt: new Date('2026-05-05T00:00:00.000Z'),
    updatedAt: new Date('2026-05-05T00:00:01.000Z'),
    agentId: 'agent-1',
    templateId: null,
    publishJobId: null,
    direction: 'OUTBOUND',
    requestUrl: 'https://hooks.example.test/send?token=request-token&signature=request-signature&plain=1',
    requestBody: {
      text: 'hello',
      payload: {
        access_token: 'request-access-token',
        nested: { signing_secret: 'request-signing-secret', visible: 'keep-me' },
      },
    },
    requestHeaders: {
      Authorization: 'Bearer request-authorization',
      Cookie: 'sid=request-cookie',
      'x-aiaget-signature': 'sha256=request-signature-header',
    },
    responseBody: JSON.stringify({ ok: false, access_token: 'response-token', nested: { api_key: 'response-key' } }),
    conversationId: 'conversation-1',
    runId: 'run-1',
    externalConversationId: 'external-conversation-1',
    externalMessageId: 'external-message-1',
  };
  const service = new ChannelOperationsService(buildPrisma([delivery]) as never, {} as never);

  const result = await service.listDeliveries(buildUser(), { page: 1, page_size: 50 });
  const serialized = JSON.stringify(result.items[0]);

  assert.doesNotMatch(serialized, /target-token|request-token|request-signature|request-access-token|request-signing-secret|request-authorization|request-cookie|request-signature-header|response-token|response-key/);
  assert.match(serialized, /keep-me/);
  assert.match(serialized, /\[REDACTED\]/);
});

function buildPrisma(deliveries: unknown[]) {
  return {
    $transaction: async (operations: unknown[]) => Promise.all(operations),
    channelDelivery: {
      findMany: () => Promise.resolve(deliveries),
      count: () => Promise.resolve(deliveries.length),
    },
  };
}

function buildUser() {
  return {
    id: userId,
    tenantId,
    departmentId: null,
    email: 'operator@example.test',
    roles: [],
    roleIds: [],
    permissions: [],
  };
}
