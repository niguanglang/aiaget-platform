#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;
const SPAN_ID_PATTERN = /^[0-9a-f]{16}$/;

export function buildTraceHeaders(traceId = createTraceId(), spanId = createSpanId()) {
  return {
    traceparent: `00-${traceId}-${spanId}-01`,
    'x-trace-id': traceId,
  };
}

export function collectTracePropagationIssues({ traceId, controlApi, runtime }) {
  const issues = [];
  const controlTraceId = getHeader(controlApi?.headers, 'x-trace-id');
  const controlTraceparent = getHeader(controlApi?.headers, 'traceparent');

  if (controlApi) {
    if (controlTraceId !== traceId) {
      issues.push('Control API x-trace-id response header did not match the probe trace id');
    }
    if (!traceparentKeepsTraceId(controlTraceparent, traceId)) {
      issues.push('Control API traceparent response header did not keep the probe trace id');
    }
  }

  if (runtime) {
    const body = runtime.body ?? {};
    if (body.trace_id !== traceId) {
      issues.push('Runtime response trace_id did not match the probe trace id');
    }

    const steps = Array.isArray(body.steps) ? body.steps : [];
    steps.forEach((step, index) => {
      if (step?.trace_id !== traceId) {
        issues.push(`Runtime step ${index} is missing the probe trace_id`);
      }
    });

    if (body.model_call && body.model_call.trace_id !== traceId) {
      issues.push('Runtime model_call.trace_id did not match the probe trace id');
    }
  }

  return issues;
}

function createTraceId() {
  return randomBytes(16).toString('hex');
}

function createSpanId() {
  return randomBytes(8).toString('hex');
}

function getHeader(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === 'function') return headers.get(name);

  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) return Array.isArray(value) ? String(value[0] ?? '') : String(value);
  }
  return null;
}

function traceparentKeepsTraceId(value, traceId) {
  if (!value) return false;
  const parts = String(value).trim().split('-');
  return parts.length === 4 && parts[0] === '00' && parts[1]?.toLowerCase() === traceId;
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args.set(key, 'true');
    } else {
      args.set(key, next);
      index += 1;
    }
  }
  return args;
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const controlApiBaseUrl = args.get('control-api') ?? process.env.CONTROL_API_BASE_URL ?? process.env.NEXT_PUBLIC_CONTROL_API_BASE_URL;
  const runtimeBaseUrl = args.get('runtime') ?? process.env.RUNTIME_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_RUNTIME_BASE_URL;
  const traceId = args.get('trace-id') ?? createTraceId();
  const spanId = args.get('span-id') ?? createSpanId();

  if (!TRACE_ID_PATTERN.test(traceId)) {
    throw new Error('--trace-id must be a 32-character lowercase hexadecimal trace id');
  }
  if (!SPAN_ID_PATTERN.test(spanId)) {
    throw new Error('--span-id must be a 16-character lowercase hexadecimal span id');
  }
  if (!controlApiBaseUrl || !runtimeBaseUrl) {
    throw new Error('Usage: node scripts/verify-trace-propagation.mjs --control-api https://api.example.com/api/v1 --runtime https://runtime.example.com/runtime');
  }

  const headers = buildTraceHeaders(traceId, spanId);
  const controlApi = await fetchControlHealth(controlApiBaseUrl, headers);
  const runtime = await fetchRuntimeProbe(runtimeBaseUrl, headers);
  const issues = collectTracePropagationIssues({ traceId, controlApi, runtime });

  if (issues.length > 0) {
    console.error(`Trace propagation validation failed for trace ${traceId}:`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Trace propagation validation passed for trace ${traceId}.`);
}

async function fetchControlHealth(baseUrl, headers) {
  const response = await fetch(resolveControlHealthUrl(baseUrl), { headers });
  const body = await readJson(response);
  return { headers: response.headers, body };
}

async function fetchRuntimeProbe(baseUrl, headers) {
  const response = await fetch(resolveRuntimeRespondUrl(baseUrl), {
    method: 'POST',
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      agent_name: 'trace-propagation-probe',
      agent_code: 'trace_propagation_probe',
      user_message: 'verify trace propagation',
    }),
  });
  const body = await readJson(response);
  return { headers: response.headers, body };
}

async function readJson(response) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${response.url}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : {};
}

function resolveControlHealthUrl(baseUrl) {
  const url = new URL(baseUrl);
  const path = url.pathname.replace(/\/$/, '');
  url.pathname = path.endsWith('/api/v1') ? `${path}/health` : `${path}/api/v1/health`;
  return url;
}

function resolveRuntimeRespondUrl(baseUrl) {
  const url = new URL(baseUrl);
  const path = url.pathname.replace(/\/$/, '');
  url.pathname = path.endsWith('/runtime') ? `${path}/conversations/respond` : `${path}/runtime/conversations/respond`;
  return url;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
