import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AiagetExternalApiClient,
  AiagetExternalApiError,
  createAiagetWebhookSignature,
  readExternalAgentStream,
  verifyAiagetWebhookSignature,
  type ExternalAgentChatResponse,
} from './index.js';

test('chat constructs request URL, auth headers, tracing headers, and preserves idempotency body', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const client = new AiagetExternalApiClient({
    baseUrl: 'https://api.example.test/api/v1/',
    apiKey: 'secret-key',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });
      return jsonResponse(chatResponse());
    },
    defaultHeaders: {
      'x-sdk-client': 'behavior-test',
    },
  });

  await client.chat(
    'agent/alpha',
    {
      message: 'hello',
      title: 'Greeting',
      idempotency_key: 'idem-123',
    },
    {
      requestId: 'req-123',
      traceId: 'trace-123',
      headers: {
        'x-extra': 'yes',
      },
    },
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, 'https://api.example.test/api/v1/external/agents/agent%2Falpha/chat');
  assert.equal(calls[0]?.init.method, 'POST');
  assert.deepEqual(calls[0]?.init.headers, {
    accept: 'application/json',
    'content-type': 'application/json',
    'x-sdk-client': 'behavior-test',
    'x-extra': 'yes',
    authorization: 'Bearer secret-key',
    'x-request-id': 'req-123',
    'x-trace-id': 'trace-123',
  });
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), {
    message: 'hello',
    title: 'Greeting',
    idempotency_key: 'idem-123',
  });
});

test('x-api-key auth mode sends x-api-key header instead of bearer authorization', async () => {
  let headers: HeadersInit | undefined;
  const client = new AiagetExternalApiClient({
    baseUrl: 'https://api.example.test',
    apiKey: 'api-key-value',
    authMode: 'x-api-key',
    fetchImpl: async (_url, init) => {
      headers = init?.headers;
      return jsonResponse(chatResponse());
    },
  });

  await client.chat('agent-alpha', { message: 'hello' });

  assert.equal((headers as Record<string, string>)['x-api-key'], 'api-key-value');
  assert.equal((headers as Record<string, string>).authorization, undefined);
});

test('error responses throw AiagetExternalApiError with status, request id, and parsed body', async () => {
  const client = new AiagetExternalApiClient({
    baseUrl: 'https://api.example.test',
    apiKey: 'secret-key',
    fetchImpl: async () =>
      jsonResponse(
        {
          message: ['message is required', 'agent is disabled'],
          statusCode: 400,
        },
        {
          status: 400,
          headers: {
            'x-request-id': 'req-error',
          },
        },
      ),
  });

  await assert.rejects(
    () => client.chat('agent-alpha', { message: '' }),
    (error) => {
      assert.ok(error instanceof AiagetExternalApiError);
      assert.equal(error.message, 'message is required, agent is disabled');
      assert.equal(error.status, 400);
      assert.equal(error.requestId, 'req-error');
      assert.deepEqual(error.body, {
        message: ['message is required', 'agent is disabled'],
        statusCode: 400,
      });
      return true;
    },
  );
});

test('SSE parser handles events split across chunks and invokes callbacks in event order', async () => {
  const callbackOrder: string[] = [];
  const response = chatResponse({ answer: 'hello world' });
  const stream = streamFromChunks([
    'data: {"type":"start","trace_id":"trace-1","request_model":"gpt-test","steps":[],"references":[],"tool_calls":[]}\n\n',
    'data: {"type":"delta","delta":"hel',
    'lo"}\n\n',
    'data: {"type":"delta","delta":" world"}\n\n',
    `data: ${JSON.stringify({ type: 'done', result: response })}\n\n`,
  ]);

  const result = await readExternalAgentStream(stream, {
    onEvent: (event) => callbackOrder.push(`event:${event.type}`),
    onStart: () => callbackOrder.push('start'),
    onDelta: (delta) => callbackOrder.push(`delta:${delta}`),
    onDone: (doneResult) => callbackOrder.push(`done:${doneResult.answer}`),
  });

  assert.equal(result.text, 'hello world');
  assert.equal(result.result?.answer, 'hello world');
  assert.deepEqual(
    result.events.map((event) => event.type),
    ['start', 'delta', 'delta', 'done'],
  );
  assert.deepEqual(callbackOrder, [
    'event:start',
    'start',
    'event:delta',
    'delta:hello',
    'event:delta',
    'delta: world',
    'event:done',
    'done:hello world',
  ]);
});

test('webhook signatures verify valid payloads and reject invalid signatures or timestamps outside tolerance', async () => {
  const body = JSON.stringify({ event: 'conversation.completed', id: 'evt_123' });
  const timestamp = '1710000000';
  const secret = 'webhook-secret';
  const signature = await createAiagetWebhookSignature(secret, timestamp, body);

  assert.equal(
    await verifyAiagetWebhookSignature({
      secret,
      timestamp,
      body,
      signature,
      now: new Date(1_710_000_120_000),
    }),
    true,
  );
  assert.equal(
    await verifyAiagetWebhookSignature({
      secret,
      timestamp,
      body,
      signature: `${signature}00`,
      now: new Date(1_710_000_120_000),
    }),
    false,
  );
  assert.equal(
    await verifyAiagetWebhookSignature({
      secret,
      timestamp,
      body,
      signature,
      now: new Date(1_710_000_301_000),
    }),
    false,
  );
});

function chatResponse(overrides: Partial<ExternalAgentChatResponse> = {}): ExternalAgentChatResponse {
  return {
    conversation_id: 'conversation-1',
    agent_id: 'agent-alpha',
    channel_id: null,
    idempotency_key: null,
    idempotency_replayed: false,
    agent_name: 'Support Agent',
    agent_code: 'support',
    message_id: 'message-1',
    run_id: 'run-1',
    trace_id: 'trace-1',
    status: 'SUCCESS',
    answer: 'hello',
    references: [],
    tool_calls: [],
    usage: {
      prompt_tokens: 1,
      completion_tokens: 1,
      total_tokens: 2,
      latency_ms: 10,
      cost_total: null,
    },
    created_at: '2026-05-12T00:00:00.000Z',
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
    ...init,
  });
}

function streamFromChunks(chunks: string[]) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}
