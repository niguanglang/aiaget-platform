import assert from 'node:assert/strict';
import test from 'node:test';

import { encryptSecret } from '../models/model-secrets';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.CONTROL_API_INTERNAL_BASE_URL ??= 'http://control-api.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

const tenantId = '00000000-0000-0000-0000-000000000001';
const userId = '00000000-0000-0000-0000-000000000002';
const agentId = '00000000-0000-0000-0000-000000000003';
const channelId = '00000000-0000-0000-0000-000000000004';

test('sends WeChat Work replies through native message API without sender observability fields in request body', async (t) => {
  const { service, requests, senderCreates, recordedEvents } = await createSenderHarness(t, [
    { body: { errcode: 0, errmsg: 'ok' } },
  ]);
  const channel = buildChannel({
    channel: 'WECHAT_WORK',
    config: {
      wechat_work_access_token: 'wechat-access-token',
      wechat_work_agent_id: '100001',
    },
  });

  const result = await service.sendReply(buildSendReplyInput(channel, {
    provider: 'WECHAT_WORK',
    senderId: 'zhangsan',
  }));

  assert.equal(result.status, 'SENT');
  assert.equal(requests.length, 1);
  assert.match(requests[0]?.url ?? '', /^https:\/\/qyapi\.weixin\.qq\.com\/cgi-bin\/message\/send\?access_token=wechat-access-token$/);
  assert.deepEqual(requests[0]?.body, {
    touser: 'zhangsan',
    msgtype: 'text',
    agentid: 100001,
    text: {
      content: 'answer',
    },
    safe: 0,
  });
  assertRequestBodyHasNoSenderObservability(requests[0]?.body);
  assert.equal(recordedEvents[0]?.payloadJson.sender_mode, 'NATIVE_API');
  assert.equal(recordedEvents[0]?.payloadJson.provider_api, 'WECHAT_WORK_MESSAGE_SEND');
  assert.doesNotMatch(JSON.stringify(senderCreates[0]?.data), /wechat-access-token/);
});

test('sends DingTalk replies through signed session webhook without sender observability fields in request body', async (t) => {
  const { service, requests, recordedEvents } = await createSenderHarness(t, [
    { body: { errcode: 0, errmsg: 'ok' } },
  ]);
  const channel = buildChannel({
    channel: 'DINGTALK',
    config: {
      dingtalk_sign_secret: 'ding-secret',
    },
  });

  const result = await service.sendReply(buildSendReplyInput(channel, {
    provider: 'DINGTALK',
    responseUrl: 'https://oapi.dingtalk.com/robot/send?access_token=ding-token',
  }));

  assert.equal(result.status, 'SENT');
  assert.equal(requests.length, 1);
  assert.match(requests[0]?.url ?? '', /^https:\/\/oapi\.dingtalk\.com\/robot\/send\?access_token=ding-token&timestamp=\d+&sign=/);
  assert.deepEqual(requests[0]?.body, {
    msgtype: 'text',
    text: {
      content: 'answer',
    },
  });
  assertRequestBodyHasNoSenderObservability(requests[0]?.body);
  assert.equal(recordedEvents[0]?.payloadJson.sender_mode, 'WEBHOOK');
  assert.equal(recordedEvents[0]?.payloadJson.provider_api, 'DINGTALK_SESSION_WEBHOOK');
});

test('sends Feishu replies through native IM API without sender observability fields in request body', async (t) => {
  const { service, requests, recordedEvents } = await createSenderHarness(t, [
    { body: { code: 0, msg: 'ok' } },
  ]);
  const channel = buildChannel({
    channel: 'FEISHU',
    config: {
      feishu_tenant_access_token: 'feishu-token',
    },
  });

  const result = await service.sendReply(buildSendReplyInput(channel, {
    provider: 'FEISHU',
    externalConversationId: 'oc_chat_1',
  }));

  assert.equal(result.status, 'SENT');
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, 'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id');
  assert.deepEqual(requests[0]?.body, {
    receive_id: 'oc_chat_1',
    msg_type: 'text',
    content: JSON.stringify({ text: 'answer' }),
  });
  assert.equal(requests[0]?.headers.authorization, 'Bearer feishu-token');
  assertRequestBodyHasNoSenderObservability(requests[0]?.body);
  assert.equal(recordedEvents[0]?.payloadJson.sender_mode, 'NATIVE_API');
  assert.equal(recordedEvents[0]?.payloadJson.provider_api, 'FEISHU_IM_MESSAGE');
});

