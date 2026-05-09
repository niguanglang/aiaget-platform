export type AiagetApiKeyAuthMode = 'bearer' | 'x-api-key';

export type ConversationRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELED'
  | 'WAITING_APPROVAL';

export interface ConversationReferenceItem {
  id: string;
  document_id: string | null;
  segment_id: string | null;
  title: string;
  source_type: string | null;
  snippet: string;
  score: number | null;
  metadata: Record<string, unknown> | null;
}

export interface ConversationToolCallItem {
  tool_id: string | null;
  tool_name: string;
  tool_code: string;
  status: string;
  input_preview: string | null;
  output_preview: string | null;
  error_message: string | null;
  latency_ms: number;
  response_status: number | null;
  approval_request_id: string | null;
}

export interface ConversationRunStepItem {
  id: string;
  type: string;
  title: string;
  status: string;
  summary: string | null;
  trace_id: string | null;
  span_id: string | null;
  parent_span_id: string | null;
  latency_ms: number;
  total_tokens: number;
  item_count: number;
  request_model: string | null;
  tool_name: string | null;
  retrieval_mode: string | null;
  response_status: number | null;
}

export interface ExternalAgentChatInput {
  message: string;
  title?: string | null;
  idempotency_key?: string | null;
}

export interface ExternalAgentChatResponse {
  conversation_id: string;
  agent_id: string;
  channel_id?: string | null;
  idempotency_key?: string | null;
  idempotency_replayed?: boolean;
  agent_name: string;
  agent_code: string;
  message_id: string | null;
  run_id: string | null;
  trace_id: string | null;
  status: ConversationRunStatus | null;
  answer: string;
  references: ConversationReferenceItem[];
  tool_calls: ConversationToolCallItem[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    latency_ms: number;
    cost_total: number | null;
  } | null;
  created_at: string | null;
}

export interface ExternalAgentStreamStartEvent {
  type: 'start';
  trace_id?: string | null;
  request_model: string;
  steps: ConversationRunStepItem[];
  references: ConversationReferenceItem[];
  tool_calls: ConversationToolCallItem[];
}

export interface ExternalAgentStreamDeltaEvent {
  type: 'delta';
  delta: string;
}

export interface ExternalAgentStreamDoneEvent {
  type: 'done';
  result: ExternalAgentChatResponse;
}

export interface ExternalAgentStreamErrorEvent {
  type: 'error';
  message: string;
}

export type ExternalAgentStreamEvent =
  | ExternalAgentStreamStartEvent
  | ExternalAgentStreamDeltaEvent
  | ExternalAgentStreamDoneEvent
  | ExternalAgentStreamErrorEvent;

export interface AiagetExternalApiClientOptions {
  baseUrl: string;
  apiKey: string;
  authMode?: AiagetApiKeyAuthMode;
  fetchImpl?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}

export interface ExternalAgentRequestOptions {
  requestId?: string;
  traceId?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface ExternalAgentStreamOptions extends ExternalAgentRequestOptions {
  onEvent?: (event: ExternalAgentStreamEvent) => void;
  onStart?: (event: Extract<ExternalAgentStreamEvent, { type: 'start' }>) => void;
  onDelta?: (delta: string, event: Extract<ExternalAgentStreamEvent, { type: 'delta' }>) => void;
  onDone?: (result: ExternalAgentChatResponse, event: Extract<ExternalAgentStreamEvent, { type: 'done' }>) => void;
  onError?: (message: string, event: Extract<ExternalAgentStreamEvent, { type: 'error' }>) => void;
}

export interface ExternalAgentStreamResult {
  result: ExternalAgentChatResponse | null;
  events: ExternalAgentStreamEvent[];
  text: string;
}

export interface AiagetApiErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  [key: string]: unknown;
}

export interface AiagetWebhookSignatureInput {
  secret: string;
  timestamp: string;
  body: string;
  signature: string | null | undefined;
  toleranceSeconds?: number;
  now?: Date;
}

export class AiagetExternalApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null,
    readonly body: AiagetApiErrorBody | null,
  ) {
    super(message);
    this.name = 'AiagetExternalApiError';
  }
}

export class AiagetExternalApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly authMode: AiagetApiKeyAuthMode;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: AiagetExternalApiClientOptions) {
    if (!options.baseUrl.trim()) {
      throw new Error('baseUrl is required');
    }
    if (!options.apiKey.trim()) {
      throw new Error('apiKey is required');
    }

    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.apiKey = options.apiKey;
    this.authMode = options.authMode ?? 'bearer';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  async chat(
    agentId: string,
    input: ExternalAgentChatInput,
    options: ExternalAgentRequestOptions = {},
  ): Promise<ExternalAgentChatResponse> {
    return this.postJson(`/external/agents/${encodeURIComponent(agentId)}/chat`, input, options);
  }

  async continueChat(
    agentId: string,
    conversationId: string,
    input: ExternalAgentChatInput,
    options: ExternalAgentRequestOptions = {},
  ): Promise<ExternalAgentChatResponse> {
    return this.postJson(
      `/external/agents/${encodeURIComponent(agentId)}/conversations/${encodeURIComponent(conversationId)}/messages`,
      input,
      options,
    );
  }

  async streamChat(
    agentId: string,
    input: ExternalAgentChatInput,
    options: ExternalAgentStreamOptions = {},
  ): Promise<ExternalAgentStreamResult> {
    return this.postSse(`/external/agents/${encodeURIComponent(agentId)}/chat/stream`, input, options);
  }

