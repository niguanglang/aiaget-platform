import { buildTraceparent, createSpanId, createTraceId, traceHeaders } from '../common/tracing/trace-context';

export interface ChatExecutionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAiCompatibleConfig {
  providerType?: string;
  apiKey: string;
  baseUrl: string;
  apiVersion?: string | null;
  maxOutputTokens?: number | null;
  model: string;
  messages: ChatExecutionMessage[];
  temperature?: number;
  traceId?: string;
  traceparent?: string;
}

export interface OpenAiCompatibleResult {
  traceId: string;
  requestModel: string;
  outputText: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  requestSummary: Record<string, unknown>;
  responseSummary: Record<string, unknown>;
  errorMessage: string | null;
}

export interface OpenAiCompatibleStreamCallbacks {
  onDelta: (delta: string) => void;
}

export interface OpenAiCompatibleEmbeddingResult {
  requestModel: string;
  embeddings: number[][];
  latencyMs: number;
  errorMessage: string | null;
}

export async function executeOpenAiCompatibleChat(
  config: OpenAiCompatibleConfig,
): Promise<OpenAiCompatibleResult> {
  const traceId = config.traceId ?? createTraceId();
  const traceparent = config.traceparent ?? buildTraceparent(traceId, createSpanId());
  const requestPayload = createPayload(config, false);
  const adapter = resolveAdapter(config.providerType);
  const url = buildProviderUrl(config);
  const startedAt = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: buildProviderHeaders(config, traceId, traceparent, false),
    body: JSON.stringify(requestPayload),
  });

  const latencyMs = Date.now() - startedAt;
  const responseJson = await safeJson(response);

  if (!response.ok) {
    return {
      traceId,
      requestModel: config.model,
      outputText: '',
      promptTokens: estimateMessagesTokens(config.messages),
      completionTokens: 0,
      totalTokens: estimateMessagesTokens(config.messages),
      latencyMs,
      requestSummary: {
        adapter,
        trace_id: traceId,
        traceparent,
        messages: previewMessages(config.messages),
      },
      responseSummary: {
        status: response.status,
        body: responseJson,
      },
      errorMessage: extractProviderError(responseJson) ?? `Provider responded with HTTP ${response.status}`,
    };
  }

  const content = extractProviderCompletionText(adapter, responseJson);
  const usage = extractProviderUsage(adapter, responseJson, config.messages, content);

  return {
    traceId,
    requestModel: extractProviderResponseModel(adapter, responseJson) ?? config.model,
    outputText: content,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    latencyMs,
    requestSummary: {
      adapter,
      trace_id: traceId,
      traceparent,
      messages: previewMessages(config.messages),
    },
    responseSummary: {
      adapter,
      id: isObject(responseJson) ? responseJson.id ?? null : null,
      output_preview: content.slice(0, 240),
      usage: isObject(responseJson) ? responseJson.usage ?? null : null,
    },
    errorMessage: null,
  };
}