test('sends Feishu replies through webhook fallback without sender observability fields in request body', async (t) => {
  const { service, requests, recordedEvents } = await createSenderHarness(t, [
    { body: { StatusCode: 0, StatusMessage: 'success' } },
  ]);
  const channel = buildChannel({
    channel: 'FEISHU',
    config: {
      sender_webhook_url: 'https://open.feishu.cn/open-apis/bot/v2/hook/feishu-hook-secret',
      feishu_tenant_access_token: 'feishu-token',
    },
  });

  const result = await service.sendReply(buildSendReplyInput(channel, {
    provider: 'FEISHU',
    externalConversationId: 'oc_chat_1',
  }));

  assert.equal(result.status, 'SENT');
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, 'https://open.feishu.cn/open-apis/bot/v2/hook/feishu-hook-secret');
  assert.deepEqual(requests[0]?.body, {
    msg_type: 'text',
    content: {
      text: 'answer',
    },
  });
  assert.equal(requests[0]?.headers.authorization, undefined);
  assertRequestBodyHasNoSenderObservability(requests[0]?.body);
  assert.equal(recordedEvents[0]?.payloadJson.sender_mode, 'WEBHOOK');
  assert.equal(recordedEvents[0]?.payloadJson.provider_api, 'FEISHU_BOT_WEBHOOK');
});

test('sends Slack replies through webhook fallback without sender observability fields in request body', async (t) => {
  const { service, requests, recordedEvents } = await createSenderHarness(t, [
    { body: 'ok' },
  ]);
  const channel = buildChannel({
    channel: 'SLACK',
    config: {
      sender_webhook_url: 'https://hooks.slack.com/services/T000/B000/secret',
      slack_bot_token: 'xoxb-token',
    },
  });

  const result = await service.sendReply(buildSendReplyInput(channel, {
    provider: 'SLACK',
    externalConversationId: 'C123',
    externalMessageId: '1714970000.000100',
  }));

  assert.equal(result.status, 'SENT');
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, 'https://hooks.slack.com/services/T000/B000/secret');
  assert.deepEqual(requests[0]?.body, {
    text: 'answer',
  });
  assert.equal(requests[0]?.headers.authorization, undefined);
  assertRequestBodyHasNoSenderObservability(requests[0]?.body);
  assert.equal(recordedEvents[0]?.payloadJson.sender_mode, 'WEBHOOK');
  assert.equal(recordedEvents[0]?.payloadJson.provider_api, 'SLACK_INCOMING_WEBHOOK');
});

test('sends Slack replies through native chat.postMessage without sender observability fields in request body', async (t) => {
  const { service, requests, recordedEvents } = await createSenderHarness(t, [
    { body: { ok: true } },
  ]);
  const channel = buildChannel({
    channel: 'SLACK',
    config: {
      slack_bot_token: 'xoxb-token',
    },
  });

  const result = await service.sendReply(buildSendReplyInput(channel, {
    provider: 'SLACK',
    externalConversationId: 'C123',
    externalMessageId: '1714970000.000100',
  }));

  assert.equal(result.status, 'SENT');
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, 'https://slack.com/api/chat.postMessage');
  assert.deepEqual(requests[0]?.body, {
    channel: 'C123',
    text: 'answer',
    thread_ts: '1714970000.000100',
  });
  assert.equal(requests[0]?.headers.authorization, 'Bearer xoxb-token');
  assertRequestBodyHasNoSenderObservability(requests[0]?.body);
  assert.equal(recordedEvents[0]?.payloadJson.sender_mode, 'NATIVE_API');
  assert.equal(recordedEvents[0]?.payloadJson.provider_api, 'SLACK_CHAT_POST_MESSAGE');
});

