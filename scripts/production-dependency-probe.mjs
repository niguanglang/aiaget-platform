#!/usr/bin/env node
import net from 'node:net';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DEFAULT_TIMEOUT_MS = 5000;

export function parseDatabaseUrl(value) {
  const url = new URL(value);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  return {
    protocol: url.protocol,
    host: url.hostname,
    port: Number(url.port || 5432),
    database,
    redacted_url: `${url.protocol}//[REDACTED]@${url.hostname}:${url.port || '5432'}${url.pathname}`,
  };
}

export function buildDependencyProbePlan(env = process.env) {
  const probes = [];

  if (hasValue(env.DATABASE_URL)) {
    const database = parseDatabaseUrl(env.DATABASE_URL);
    probes.push({
      key: 'postgres',
      label: 'PostgreSQL TCP',
      type: 'tcp',
      host: database.host,
      port: database.port,
      required: true,
      redacted_target: database.redacted_url,
    });
  } else {
    probes.push(skippedProbe('postgres', 'PostgreSQL TCP', true, 'DATABASE_URL is not configured'));
  }

  if (hasValue(env.MINIO_ENDPOINT)) {
    probes.push({
      key: 'minio',
      label: 'MinIO/S3 HTTP',
      type: 'http',
      url: appendPath(env.MINIO_ENDPOINT, '/minio/health/live'),
      required: true,
    });
  } else {
    probes.push(skippedProbe('minio', 'MinIO/S3 HTTP', true, 'MINIO_ENDPOINT is not configured'));
  }

  if (env.QDRANT_ENABLED !== 'false') {
    if (hasValue(env.QDRANT_URL)) {
      probes.push({
        key: 'qdrant',
        label: 'Qdrant HTTP',
        type: 'http',
        url: appendPath(env.QDRANT_URL, '/readyz'),
        required: true,
      });
    } else {
      probes.push(skippedProbe('qdrant', 'Qdrant HTTP', true, 'QDRANT_URL is not configured'));
    }
  }

  if (env.OPENSEARCH_ENABLED !== 'false') {
    if (hasValue(env.OPENSEARCH_URL)) {
      probes.push({
        key: 'opensearch',
        label: 'OpenSearch HTTP',
        type: 'http',
        url: appendPath(env.OPENSEARCH_URL, '/_cluster/health'),
        required: true,
      });
    } else {
      probes.push(skippedProbe('opensearch', 'OpenSearch HTTP', true, 'OPENSEARCH_URL is not configured'));
    }
  }

  if (env.RUNTIME_TEMPORAL_ENABLED === 'true') {
    if (hasValue(env.RUNTIME_TEMPORAL_ADDRESS)) {
      const temporal = parseHostPort(env.RUNTIME_TEMPORAL_ADDRESS, 7233);
      probes.push({
        key: 'temporal',
        label: 'Temporal TCP',
        type: 'tcp',
        host: temporal.host,
        port: temporal.port,
        required: true,
        redacted_target: `${temporal.host}:${temporal.port}`,
      });
    } else {
      probes.push(skippedProbe('temporal', 'Temporal TCP', true, 'RUNTIME_TEMPORAL_ADDRESS is not configured'));
    }
  }

  if (hasValue(env.OTEL_EXPORTER_OTLP_ENDPOINT)) {
    probes.push({
      key: 'otel',
      label: 'OpenTelemetry Collector HTTP',
      type: 'http',
      url: appendPath(env.OTEL_EXPORTER_OTLP_ENDPOINT, '/v1/traces'),
      required: true,
      accept_statuses: [200, 202, 400, 405, 415],
    });
  } else {
    probes.push(skippedProbe('otel', 'OpenTelemetry Collector HTTP', true, 'OTEL_EXPORTER_OTLP_ENDPOINT is not configured'));
  }

  if (hasValue(env.PLUGIN_SIGNATURE_VERIFIER_URL)) {
    probes.push({
      key: 'plugin-signature-verifier',
      label: 'Plugin signature verifier HTTP',
      type: 'http',
      url: env.PLUGIN_SIGNATURE_VERIFIER_URL,
      required: false,
      accept_statuses: [200, 204, 400, 401, 403, 405, 415],
    });
  }

  if (hasValue(env.PLUGIN_SANDBOX_EXECUTOR_URL)) {
    probes.push({
      key: 'plugin-sandbox-executor',
      label: 'Plugin sandbox executor HTTP',
      type: 'http',
      url: env.PLUGIN_SANDBOX_EXECUTOR_URL,
      required: false,
      accept_statuses: [200, 204, 400, 401, 403, 405, 415],
    });
  }

  return probes;
}

