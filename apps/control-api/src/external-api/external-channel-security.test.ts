import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import { BadRequestException, UnauthorizedException } from '@nestjs/common';

import type { RequestWithContext } from '../common/types/request-context';
import { encryptSecret } from '../models/model-secrets';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.CONTROL_API_INTERNAL_BASE_URL ??= 'http://control-api.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

const tenantId = '00000000-0000-0000-0000-000000000001';
const userId = '00000000-0000-0000-0000-000000000002';
const agentId = '00000000-0000-0000-0000-000000000003';
const channelId = '00000000-0000-0000-0000-000000000004';

test('redacts callback payload secrets before persisting channel reply audit', async () => {
  const secret = 'callback-signing-secret';
  const channel = buildChannel({
    channel: 'CUSTOM_WEBHOOK',
    secretEncrypted: encryptSecret(secret),
  });
  const { service, replyCreates } = await createCallbackService(channel);
  const body = {
    event: 'message.received',
    response_url: 'https://hooks.example.test/reply?token=callback-token&signature=callback-signature&ok=1',
    payload: {
      access_token: 'nested-access-token',
      authorization: 'Bearer nested-authorization',
      headers: {
        Cookie: 'sid=nested-cookie',
        'x-aiaget-signature': 'nested-signature',
      },
      nested: {
        signing_secret: 'nested-signing-secret',
        visible: 'keep-me',
      },
    },
  };
  const rawBody = JSON.stringify(body);

  await service.handle(
    buildRequest({
      rawBody,
      headers: {
        'x-aiaget-signature': `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`,
      },
    }),
    channelId,
    body,
  );

  assert.equal(replyCreates.length, 1);
  const replyCreate = replyCreates[0];
  assert.ok(replyCreate);
  const persisted = JSON.stringify(replyCreate.data.payload);
  assert.doesNotMatch(persisted, /callback-token|callback-signature|nested-access-token|nested-authorization|nested-cookie|nested-signature|nested-signing-secret/);
  assert.match(persisted, /keep-me/);
  assert.match(persisted, /\[REDACTED\]/);
});

test('redacts sender request and response secrets before persisting delivery audits', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    cookie: 'response-cookie',
    data: {
      access_token: 'response-access-token',
      nested: {
        signing_key: 'response-signing-key',
      },
    },
  }), { status: 200 });

  const channel = buildChannel({
    channel: 'CUSTOM_WEBHOOK',
    config: {
      webhook_url: 'https://hooks.example.test/sender?token=sender-token&signature=sender-signature&plain=1',
    },
    secretEncrypted: encryptSecret(JSON.stringify({ sender_secret: 'sender-signing-secret' })),
  });
  const { service, senderCreates, senderUpdates, normalizedCreates, normalizedUpdates } = await createSenderService(channel);

  await service.sendReply({
    request: buildRequest(),
    channel: channel as never,
    operator: buildOperator(),
    message: {
      provider: 'CUSTOM_WEBHOOK',
      text: 'incoming',
      externalConversationId: 'external-conversation-1',
      externalMessageId: 'external-message-1',
      senderId: 'sender-1',
      responseUrl: null,
    },
    answer: 'answer',
    conversationId: 'conversation-1',
    runId: 'run-1',
    traceId: 'trace-1',
  });

  assert.equal(senderCreates.length, 1);
  assert.equal(normalizedCreates.length, 1);
  const senderCreateInput = senderCreates[0];
  const normalizedCreateInput = normalizedCreates[0];
  assert.ok(senderCreateInput);
  assert.ok(normalizedCreateInput);
  const senderCreate = JSON.stringify(senderCreateInput.data);
  const normalizedCreate = JSON.stringify(normalizedCreateInput.data);
  assert.doesNotMatch(senderCreate, /sender-token|sender-signature|x-aiaget-signature":"sha256=/);
  assert.doesNotMatch(normalizedCreate, /sender-token|sender-signature|x-aiaget-signature":"sha256=/);
  assert.match(senderCreate, /plain=1/);

  assert.equal(senderUpdates.length, 1);
  assert.equal(normalizedUpdates.length, 1);
  const senderUpdateInput = senderUpdates[0];
  const normalizedUpdateInput = normalizedUpdates[0];
  assert.ok(senderUpdateInput);
  assert.ok(normalizedUpdateInput);
  const senderUpdate = JSON.stringify(senderUpdateInput.data);
  const normalizedUpdate = JSON.stringify(normalizedUpdateInput.data);
  assert.doesNotMatch(senderUpdate, /response-cookie|response-access-token|response-signing-key/);
  assert.doesNotMatch(normalizedUpdate, /response-cookie|response-access-token|response-signing-key/);
  assert.match(senderUpdate, /\[REDACTED\]/);
});