test('sends custom webhook replies with channel signature and without sender observability fields in request body', async (t) => {
  const { service, requests, recordedEvents } = await createSenderHarness(t, [
    { body: { ok: true } },
  ]);
  const channel = buildChannel({
    channel: 'CUSTOM_WEBHOOK',
    config: {
      webhook_url: 'https://hooks.example.test/sender?token=custom-token',
    },
    secretEncrypted: encryptSecret(JSON.stringify({ sender_secret: 'custom-sender-secret' })),
  });

  const result = await service.sendReply(buildSendReplyInput(channel, {
    provider: 'CUSTOM_WEBHOOK',
    externalConversationId: 'external-conversation-1',
    externalMessageId: 'external-message-1',
  }));

  assert.equal(result.status, 'SENT');
  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, 'https://hooks.example.test/sender?token=custom-token');
  assert.deepEqual(requests[0]?.body, {
    channel_id: channelId,
    agent_id: agentId,
    conversation_id: 'conversation-1',
    run_id: 'run-1',
    trace_id: 'trace-1',
    external_conversation_id: 'external-conversation-1',
    external_message_id: 'external-message-1',
    text: 'answer',
  });
  assert.match(requests[0]?.headers['x-aiaget-signature'] ?? '', /^sha256=/);
  assert.ok(requests[0]?.headers['x-aiaget-timestamp']);
  assertRequestBodyHasNoSenderObservability(requests[0]?.body);
  assert.equal(recordedEvents[0]?.payloadJson.sender_mode, 'WEBHOOK');
  assert.equal(recordedEvents[0]?.payloadJson.provider_api, 'CUSTOM_WEBHOOK');
});

async function createSenderHarness(
  t: { after: (fn: () => void) => void },
  responses: Array<{ body: unknown; status?: number }>,
) {
  const { ExternalChannelSenderService } = await import('./external-channel-sender.service');
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; headers: Record<string, string>; body: unknown }> = [];
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url, init) => {
    requests.push({
      url: String(url),
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: init?.body ? JSON.parse(String(init.body)) as unknown : null,
    });
    const response = responses.shift() ?? { body: { ok: true } };

    return new Response(
      typeof response.body === 'string' ? response.body : JSON.stringify(response.body),
      { status: response.status ?? 200 },
    );
  };

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
          channel: buildChannel({ channel: input.data.provider }),
          agent: buildChannel().agent,
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
          channel: buildChannel({ channel: senderCreate.data.provider }),
          agent: buildChannel().agent,
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
    requests,
    senderCreates,
    senderUpdates,
    normalizedCreates,
    normalizedUpdates,
    recordedEvents,
    service: new ExternalChannelSenderService(prisma as never, platformEvents as never, {} as never),
  };
}

function buildSendReplyInput(
  channel: ReturnType<typeof buildChannel>,
  message: Partial<{
    provider: 'WECHAT_WORK' | 'DINGTALK' | 'FEISHU' | 'SLACK' | 'CUSTOM_WEBHOOK';
    externalConversationId: string | null;
    externalMessageId: string | null;
    senderId: string | null;
    responseUrl: string | null;
  }>,
) {
  return {
    request: {
      requestId: 'request-1',
      traceId: 'trace-1',
      headers: {},
      query: {},
    } as never,
    channel: channel as never,
    operator: buildOperator(),
    message: {
      provider: message.provider ?? 'CUSTOM_WEBHOOK',
      text: 'incoming',
      externalConversationId: message.externalConversationId ?? null,
      externalMessageId: message.externalMessageId ?? null,
      senderId: message.senderId ?? null,
      responseUrl: message.responseUrl ?? null,
    },
    answer: 'answer',
    conversationId: 'conversation-1',
    runId: 'run-1',
    traceId: 'trace-1',
  };
}

function assertRequestBodyHasNoSenderObservability(body: unknown) {
  const value = JSON.stringify(body);
  assert.doesNotMatch(value, /sender_mode/);
  assert.doesNotMatch(value, /provider_api/);
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