export function collectDependencyProbeIssues(probes) {
  const issues = [];
  for (const probe of probes) {
    if (probe.skipped) {
      if (probe.required) issues.push(`${probe.label} skipped: ${probe.reason}`);
      continue;
    }

    const result = probe.result;
    if (!result) {
      issues.push(`${probe.label} was not checked`);
      continue;
    }
    if (result.error) {
      issues.push(`${probe.label} request failed: ${result.error}`);
      continue;
    }
  if (!result.ok) {
      const status = result.status ? `HTTP ${result.status}` : 'not ready';
      issues.push(`${probe.label} returned ${status}`);
    }
  }
  return issues;
}

export function collectDependencyProbeOutput({ generatedAt, probes }) {
  const issues = collectDependencyProbeIssues(probes);
  return {
    generated_at: generatedAt ?? new Date().toISOString(),
    summary: {
      status: issues.length > 0 ? 'FAILED' : 'PASSED',
      issue_count: issues.length,
      probe_count: probes.length,
    },
    issues,
    probes: probes.map((probe) => ({
      key: probe.key,
      label: probe.label,
      type: probe.type,
      required: Boolean(probe.required),
      skipped: Boolean(probe.skipped),
      reason: probe.reason ?? null,
      target: probe.redacted_target ?? probe.url ?? (probe.host ? `${probe.host}:${probe.port}` : null),
      ok: Boolean(probe.result?.ok),
      status: probe.result?.status ?? 0,
      elapsed_ms: probe.result?.elapsed_ms ?? null,
      error: probe.result?.error ?? null,
      body: redactSensitiveValue(probe.result?.body ?? null),
    })),
  };
}

async function runProbe(probe, timeoutMs) {
  if (probe.skipped) return probe;
  const result = probe.type === 'tcp'
    ? await probeTcp(probe.host, probe.port, timeoutMs)
    : await probeHttp(probe.url, timeoutMs, probe.accept_statuses);
  return {
    ...probe,
    result,
  };
}

async function probeTcp(host, port, timeoutMs) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;
    const settle = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({
        ...result,
        elapsed_ms: Date.now() - startedAt,
      });
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => settle({ ok: true, status: 0 }));
    socket.once('timeout', () => settle({ ok: false, status: 0, error: `timeout after ${timeoutMs}ms` }));
    socket.once('error', (error) => settle({ ok: false, status: 0, error: error.message }));
  });
}

async function probeHttp(url, timeoutMs, acceptStatuses = [200]) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { accept: 'application/json,text/plain,*/*' },
    });
    const text = await response.text();
    const ok = response.ok || acceptStatuses.includes(response.status);
    return {
      ok,
      status: response.status,
      elapsed_ms: Date.now() - startedAt,
      body: safeJson(text),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      elapsed_ms: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function appendPath(baseUrl, path) {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/$/, '');
  url.pathname = basePath && basePath !== '/' ? `${basePath}${path}` : path;
  return url.toString();
}

function parseHostPort(value, defaultPort) {
  const [host, rawPort] = String(value).split(':');
  return {
    host,
    port: Number(rawPort || defaultPort),
  };
}

function skippedProbe(key, label, required, reason) {
  return {
    key,
    label,
    type: 'config',
    required,
    skipped: true,
    reason,
  };
}

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function safeJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text.slice(0, 500);
  }
}

function redactSensitiveValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValue(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      isSensitiveKey(key) ? '[REDACTED]' : redactSensitiveValue(entry),
    ]),
  );
}

function isSensitiveKey(key) {
  const normalized = key.toLowerCase();
  return normalized.includes('token')
    || normalized.includes('secret')
    || normalized.includes('password')
    || normalized.includes('authorization')
    || normalized.includes('api_key')
    || normalized.includes('apikey');
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

function loadEnvFile(path) {
  const env = { ...process.env };
  const text = readFileSync(path, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    env[key] = stripMatchingQuotes(value);
  }
  return env;
}

function stripMatchingQuotes(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const env = args.has('env-file') ? loadEnvFile(args.get('env-file')) : process.env;
  const timeoutMs = Number(args.get('timeout-ms') ?? DEFAULT_TIMEOUT_MS);
  const plan = buildDependencyProbePlan(env);
  const probes = [];
  for (const probe of plan) {
    probes.push(await runProbe(probe, timeoutMs));
  }

  const output = collectDependencyProbeOutput({ probes });
  if (args.has('json')) {
    console.log(JSON.stringify(output, null, 2));
  } else if (output.summary.status === 'PASSED') {
    console.log(`Production dependency probe passed: ${output.summary.probe_count} checks.`);
    for (const probe of output.probes) {
      const state = probe.skipped ? 'SKIPPED' : probe.ok ? 'OK' : 'FAILED';
      console.log(`- ${probe.label}: ${state} ${probe.target ?? ''}`.trim());
    }
  } else {
    console.error('Production dependency probe failed:');
    for (const issue of output.issues) console.error(`- ${issue}`);
  }

  if (output.summary.status !== 'PASSED') {
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