export async function streamOpenAiCompatibleChat(
  config: OpenAiCompatibleConfig,
  callbacks: OpenAiCompatibleStreamCallbacks,
): Promise<OpenAiCompatibleResult> {
  const traceId = config.traceId ?? createTraceId();
  const traceparent = config.traceparent ?? buildTraceparent(traceId, createSpanId());
  const requestPayload = createPayload(config, true);
  const adapter = resolveAdapter(config.providerType);
  const url = buildProviderUrl(config);
  const startedAt = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: buildProviderHeaders(config, traceId, traceparent, true),
    body: JSON.stringify(requestPayload),
  });

  const requestSummary = {
    adapter,
    trace_id: traceId,
    traceparent,
    messages: previewMessages(config.messages),
  };

  if (!response.ok || !response.body) {
    const responseJson = await safeJson(response);
    const latencyMs = Date.now() - startedAt;
    return {
      traceId,
      requestModel: config.model,
      outputText: '',
      promptTokens: estimateMessagesTokens(config.messages),
      completionTokens: 0,
      totalTokens: estimateMessagesTokens(config.messages),
      latencyMs,
      requestSummary,
      responseSummary: {
        status: response.status,
        body: responseJson,
      },
      errorMessage: extractProviderError(responseJson) ?? `Provider responded with HTTP ${response.status}`,
    };
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let outputText = '';
  let responseModel: string | null = null;
  let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null = null;

  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    let boundary = buffer.indexOf('\n\n');

    while (boundary >= 0) {
      const rawEvent = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (rawEvent) {
        const parsed = parseProviderSseEvent(rawEvent);
        if (parsed === '[DONE]') {
          boundary = buffer.indexOf('\n\n');
          continue;
        }

        if (parsed) {
          const delta = extractProviderStreamDelta(adapter, parsed);
          if (delta) {
            outputText += delta;
            callbacks.onDelta(delta);
          }

          responseModel = extractProviderStreamModel(adapter, parsed) ?? responseModel;
          const nextUsage = extractProviderUsageFromStream(adapter, parsed);
          if (nextUsage) {
            usage = nextUsage;
          }
        }
      }

      boundary = buffer.indexOf('\n\n');
    }
  }

  const latencyMs = Date.now() - startedAt;
  const resolvedUsage = usage ?? estimateUsageFallback(config.messages, outputText);

  return {
    traceId,
    requestModel: responseModel ?? config.model,
    outputText,
    promptTokens: resolvedUsage.promptTokens,
    completionTokens: resolvedUsage.completionTokens,
    totalTokens: resolvedUsage.totalTokens,
    latencyMs,
    requestSummary,
    responseSummary: {
      adapter,
      output_preview: outputText.slice(0, 240),
      streamed: true,
    },
    errorMessage: null,
  };
}

export async function executeOpenAiCompatibleEmbeddings(config: {
  apiKey: string;
  baseUrl: string;
  model: string;
  input: string[];
}): Promise<OpenAiCompatibleEmbeddingResult> {
  const url = buildEmbeddingsUrl(config.baseUrl);
  const startedAt = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      input: config.input,
    }),
  });
  const latencyMs = Date.now() - startedAt;
  const responseJson = await safeJson(response);

  if (!response.ok || !isObject(responseJson) || !Array.isArray(responseJson.data)) {
    return {
      requestModel: config.model,
      embeddings: [],
      latencyMs,
      errorMessage: extractProviderError(responseJson) ?? `Provider responded with HTTP ${response.status}`,
    };
  }

  const embeddings = responseJson.data
    .map((item) => (isObject(item) && Array.isArray(item.embedding) ? item.embedding.filter((value) => typeof value === 'number') as number[] : []))
    .filter((embedding) => embedding.length > 0);

  return {
    requestModel: extractResponseModel(responseJson) ?? config.model,
    embeddings,
    latencyMs,
    errorMessage: null,
  };
}

function buildChatUrl(baseUrl: string) {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL('chat/completions', normalized);
}

function buildAzureChatUrl(baseUrl: string, apiVersion?: string | null) {
  const url = buildChatUrl(baseUrl);
  url.searchParams.set('api-version', apiVersion?.trim() || '2024-06-01');
  return url;
}

function buildAnthropicMessagesUrl(baseUrl: string) {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL('messages', normalized);
}

function buildEmbeddingsUrl(baseUrl: string) {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL('embeddings', normalized);
}

function createPayload(config: OpenAiCompatibleConfig, stream: boolean) {
  if (resolveAdapter(config.providerType) === 'ANTHROPIC') {
    return createAnthropicPayload(config, stream);
  }

  return {
    model: config.model,
    messages: config.messages,
    temperature: config.temperature ?? 0.7,
    stream,
    ...(stream ? { stream_options: { include_usage: true } } : {}),
  };
}