test('persists sender mode and provider api for native and webhook delivery audits', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, access_token: 'response-token' }), { status: 200 });

  const slackChannel = buildChannel({
    channel: 'SLACK',
    config: {
      slack_bot_token: 'xoxb-secret-token',
    },
  });
  const slackSender = await createSenderService(slackChannel);

  await slackSender.service.sendReply({
    request: buildRequest(),
    channel: slackChannel as never,
    operator: buildOperator(),
    message: {
      provider: 'SLACK',
      text: 'incoming',
      externalConversationId: 'C123',
      externalMessageId: '1714970000.000100',
      senderId: 'U123',
      responseUrl: null,
    },
    answer: 'native answer',
    conversationId: 'conversation-1',
    runId: 'run-1',
    traceId: 'trace-1',
  });

  assert.equal(JSON.stringify(slackSender.senderCreates[0]?.data.requestBody).includes('sender_mode'), false);
  assert.equal(JSON.stringify(slackSender.normalizedCreates[0]?.data.requestBody).includes('sender_mode'), false);
  assert.equal(slackSender.recordedEvents[0]?.payloadJson.sender_mode, 'NATIVE_API');
  assert.equal(slackSender.recordedEvents[0]?.payloadJson.provider_api, 'SLACK_CHAT_POST_MESSAGE');
  assert.doesNotMatch(JSON.stringify(slackSender.senderCreates[0]?.data), /xoxb-secret-token|Authorization":"Bearer/);
  assert.doesNotMatch(JSON.stringify(slackSender.recordedEvents[0]?.payloadJson), /xoxb-secret-token|Authorization/i);

  const webhookChannel = buildChannel({
    channel: 'CUSTOM_WEBHOOK',
    config: {
      webhook_url: 'https://hooks.example.test/sender?token=sender-token&plain=1',
    },
  });
  const webhookSender = await createSenderService(webhookChannel);

  await webhookSender.service.sendReply({
    request: buildRequest(),
    channel: webhookChannel as never,
    operator: buildOperator(),
    message: {
      provider: 'CUSTOM_WEBHOOK',
      text: 'incoming',
      externalConversationId: 'external-conversation-1',
      externalMessageId: 'external-message-1',
      senderId: 'sender-1',
      responseUrl: null,
    },
    answer: 'webhook answer',
    conversationId: 'conversation-1',
    runId: 'run-1',
    traceId: 'trace-1',
  });

  assert.equal(JSON.stringify(webhookSender.senderCreates[0]?.data.requestBody).includes('sender_mode'), false);
  assert.equal(JSON.stringify(webhookSender.normalizedCreates[0]?.data.requestBody).includes('sender_mode'), false);
  assert.equal(webhookSender.recordedEvents[0]?.payloadJson.sender_mode, 'WEBHOOK');
  assert.equal(webhookSender.recordedEvents[0]?.payloadJson.provider_api, 'CUSTOM_WEBHOOK');
  assert.doesNotMatch(JSON.stringify(webhookSender.senderCreates[0]?.data), /sender-token/);
});