  async streamContinueChat(
    agentId: string,
    conversationId: string,
    input: ExternalAgentChatInput,
    options: ExternalAgentStreamOptions = {},
  ): Promise<ExternalAgentStreamResult> {
    return this.postSse(
      `/external/agents/${encodeURIComponent(agentId)}/conversations/${encodeURIComponent(conversationId)}/messages/stream`,
      input,
      options,
    );
  }

  private async postJson<TResponse>(
    path: string,
    body: ExternalAgentChatInput,
    options: ExternalAgentRequestOptions,
  ): Promise<TResponse> {
    const response = await this.fetchImpl(this.url(path), {
      method: 'POST',
      headers: this.headers(options, 'application/json'),
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!response.ok) {
      throw await createApiError(response);
    }

    return (await response.json()) as TResponse;
  }

  private async postSse(
    path: string,
    body: ExternalAgentChatInput,
    options: ExternalAgentStreamOptions,
  ): Promise<ExternalAgentStreamResult> {
    const response = await this.fetchImpl(this.url(path), {
      method: 'POST',
      headers: this.headers(options, 'text/event-stream'),
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!response.ok || !response.body) {
      throw await createApiError(response);
    }

    return readExternalAgentStream(response.body, options);
  }

  private url(path: string) {
    return `${this.baseUrl}${path}`;
  }

  private headers(options: ExternalAgentRequestOptions, accept: string) {
    const headers: Record<string, string> = {
      accept,
      'content-type': 'application/json',
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (this.authMode === 'x-api-key') {
      headers['x-api-key'] = this.apiKey;
    } else {
      headers.authorization = `Bearer ${this.apiKey}`;
    }

    if (options.requestId) {
      headers['x-request-id'] = options.requestId;
    }
    if (options.traceId) {
      headers['x-trace-id'] = options.traceId;
    }

    return headers;
  }
}

export function createAiagetExternalApiClient(options: AiagetExternalApiClientOptions) {
  return new AiagetExternalApiClient(options);
}

export async function verifyAiagetWebhookSignature(input: AiagetWebhookSignatureInput) {
  if (!input.secret.trim() || !input.timestamp.trim() || !input.signature?.trim()) {
    return false;
  }

  const timestampSeconds = Number(input.timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const toleranceSeconds = input.toleranceSeconds ?? 300;
  const nowSeconds = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    return false;
  }

  const expected = await createAiagetWebhookSignature(input.secret, input.timestamp, input.body);
  return timingSafeEqualString(expected, input.signature);
}

export async function createAiagetWebhookSignature(secret: string, timestamp: string, body: string) {
  return `sha256=${await createWebhookSignature(secret, timestamp, body)}`;
}

export async function readExternalAgentStream(
  body: ReadableStream<Uint8Array>,
  options: ExternalAgentStreamOptions = {},
): Promise<ExternalAgentStreamResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const events: ExternalAgentStreamEvent[] = [];
  let text = '';
  let result: ExternalAgentChatResponse | null = null;
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = drainSseBuffer(buffer);
    buffer = parsed.tail;

    for (const event of parsed.events) {
      events.push(event);
      options.onEvent?.(event);

      if (event.type === 'start') {
        options.onStart?.(event);
      } else if (event.type === 'delta') {
        text += event.delta;
        options.onDelta?.(event.delta, event);
      } else if (event.type === 'done') {
        result = event.result;
        options.onDone?.(event.result, event);
      } else {
        options.onError?.(event.message, event);
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    const event = parseSseEvent(tail);
    if (event) {
      events.push(event);
      options.onEvent?.(event);
      if (event.type === 'done') {
        result = event.result;
        options.onDone?.(event.result, event);
      } else if (event.type === 'delta') {
        text += event.delta;
        options.onDelta?.(event.delta, event);
      } else if (event.type === 'start') {
        options.onStart?.(event);
      } else {
        options.onError?.(event.message, event);
      }
    }
  }

  return { result, events, text };
}

function drainSseBuffer(buffer: string) {
  const events: ExternalAgentStreamEvent[] = [];
  let tail = buffer;
  let boundary = tail.indexOf('\n\n');

  while (boundary >= 0) {
    const rawEvent = tail.slice(0, boundary).trim();
    tail = tail.slice(boundary + 2);

    if (rawEvent) {
      const event = parseSseEvent(rawEvent);
      if (event) events.push(event);
    }

    boundary = tail.indexOf('\n\n');
  }

  return { events, tail };
}

function parseSseEvent(rawEvent: string): ExternalAgentStreamEvent | null {
  const dataLines = rawEvent
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim());

  if (dataLines.length === 0) return null;

  return JSON.parse(dataLines.join('\n')) as ExternalAgentStreamEvent;
}

async function createApiError(response: Response) {
  const requestId = response.headers.get('x-request-id');
  const body = await safeErrorBody(response);
  const message = extractErrorMessage(body) ?? `AIAGET external API request failed with HTTP ${response.status}`;

  return new AiagetExternalApiError(message, response.status, requestId, body);
}

async function safeErrorBody(response: Response): Promise<AiagetApiErrorBody | null> {
  try {
    return (await response.json()) as AiagetApiErrorBody;
  } catch {
    return null;
  }
}

function extractErrorMessage(body: AiagetApiErrorBody | null) {
  const message = body?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  if (typeof body?.error === 'string') return body.error;
  return null;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, '');
}

async function createWebhookSignature(secret: string, timestamp: string, body: string) {
  return hmacSha256Hex(secret, `${timestamp}.${body}`);
}

async function hmacSha256Hex(secret: string, message: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Webhook signature helpers require Web Crypto');
  }

  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(message));

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualString(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  if (leftBytes.length !== rightBytes.length) return false;

  let result = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    result |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return result === 0;
}