function createAnthropicPayload(config: OpenAiCompatibleConfig, stream: boolean) {
  const systemMessages = config.messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter(Boolean);
  const conversationMessages = config.messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }));

  return {
    model: config.model,
    messages: conversationMessages.length > 0 ? conversationMessages : [{ role: 'user', content: '请根据系统指令继续。' }],
    max_tokens: config.maxOutputTokens ?? 2048,
    temperature: config.temperature ?? 0.7,
    stream,
    ...(systemMessages.length > 0 ? { system: systemMessages.join('\n\n') } : {}),
  };
}

function buildProviderUrl(config: OpenAiCompatibleConfig) {
  const adapter = resolveAdapter(config.providerType);
  if (adapter === 'AZURE_OPENAI') {
    return buildAzureChatUrl(config.baseUrl, config.apiVersion);
  }
  if (adapter === 'ANTHROPIC') {
    return buildAnthropicMessagesUrl(config.baseUrl);
  }
  return buildChatUrl(config.baseUrl);
}

function buildProviderHeaders(
  config: OpenAiCompatibleConfig,
  traceId: string,
  traceparent: string,
  stream: boolean,
) {
  const adapter = resolveAdapter(config.providerType);
  const headers: Record<string, string> = {
    accept: stream ? 'text/event-stream' : 'application/json',
    'content-type': 'application/json',
    ...traceHeaders({ traceId, traceparent }),
  };
  if (adapter === 'AZURE_OPENAI') {
    headers['api-key'] = config.apiKey;
  } else if (adapter === 'ANTHROPIC') {
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers.authorization = `Bearer ${config.apiKey}`;
  }

  return headers;
}

function resolveAdapter(providerType: string | undefined) {
  const normalized = providerType?.toUpperCase();
  if (normalized === 'AZURE_OPENAI') return 'AZURE_OPENAI';
  if (normalized === 'ANTHROPIC') return 'ANTHROPIC';
  return 'OPENAI_COMPATIBLE';
}

function previewMessages(messages: ChatExecutionMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content_preview: message.content.slice(0, 240),
  }));
}

function extractCompletionText(payload: unknown) {
  if (!isObject(payload) || !Array.isArray(payload.choices) || payload.choices.length === 0) {
    return '';
  }

  const message = payload.choices[0]?.message;
  return isObject(message) && typeof message.content === 'string' ? message.content : '';
}

function extractAnthropicCompletionText(payload: unknown) {
  if (!isObject(payload) || !Array.isArray(payload.content)) {
    return '';
  }

  return payload.content
    .map((item) => (isObject(item) && typeof item.text === 'string' ? item.text : ''))
    .join('');
}

function extractProviderCompletionText(adapter: string, payload: unknown) {
  return adapter === 'ANTHROPIC' ? extractAnthropicCompletionText(payload) : extractCompletionText(payload);
}

function extractResponseModel(payload: unknown) {
  return isObject(payload) && typeof payload.model === 'string' ? payload.model : null;
}

function extractProviderResponseModel(_adapter: string, payload: unknown) {
  return extractResponseModel(payload);
}

function extractUsage(
  payload: unknown,
  messages: ChatExecutionMessage[],
  outputText: string,
) {
  if (isObject(payload) && isObject(payload.usage)) {
    return {
      promptTokens: numberValue(payload.usage.prompt_tokens) ?? estimateMessagesTokens(messages),
      completionTokens: numberValue(payload.usage.completion_tokens) ?? estimateTextTokens(outputText),
      totalTokens:
        numberValue(payload.usage.total_tokens) ??
        (numberValue(payload.usage.prompt_tokens) ?? estimateMessagesTokens(messages)) +
          (numberValue(payload.usage.completion_tokens) ?? estimateTextTokens(outputText)),
    };
  }

  return estimateUsageFallback(messages, outputText);
}