test('records skipped sender mode, provider api and diagnostic event payload when sender config is missing', async () => {
  const cases = [
    {
      provider: 'WECHAT_WORK',
      providerApi: 'WECHAT_WORK_MESSAGE_SEND',
      diagnostic: /企业微信/,
    },
    {
      provider: 'DINGTALK',
      providerApi: 'DINGTALK_SESSION_WEBHOOK',
      diagnostic: /钉钉/,
    },
    {
      provider: 'FEISHU',
      providerApi: 'FEISHU_IM_MESSAGE',
      diagnostic: /飞书/,
    },
    {
      provider: 'SLACK',
      providerApi: 'SLACK_CHAT_POST_MESSAGE',
      diagnostic: /Slack/,
    },
    {
      provider: 'CUSTOM_WEBHOOK',
      providerApi: 'CUSTOM_WEBHOOK',
      diagnostic: /自定义 Webhook/,
    },
  ] as const;

  for (const item of cases) {
    const channel = buildChannel({
      channel: item.provider,
      config: {},
    });
    const { service, senderCreates, senderUpdates, normalizedCreates, normalizedUpdates, recordedEvents } = await createSenderService(channel);

    const result = await service.sendReply({
      request: buildRequest(),
      channel: channel as never,
      operator: buildOperator(),
      message: {
        provider: item.provider,
        text: 'incoming',
        externalConversationId: null,
        externalMessageId: 'external-message-1',
        senderId: null,
        responseUrl: null,
      },
      answer: 'answer',
      conversationId: 'conversation-1',
      runId: 'run-1',
      traceId: 'trace-1',
    });

    assert.equal(result.status, 'SKIPPED');
    assert.match(result.errorMessage ?? '', item.diagnostic);
    assert.match(result.errorMessage ?? '', /未配置/);
    assert.equal(JSON.stringify(senderCreates[0]?.data.requestBody).includes('sender_mode'), false);
    assert.equal(senderUpdates[0]?.data.status, 'SKIPPED');
    assert.equal(JSON.stringify(normalizedCreates[0]?.data.requestBody).includes('sender_mode'), false);
    assert.equal(normalizedUpdates[0]?.data.errorMessage, result.errorMessage);
    assert.equal(recordedEvents[0]?.eventType, 'channel.sender.skipped');
    assert.equal(recordedEvents[0]?.payloadJson.sender_mode, 'SKIPPED');
    assert.equal(recordedEvents[0]?.payloadJson.provider_api, item.providerApi);
    assert.equal(recordedEvents[0]?.payloadJson.diagnostic, result.errorMessage);
  }
});

test('rejects sender retry when persisted audit credentials are already redacted', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });

  const channel = buildChannel({
    channel: 'CUSTOM_WEBHOOK',
    config: {},
  });
  const delivery = buildFailedSenderDelivery(channel, {
    requestUrl: 'https://hooks.example.test/sender?token=%5BREDACTED%5D&plain=1',
    requestHeaders: { 'x-aiaget-signature': '[REDACTED]' },
  });
  const { service, senderCreates } = await createSenderRetryService(delivery);

  await assert.rejects(
    () => service.retryDelivery(buildOperator(), 'delivery-1'),
    (error) => {
      assert.ok(error instanceof BadRequestException);
      assert.match(error.message, /redacted/i);
      return true;
    },
  );
  assert.equal(senderCreates.length, 0);
});

test('records sender mode and provider api for manual retry events', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });

  const channel = buildChannel({
    channel: 'SLACK',
  });
  const delivery = buildFailedSenderDelivery(channel, {
    provider: 'SLACK',
    requestUrl: 'https://slack.com/api/chat.postMessage',
    requestHeaders: { Authorization: 'Bearer retry-token' },
    target: 'C123',
  });
  const { service, recordedEvents } = await createSenderRetryService(delivery);

  await service.retryDelivery(buildOperator(), 'delivery-1');

  const retryEvent = recordedEvents.find((event) => event.eventType === 'channel.sender.retry_sent');
  assert.ok(retryEvent);
  assert.equal(retryEvent.payloadJson.sender_mode, 'NATIVE_API');
  assert.equal(retryEvent.payloadJson.provider_api, 'SLACK_CHAT_POST_MESSAGE');
  assert.doesNotMatch(JSON.stringify(retryEvent.payloadJson), /retry-token|Authorization/i);
});

