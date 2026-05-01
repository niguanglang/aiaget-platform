import { randomBytes } from 'node:crypto';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string | null;
  traceparent: string;
  requestId?: string | null;
}

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;
const SPAN_ID_PATTERN = /^[0-9a-f]{16}$/;
const TRACEPARENT_PATTERN = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;

export function createTraceId(): string {
  const traceId = randomBytes(16).toString('hex');
  return traceId === '00000000000000000000000000000000' ? createTraceId() : traceId;
}

export function createSpanId(): string {
  const spanId = randomBytes(8).toString('hex');
  return spanId === '0000000000000000' ? createSpanId() : spanId;
}

export function buildTraceparent(traceId: string, spanId: string, traceFlags = '01') {
  return `00-${traceId}-${spanId}-${traceFlags}`;
}

export function parseTraceparent(value: unknown): { traceId: string; spanId: string; traceFlags: string } | null {
  const header = firstHeaderValue(value);
  if (!header) return null;

  const match = TRACEPARENT_PATTERN.exec(header.trim());
  if (!match) return null;
  const [, traceId, spanId, traceFlags] = match;
  if (!traceId || !spanId || !traceFlags) return null;

  return {
    traceId: traceId.toLowerCase(),
    spanId: spanId.toLowerCase(),
    traceFlags: traceFlags.toLowerCase(),
  };
}

export function normalizeTraceId(value: unknown): string | null {
  const traceId = firstHeaderValue(value)?.trim().toLowerCase();
  return traceId && TRACE_ID_PATTERN.test(traceId) ? traceId : null;
}

export function normalizeSpanId(value: unknown): string | null {
  const spanId = firstHeaderValue(value)?.trim().toLowerCase();
  return spanId && SPAN_ID_PATTERN.test(spanId) ? spanId : null;
}

export function createChildTraceContext(parent: Pick<TraceContext, 'traceId' | 'spanId' | 'requestId'>): TraceContext {
  const spanId = createSpanId();
  return {
    traceId: parent.traceId,
    spanId,
    parentSpanId: parent.spanId,
    traceparent: buildTraceparent(parent.traceId, spanId),
    requestId: parent.requestId,
  };
}

export function traceHeaders(context: Pick<TraceContext, 'traceId' | 'traceparent'>): Record<string, string> {
  return {
    traceparent: context.traceparent,
    'x-trace-id': context.traceId,
  };
}

export function readTraceContextFromHeaders(headers: Record<string, unknown>): TraceContext | null {
  const parsedTraceparent = parseTraceparent(headers.traceparent ?? headers.Traceparent);
  const traceId = parsedTraceparent?.traceId ?? normalizeTraceId(headers['x-trace-id'] ?? headers['X-Trace-Id']);
  if (!traceId) return null;

  const spanId = parsedTraceparent?.spanId ?? normalizeSpanId(headers['x-span-id'] ?? headers['X-Span-Id']) ?? createSpanId();

  return {
    traceId,
    spanId,
    parentSpanId: null,
    traceparent: buildTraceparent(traceId, spanId, parsedTraceparent?.traceFlags ?? '01'),
  };
}

function firstHeaderValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    return value[0]?.toString() ?? null;
  }

  return value?.toString() ?? null;
}
