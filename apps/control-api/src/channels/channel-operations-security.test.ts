import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

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

test('rejects sensitive channel provider config before persistence', async () => {
  const service = new ChannelOperationsService(
    {
      channelProvider: {
        create: async () => {
          throw new Error('provider create should not run when config contains secrets');
        },
      },
    } as never,
    {} as never,
  );

  await assert.rejects(
    () => service.createProvider(buildUser(), {
      code: 'custom_webhook',
      name: '自定义 Webhook',
      config: {
        retry: 3,
        api_key: 'provider-api-key',
      },
    }),
    BadRequestException,
  );
});

test('rejects nested sensitive channel account config before persistence', async () => {
  const service = new ChannelOperationsService(
    {
      channelProvider: {
        findFirst: async () => ({ id: 'provider-1', tenantId }),
      },
      channelAccount: {
        create: async () => {
          throw new Error('account create should not run when config contains secrets');
        },
      },
    } as never,
    {} as never,
  );

  await assert.rejects(
    () => service.createAccount(buildUser(), {
      provider_id: 'provider-1',
      code: 'ops_webhook',
      name: '运维 Webhook',
      config: {
        environment: 'prod',
        headers: {
          Authorization: 'Bearer account-token',
        },
      },
    }),
    BadRequestException,
  );
});

test('rejects sensitive template variables and route configs before persistence', async () => {
  const service = new ChannelOperationsService(
    {
      channelProvider: {
        findFirst: async () => ({ id: 'provider-1', tenantId }),
      },
      channelTemplate: {
        create: async () => {
          throw new Error('template create should not run when variables contain secrets');
        },
      },
      channelRouteRule: {
        create: async () => {
          throw new Error('route rule create should not run when config contains secrets');
        },
      },
    } as never,
    {} as never,
  );

  await assert.rejects(
    () => service.createTemplate(buildUser(), {
      code: 'incident_notice',
      name: '故障通知',
      variables: {
        webhook_token: 'template-token',
      },
    }),
    BadRequestException,
  );
  await assert.rejects(
    () => service.createRouteRule(buildUser(), {
      code: 'route_incident',
      name: '故障路由',
      provider_id: 'provider-1',
      match_config: {
        path: '$.event',
        signature: 'route-signature',
      },
      target_config: {
        id: 'agent-1',
      },
    }),
    BadRequestException,
  );
});

test('redacts historical channel operation configs when returning provider account template and route metadata', async () => {
  const now = new Date('2026-05-05T00:00:00.000Z');
  const service = new ChannelOperationsService(
    {
      channelProvider: {
        findFirst: async () => ({
          id: 'provider-1',
          tenantId,
          code: 'custom_webhook',
          name: '自定义 Webhook',
          providerType: 'CUSTOM',
          status: 'ACTIVE',
          endpointUrl: 'https://hooks.example.test?token=provider-token',
          callbackUrl: null,
          capabilities: [],
          authType: 'HEADER',
          config: { api_key: 'provider-api-key', visible: 'keep-provider' },
          description: null,
          createdAt: now,
          updatedAt: now,
          accounts: [],
          templates: [],
          routeRules: [],
        }),
      },
      channelDelivery: {
        groupBy: async () => [],
      },
      channelAccount: {
        findFirst: async () => ({
          id: 'account-1',
          tenantId,
          providerId: 'provider-1',
          provider: { code: 'custom_webhook', name: '自定义 Webhook' },
          publishChannels: [],
          code: 'ops_webhook',
          name: '运维 Webhook',
          status: 'ACTIVE',
          externalAccountId: null,
          secretMasked: 'zh****68',
          config: { environment: 'prod', headers: { Authorization: 'Bearer account-token' }, visible: 'keep-account' },
          description: null,
          lastVerifiedAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      },
      channelTemplate: {
        findFirst: async () => ({
          id: 'template-1',
          tenantId,
          providerId: 'provider-1',
          provider: { code: 'custom_webhook', name: '自定义 Webhook' },
          accountId: null,
          account: null,
          code: 'incident_notice',
          name: '故障通知',
          templateType: 'MESSAGE',
          locale: 'zh-CN',
          version: 1,
          status: 'ACTIVE',
          subject: null,
          body: 'hello',
          variables: { webhook_token: 'template-token', visible: 'keep-template' },
          contentSchema: { properties: { api_key: { type: 'string' }, visible: { type: 'string' } } },
          externalTemplateId: null,
          approvedAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      },
      channelRouteRule: {
        findFirst: async () => ({
          id: 'route-1',
          tenantId,
          providerId: 'provider-1',
          provider: { code: 'custom_webhook', name: '自定义 Webhook' },
          accountId: null,
          account: null,
          agentId: null,
          agent: null,
          publishChannels: [],
          code: 'route_incident',
          name: '故障路由',
          status: 'ACTIVE',
          priority: 100,
          direction: 'INBOUND',
          matchType: 'JSON',
          matchConfig: { signature: 'route-signature', visible: 'keep-route-match' },
          targetType: 'AGENT',
          targetConfig: { authorization: 'route-authorization', visible: 'keep-route-target' },
          createdAt: now,
          updatedAt: now,
        }),
      },
    } as never,
    {} as never,
  );

  const serialized = JSON.stringify([
    await service.getProvider(buildUser(), 'provider-1'),
    await service.getAccount(buildUser(), 'account-1'),
    await service.getTemplate(buildUser(), 'template-1'),
    await service.getRouteRule(buildUser(), 'route-1'),
  ]);

  assert.doesNotMatch(serialized, /provider-token|provider-api-key|account-token|template-token|route-signature|route-authorization/);
  assert.match(serialized, /keep-provider/);
  assert.match(serialized, /keep-account/);
  assert.match(serialized, /keep-template/);
  assert.match(serialized, /keep-route-match/);
  assert.match(serialized, /keep-route-target/);
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