test('records sender mode and provider api for automatic retry events', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 0 }), { status: 200 });

  const channel = buildChannel({
    channel: 'FEISHU',
  });
  const delivery = buildFailedSenderDelivery(channel, {
    provider: 'FEISHU',
    requestUrl: 'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id',
    requestHeaders: { Authorization: 'Bearer retry-token' },
    target: 'chat_id:oc_123',
  });
  const { service, recordedEvents } = await createSenderRetryService(delivery);

  await service.retryDeliveryForTask(delivery as never, 'sender-auto-retry-test');

  const retryEvent = recordedEvents.find((event) => event.eventType === 'channel.sender.auto_retry_sent');
  assert.ok(retryEvent);
  assert.equal(retryEvent.payloadJson.sender_mode, 'NATIVE_API');
  assert.equal(retryEvent.payloadJson.provider_api, 'FEISHU_IM_MESSAGE');
  assert.doesNotMatch(JSON.stringify(retryEvent.payloadJson), /retry-token|Authorization/i);
});

test('rejects Slack callback when signing secret is not configured', async () => {
  const channel = buildChannel({
    channel: 'SLACK',
    secretEncrypted: null,
  });
  const { service } = await createCallbackService(channel);
  const body = { event: { type: 'message' }, event_id: 'evt-1' };
  const rawBody = JSON.stringify(body);

  await assert.rejects(
    () => service.handle(buildRequest({ rawBody }), channelId, body),
    (error) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.match(error.message, /Slack callback signing secret is not configured/);
      return true;
    },
  );
});

test('rejects callback when explicit aiaget signature requirement is skipped', async () => {
  const channel = buildChannel({
    channel: 'CUSTOM_WEBHOOK',
    config: {
      require_aiaget_signature: true,
      skip_signature_check: true,
    },
    secretEncrypted: encryptSecret('callback-signing-secret'),
  });
  const { service } = await createCallbackService(channel);
  const body = { event: 'message.received', message: 'hello', id: 'msg-1' };

  await assert.rejects(
    () => service.handle(buildRequest({ rawBody: JSON.stringify(body) }), channelId, body),
    (error) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.match(error.message, /Missing channel callback signature/);
      return true;
    },
  );
});

test('rejects Feishu callback when configured encrypt key has no native signature', async () => {
  const channel = buildChannel({
    channel: 'FEISHU',
    config: {
      feishu_encrypt_key: 'feishu-encrypt-key',
    },
  });
  const { service } = await createCallbackService(channel);
  const body = { event: { message: { content: '{"text":"hello"}' } }, header: { event_id: 'evt-1' } };

  await assert.rejects(
    () => service.handle(buildRequest({ rawBody: JSON.stringify(body) }), channelId, body),
    (error) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.match(error.message, /Missing Feishu callback signature/);
      return true;
    },
  );
});

test('rejects Slack callback when configured native signature is invalid', async () => {
  const channel = buildChannel({
    channel: 'SLACK',
    secretEncrypted: encryptSecret(JSON.stringify({ slack_signing_secret: 'slack-signing-secret' })),
  });
  const { service } = await createCallbackService(channel);
  const body = { event: { type: 'message' }, event_id: 'evt-1' };
  const rawBody = JSON.stringify(body);

  await assert.rejects(
    () => service.handle(
      buildRequest({
        rawBody,
        headers: {
          'x-slack-request-timestamp': Math.floor(Date.now() / 1000).toString(),
          'x-slack-signature': 'v0=invalid-signature',
        },
      }),
      channelId,
      body,
    ),
    (error) => {
      assert.ok(error instanceof UnauthorizedException);
      assert.match(error.message, /Invalid Slack callback signature/);
      return true;
    },
  );
});

test('async ACK persists the callback reply and schedules the durable reply scanner', async () => {
  const secret = 'callback-signing-secret';
  const channel = buildChannel({
    channel: 'CUSTOM_WEBHOOK',
    secretEncrypted: encryptSecret(secret),
    config: {
      ack_immediately: true,
    },
  });
  const { service, replyCreates, replyFindManyInputs } = await createCallbackService(channel);
  const body = { event: 'message.received', message: 'hello from callback', id: 'msg-async-1' };
  const rawBody = JSON.stringify(body);

  const handled = await service.handle(
    buildRequest({
      rawBody,
      headers: {
        'x-aiaget-signature': `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`,
      },
    }),
    channelId,
    body,
  );

  assert.equal(handled.result.async_accepted, true);
  assert.equal(replyCreates.length, 1);
  assert.equal(replyCreates[0]?.data.status, 'RECEIVED');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(replyFindManyInputs.length, 1);
});