function extractAnthropicUsage(
  payload: unknown,
  messages: ChatExecutionMessage[],
  outputText: string,
) {
  if (isObject(payload) && isObject(payload.usage)) {
    const promptTokens = numberValue(payload.usage.input_tokens) ?? estimateMessagesTokens(messages);
    const completionTokens = numberValue(payload.usage.output_tokens) ?? estimateTextTokens(outputText);
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  }

  return estimateUsageFallback(messages, outputText);
}

function extractProviderUsage(
  adapter: string,
  payload: unknown,
  messages: ChatExecutionMessage[],
  outputText: string,
) {
  return adapter === 'ANTHROPIC'
    ? extractAnthropicUsage(payload, messages, outputText)
    : extractUsage(payload, messages, outputText);
}

function extractUsageFromStream(payload: unknown) {
  if (!isObject(payload) || !Array.isArray(payload.choices) || payload.choices.length === 0) {
    return null;
  }

  const choice = payload.choices[0];
  if (!isObject(choice) || !isObject(choice.usage)) {
    return null;
  }

  const promptTokens = numberValue(choice.usage.prompt_tokens);
  const completionTokens = numberValue(choice.usage.completion_tokens);
  const totalTokens = numberValue(choice.usage.total_tokens);

  if (promptTokens === null || completionTokens === null || totalTokens === null) {
    return null;
  }

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

function extractAnthropicUsageFromStream(payload: unknown) {
  if (!isObject(payload)) {
    return null;
  }

  const usage = isObject(payload.usage)
    ? payload.usage
    : isObject(payload.message) && isObject(payload.message.usage)
      ? payload.message.usage
      : null;
  if (!usage) {
    return null;
  }

  const promptTokens = numberValue(usage.input_tokens);
  const completionTokens = numberValue(usage.output_tokens);
  if (promptTokens === null || completionTokens === null) {
    return null;
  }

  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}

function extractProviderUsageFromStream(adapter: string, payload: unknown) {
  return adapter === 'ANTHROPIC' ? extractAnthropicUsageFromStream(payload) : extractUsageFromStream(payload);
}

function estimateUsageFallback(messages: ChatExecutionMessage[], outputText: string) {
  const promptTokens = estimateMessagesTokens(messages);
  const completionTokens = estimateTextTokens(outputText);
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}

function extractProviderError(payload: unknown) {
  if (!isObject(payload)) {
    return null;
  }

  const error = payload.error;
  if (isObject(error) && typeof error.message === 'string') {
    return error.message;
  }

  return typeof payload.message === 'string' ? payload.message : null;
}

function parseProviderSseEvent(rawEvent: string): unknown {
  const lines = rawEvent.split('\n');
  const dataLines = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim());

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join('\n');
  if (rawData === '[DONE]') {
    return '[DONE]';
  }

  try {
    return JSON.parse(rawData);
  } catch {
    return null;
  }
}

function extractStreamDelta(payload: unknown) {
  if (!isObject(payload) || !Array.isArray(payload.choices) || payload.choices.length === 0) {
    return '';
  }

  const delta = payload.choices[0]?.delta;
  return isObject(delta) && typeof delta.content === 'string' ? delta.content : '';
}

function extractAnthropicStreamDelta(payload: unknown) {
  if (!isObject(payload)) {
    return '';
  }

  if (isObject(payload.delta) && typeof payload.delta.text === 'string') {
    return payload.delta.text;
  }

  return '';
}

function extractProviderStreamDelta(adapter: string, payload: unknown) {
  return adapter === 'ANTHROPIC' ? extractAnthropicStreamDelta(payload) : extractStreamDelta(payload);
}

function extractProviderStreamModel(adapter: string, payload: unknown) {
  if (adapter === 'ANTHROPIC' && isObject(payload) && isObject(payload.message) && typeof payload.message.model === 'string') {
    return payload.message.model;
  }

  return extractResponseModel(payload);
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function estimateMessagesTokens(messages: ChatExecutionMessage[]) {
  return messages.reduce((sum, message) => sum + estimateTextTokens(message.content), 0);
}

function estimateTextTokens(text: string) {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
