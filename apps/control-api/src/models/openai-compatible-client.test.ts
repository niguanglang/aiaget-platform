import assert from 'node:assert/strict';
import test from 'node:test';

import { executeOpenAiCompatibleChat, streamOpenAiCompatibleChat } from './openai-compatible-client';

test('control fallback Azure adapter uses configured api version and api-key header', async () => {
  const calls: Array<{ url: string; headers: Headers; body: Record<string, unknown> }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    calls.push({
      url: input instanceof URL ? input.toString() : String(input),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    return jsonResponse({
      model: 'gpt-4o',
      choices: [{ message: { content: 'Azure 已响应。' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    });
  };

  try {
    const result = await executeOpenAiCompatibleChat({
      providerType: 'AZURE_OPENAI',
      apiKey: 'azure-secret',
      baseUrl: 'https://azure.example.test/openai/deployments/prod-gpt',
      apiVersion: '2025-01-01-preview',
      model: 'prod-gpt',
      temperature: 0.2,
      messages: [{ role: 'user', content: '你好' }],
    });

    assert.equal(result.errorMessage, null);
    assert.equal(result.responseSummary.adapter, 'AZURE_OPENAI');
    assert.equal(
      calls[0]?.url,
      'https://azure.example.test/openai/deployments/prod-gpt/chat/completions?api-version=2025-01-01-preview',
    );
    assert.equal(calls[0]?.headers.get('api-key'), 'azure-secret');
    assert.equal(calls[0]?.headers.has('authorization'), false);
    assert.equal(calls[0]?.body.model, 'prod-gpt');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('control fallback Anthropic adapter uses configured max output tokens and normalizes usage', async () => {
  const calls: Array<{ url: string; headers: Headers; body: Record<string, unknown> }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    calls.push({
      url: input instanceof URL ? input.toString() : String(input),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    return jsonResponse({
      model: 'claude-3-5-sonnet',
      content: [{ type: 'text', text: 'Claude 已响应。' }],
      usage: { input_tokens: 12, output_tokens: 7 },
    });
  };

  try {
    const result = await executeOpenAiCompatibleChat({
      providerType: 'ANTHROPIC',
      apiKey: 'anthropic-secret',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet',
      maxOutputTokens: 4096,
      temperature: 0.2,
      messages: [
        { role: 'system', content: '你是企业助手。' },
        { role: 'user', content: '你好' },
      ],
    });

    assert.equal(result.errorMessage, null);
    assert.equal(result.requestModel, 'claude-3-5-sonnet');
    assert.equal(result.outputText, 'Claude 已响应。');
    assert.equal(result.promptTokens, 12);
    assert.equal(result.completionTokens, 7);
    assert.equal(result.totalTokens, 19);
    assert.equal(result.responseSummary.adapter, 'ANTHROPIC');
    assert.equal(calls[0]?.url, 'https://api.anthropic.com/v1/messages');
    assert.equal(calls[0]?.headers.get('x-api-key'), 'anthropic-secret');
    assert.equal(calls[0]?.headers.get('anthropic-version'), '2023-06-01');
    assert.equal(calls[0]?.headers.has('authorization'), false);
    assert.equal(calls[0]?.body.max_tokens, 4096);
    assert.equal(calls[0]?.body.system, '你是企业助手。');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('control fallback Azure streaming adapter keeps Azure URL and header contract', async () => {
  const calls: Array<{ url: string; headers: Headers; body: Record<string, unknown> }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    calls.push({
      url: input instanceof URL ? input.toString() : String(input),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    return streamResponse([
      'data: {"model":"gpt-4o","choices":[{"delta":{"content":"Azure"}}]}\n\n',
      'data: {"model":"gpt-4o","choices":[{"delta":{"content":" 流式"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
  };

  try {
    const deltas: string[] = [];
    const result = await streamOpenAiCompatibleChat({
      providerType: 'AZURE_OPENAI',
      apiKey: 'azure-secret',
      baseUrl: 'https://azure.example.test/openai/deployments/prod-gpt',
      apiVersion: '2025-01-01-preview',
      model: 'prod-gpt',
      temperature: 0.2,
      messages: [{ role: 'user', content: '你好' }],
    }, {
      onDelta: (delta) => deltas.push(delta),
    });

    assert.equal(result.outputText, 'Azure 流式');
    assert.equal(result.responseSummary.adapter, 'AZURE_OPENAI');
    assert.deepEqual(deltas, ['Azure', ' 流式']);
    assert.equal(
      calls[0]?.url,
      'https://azure.example.test/openai/deployments/prod-gpt/chat/completions?api-version=2025-01-01-preview',
    );
    assert.equal(calls[0]?.headers.get('api-key'), 'azure-secret');
    assert.equal(calls[0]?.headers.has('authorization'), false);
    assert.equal(calls[0]?.body.stream, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('control fallback Anthropic streaming adapter converts content block deltas', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => streamResponse([
    'data: {"type":"message_start","message":{"model":"claude-3-5-sonnet","usage":{"input_tokens":12,"output_tokens":0}}}\n\n',
    'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Claude"}}\n\n',
    'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" 流式"}}\n\n',
    'data: {"type":"message_delta","usage":{"input_tokens":12,"output_tokens":7}}\n\n',
  ]);

  try {
    const deltas: string[] = [];
    const result = await streamOpenAiCompatibleChat({
      providerType: 'ANTHROPIC',
      apiKey: 'anthropic-secret',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet',
      maxOutputTokens: 4096,
      temperature: 0.2,
      messages: [{ role: 'user', content: '你好' }],
    }, {
      onDelta: (delta) => deltas.push(delta),
    });

    assert.equal(result.outputText, 'Claude 流式');
    assert.equal(result.requestModel, 'claude-3-5-sonnet');
    assert.equal(result.responseSummary.adapter, 'ANTHROPIC');
    assert.equal(result.promptTokens, 12);
    assert.equal(result.completionTokens, 7);
    assert.deepEqual(deltas, ['Claude', ' 流式']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function streamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  }), {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}