test('processes pending async callback replies from persisted channel replies', async () => {
  const channel = buildChannel({
    channel: 'CUSTOM_WEBHOOK',
    config: {
      ack_immediately: true,
    },
  });
  const pendingReply = buildPendingReply(channel, {
    id: 'reply-pending-1',
    content: 'recover me',
    payload: {
      event: 'message.received',
      message: 'recover me',
      id: 'msg-recover-1',
      sender_id: 'sender-1',
      response_url: 'https://hooks.example.test/reply',
    },
    externalConversationId: 'external-conversation-1',
    externalMessageId: 'msg-recover-1',
    sender: 'sender-1',
  });
  const { service, conversationCreates, replyUpdates, replyFindManyInputs } = await createCallbackService(channel, {
    pendingReplies: [pendingReply],
  });

  const result = await service.processPendingAsyncCallbackReplies({ limit: 10 });

  assert.equal(result.scanned_count, 1);
  assert.equal(result.processed_count, 1);
  assert.equal(result.failed_count, 0);
  assert.equal(conversationCreates.length, 1);
  assert.equal(conversationCreates[0]?.message, 'recover me');
  assert.equal(replyUpdates.at(-1)?.data.status, 'PROCESSED');
  assert.equal(replyFindManyInputs.length, 1);
});

async function createCallbackService(channel: Record<string, unknown>, options: { pendingReplies?: Array<Record<string, unknown>> } = {}) {
  const { ExternalChannelCallbackService } = await import('./external-channel-callback.service');
  const replyCreates: Array<{ data: Record<string, unknown> }> = [];
  const replyUpdates: Array<{ where: { id: string }; data: Record<string, unknown> }> = [];
  const replyFindManyInputs: Array<Record<string, unknown>> = [];
  const conversationCreates: Array<{ message: string; title?: string }> = [];
  const replySends: Array<Record<string, unknown>> = [];
  const prisma = {
    agentPublishChannel: {
      findFirst: async () => channel,
      update: async () => ({}),
    },
    user: {
      findFirst: async () => ({
        id: userId,
        tenantId,
        departmentId: null,
        email: 'callback@example.test',
        userRoles: [],
      }),
    },
    channelReply: {
      create: async (input: { data: Record<string, unknown> }) => {
        replyCreates.push(input);
        return { id: 'reply-1', ...input.data };
      },
      findMany: async (input: Record<string, unknown>) => {
        replyFindManyInputs.push(input);
        return options.pendingReplies ?? [];
      },
      update: async (input: { where: { id: string }; data: Record<string, unknown> }) => {
        replyUpdates.push(input);
        return { id: input.where.id, ...input.data };
      },
    },
  };
  const conversations = {
    create: async (_operator: unknown, input: { message: string; title?: string }) => {
      conversationCreates.push(input);
      return buildConversation(input.message);
    },
  };
  const platformEvents = {
    recordEvent: async () => ({ id: 'event-1' }),
    recordUsage: async () => ({}),
  };
  const rolloutGate = {
    evaluateForCallback: async () => ({ allowed: true, rollout_percentage: 100, trace_id: null }),
  };
  const channelSender = {
    sendReply: async (input: Record<string, unknown>) => {
      replySends.push(input);
      return { status: 'SENT' };
    },
  };

  return {
    replyCreates,
    replyUpdates,
    replyFindManyInputs,
    conversationCreates,
    replySends,
    service: new ExternalChannelCallbackService(
      prisma as never,
      conversations as never,
      platformEvents as never,
      rolloutGate as never,
      channelSender as never,
    ),
  };
}

function buildConversation(message: string) {
  return {
    id: 'conversation-1',
    agent_id: agentId,
    agent_name: 'Test agent',
    agent_code: 'test-agent',
    messages: [
      {
        id: 'message-1',
        role: 'ASSISTANT',
        content: `answer: ${message}`,
        references: [],
        tool_calls: [],
        created_at: '2026-05-05T00:00:00.000Z',
      },
    ],
    runs: [
      {
        id: 'run-1',
        trace_id: 'trace-recovered-1',
        status: 'SUCCESS',
        prompt_tokens: 1,
        completion_tokens: 1,
        total_tokens: 2,
        latency_ms: 10,
        cost_total: 0,
        created_at: '2026-05-05T00:00:00.000Z',
      },
    ],
  };
}

async function createSenderRetryService(delivery: Record<string, unknown>) {
  const { ExternalChannelSenderService } = await import('./external-channel-sender.service');
  const senderCreates: Array<{ data: Record<string, unknown> }> = [];
  const recordedEvents: Array<Record<string, unknown> & { payloadJson: Record<string, unknown> }> = [];
  const prisma = {
    channelSenderDelivery: {
      findFirst: () => Promise.resolve(delivery),
      create: async (input: { data: Record<string, unknown> }) => {
        senderCreates.push(input);
        return {
          id: 'retry-row-1',
          ...input.data,
          channel: delivery.channel,
          agent: delivery.agent,
          responseStatus: null,
          responseBody: null,
          errorMessage: null,
          latencyMs: null,
          deliveredAt: null,
          createdAt: new Date('2026-05-05T00:00:00.000Z'),
          updatedAt: new Date('2026-05-05T00:00:00.000Z'),
        };
      },
      update: async (input: { where: { id: string }; data: Record<string, unknown> }) => ({
        ...delivery,
        id: input.where.id,
        ...input.data,
        updatedAt: new Date('2026-05-05T00:00:01.000Z'),
      }),
    },
    channelDelivery: {
      create: async () => ({}),
      updateMany: async () => ({ count: 1 }),
    },
    operationLog: {
      create: async () => ({}),
    },
  };
  const platformEvents = {
    recordEvent: async (input: Record<string, unknown> & { payloadJson: Record<string, unknown> }) => {
      recordedEvents.push(input);
      return { id: 'event-1' };
    },
    recordUsage: async () => ({}),
  };
  const dataScopeQuery = {
    buildWhere: async () => ({ where: {} }),
  };

  return {
    senderCreates,
    recordedEvents,
    service: new ExternalChannelSenderService(prisma as never, platformEvents as never, dataScopeQuery as never),
  };
}

async function createSenderService(channel: Record<string, unknown>) {
  const { ExternalChannelSenderService } = await import('./external-channel-sender.service');
  const senderCreates: Array<{ data: Record<string, unknown> }> = [];
  const senderUpdates: Array<{ data: Record<string, unknown> }> = [];
  const normalizedCreates: Array<{ data: Record<string, unknown> }> = [];
  const normalizedUpdates: Array<{ data: Record<string, unknown> }> = [];
  const recordedEvents: Array<Record<string, unknown> & { payloadJson: Record<string, unknown> }> = [];
  const prisma = {
    channelSenderDelivery: {
      create: async (input: { data: Record<string, unknown> }) => {
        senderCreates.push(input);
        return {
          id: 'sender-row-1',
          ...input.data,
          channel,
          agent: channel.agent,
          responseStatus: null,
          responseBody: null,
          errorMessage: null,
          latencyMs: null,
          deliveredAt: null,
          createdAt: new Date('2026-05-05T00:00:00.000Z'),
          updatedAt: new Date('2026-05-05T00:00:00.000Z'),
        };
      },
      update: async (input: { where: { id: string }; data: Record<string, unknown> }) => {
        senderUpdates.push(input);
        const senderCreate = senderCreates[0];
        if (!senderCreate) throw new Error('Sender delivery update called before create');
        return {
          id: input.where.id,
          ...senderCreate.data,
          ...input.data,
          channel,
          agent: channel.agent,
          createdAt: new Date('2026-05-05T00:00:00.000Z'),
          updatedAt: new Date('2026-05-05T00:00:00.000Z'),
        };
      },
    },
    channelDelivery: {
      create: async (input: { data: Record<string, unknown> }) => {
        normalizedCreates.push(input);
        return { id: 'normalized-row-1', ...input.data };
      },
      updateMany: async (input: { data: Record<string, unknown> }) => {
        normalizedUpdates.push(input);
        return { count: 1 };
      },
    },
  };
  const platformEvents = {
    recordEvent: async (input: Record<string, unknown> & { payloadJson: Record<string, unknown> }) => {
      recordedEvents.push(input);
      return { id: 'event-1' };
    },
    recordUsage: async () => ({}),
  };

  return {
    senderCreates,
    senderUpdates,
    normalizedCreates,
    normalizedUpdates,
    recordedEvents,
    service: new ExternalChannelSenderService(prisma as never, platformEvents as never, {} as never),
  };
}

function buildChannel(overrides: Record<string, unknown> = {}) {
  return {
    id: channelId,
    tenantId,
    agentId,
    accountId: null,
    channel: 'CUSTOM_WEBHOOK',
    name: 'Test channel',
    status: 'ACTIVE',
    config: {},
    callbackUrl: null,
    secretEncrypted: null,
    createdBy: userId,
    agent: {
      id: agentId,
      tenantId,
      ownerId: userId,
      createdBy: userId,
      name: 'Test agent',
      status: 'PUBLISHED',
      deletedAt: null,
    },
    account: null,
    ...overrides,
  };
}

function buildPendingReply(channel: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
  return {
    id: 'reply-pending-1',
    tenantId,
    agentId,
    publishChannelId: channel.id,
    providerId: null,
    accountId: channel.accountId ?? null,
    deliveryId: null,
    replyKey: 'cr_request-1_msg-recover-1',
    direction: 'INBOUND',
    sender: 'sender-1',
    recipient: channel.name,
    contentType: 'TEXT',
    content: 'recover me',
    payload: {
      event: 'message.received',
      message: 'recover me',
      id: 'msg-recover-1',
    },
    status: 'RECEIVED',
    conversationId: null,
    messageId: null,
    traceId: 'trace-pending-1',
    externalConversationId: 'external-conversation-1',
    externalMessageId: 'msg-recover-1',
    receivedAt: new Date('2026-05-05T00:00:00.000Z'),
    processedAt: null,
    createdAt: new Date('2026-05-05T00:00:00.000Z'),
    updatedAt: new Date('2026-05-05T00:00:00.000Z'),
    deletedAt: null,
    createdBy: userId,
    updatedBy: userId,
    publishChannel: channel,
    agent: channel.agent,
    account: channel.account ?? null,
    provider: null,
    delivery: null,
    ...overrides,
  };
}

function buildFailedSenderDelivery(channel: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
  return {
    id: 'sender-row-1',
    tenantId,
    channelId,
    agentId,
    deliveryId: 'delivery-1',
    parentDeliveryId: null,
    provider: 'CUSTOM_WEBHOOK',
    target: 'https://hooks.example.test/sender?token=%5BREDACTED%5D&plain=1',
    requestUrl: 'https://hooks.example.test/sender?token=%5BREDACTED%5D&plain=1',
    requestBody: { text: 'answer' },
    requestHeaders: { 'x-aiaget-signature': '[REDACTED]' },
    status: 'FAILED',
    responseStatus: 500,
    responseBody: null,
    errorMessage: 'failed',
    retryCount: 0,
    latencyMs: 100,
    conversationId: 'conversation-1',
    runId: 'run-1',
    traceId: 'trace-1',
    externalConversationId: 'external-conversation-1',
    externalMessageId: 'external-message-1',
    deliveredAt: new Date('2026-05-05T00:00:00.000Z'),
    createdAt: new Date('2026-05-05T00:00:00.000Z'),
    updatedAt: new Date('2026-05-05T00:00:00.000Z'),
    channel,
    agent: channel.agent,
    ...overrides,
  };
}

function buildRequest(input: Partial<RequestWithContext> = {}): RequestWithContext {
  return {
    requestId: 'request-1',
    traceId: 'trace-1',
    headers: {},
    query: {},
    ...input,
  } as RequestWithContext;
}

function buildOperator() {
  return {
    id: userId,
    tenantId,
    departmentId: null,
    email: 'operator@example.test',
    roles: [],
    roleIds: [],
    permissions: [],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}
