import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDependencyProbePlan,
  collectDependencyProbeIssues,
  collectDependencyProbeOutput,
  parseDatabaseUrl,
} from '../production-dependency-probe.mjs';

const env = {
  DATABASE_URL: 'postgresql://aiaget:secret@postgres.example.com:5432/aiaget_platform',
  MINIO_ENDPOINT: 'http://minio.example.com:9000',
  QDRANT_ENABLED: 'true',
  QDRANT_URL: 'http://qdrant.example.com:6333',
  OPENSEARCH_ENABLED: 'true',
  OPENSEARCH_URL: 'http://opensearch.example.com:9200',
  RUNTIME_TEMPORAL_ENABLED: 'true',
  RUNTIME_TEMPORAL_ADDRESS: 'temporal.example.com:7233',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel-collector.example.com:4318',
  PLUGIN_SIGNATURE_VERIFIER_URL: 'https://verifier.example.com/plugin-signatures',
  PLUGIN_SANDBOX_EXECUTOR_URL: 'https://sandbox.example.com/execute',
};

test('parseDatabaseUrl extracts PostgreSQL tcp target without leaking credentials', () => {
  assert.deepEqual(parseDatabaseUrl(env.DATABASE_URL), {
    protocol: 'postgresql:',
    host: 'postgres.example.com',
    port: 5432,
    database: 'aiaget_platform',
    redacted_url: 'postgresql://[REDACTED]@postgres.example.com:5432/aiaget_platform',
  });
});

test('buildDependencyProbePlan derives read-only external dependency probes', () => {
  assert.deepEqual(buildDependencyProbePlan(env), [
    {
      key: 'postgres',
      label: 'PostgreSQL TCP',
      type: 'tcp',
      host: 'postgres.example.com',
      port: 5432,
      required: true,
      redacted_target: 'postgresql://[REDACTED]@postgres.example.com:5432/aiaget_platform',
    },
    {
      key: 'minio',
      label: 'MinIO/S3 HTTP',
      type: 'http',
      url: 'http://minio.example.com:9000/minio/health/live',
      required: true,
    },
    {
      key: 'qdrant',
      label: 'Qdrant HTTP',
      type: 'http',
      url: 'http://qdrant.example.com:6333/readyz',
      required: true,
    },
    {
      key: 'opensearch',
      label: 'OpenSearch HTTP',
      type: 'http',
      url: 'http://opensearch.example.com:9200/_cluster/health',
      required: true,
    },
    {
      key: 'temporal',
      label: 'Temporal TCP',
      type: 'tcp',
      host: 'temporal.example.com',
      port: 7233,
      required: true,
      redacted_target: 'temporal.example.com:7233',
    },
    {
      key: 'otel',
      label: 'OpenTelemetry Collector HTTP',
      type: 'http',
      url: 'http://otel-collector.example.com:4318/v1/traces',
      required: true,
      accept_statuses: [200, 202, 400, 405, 415],
    },
    {
      key: 'plugin-signature-verifier',
      label: 'Plugin signature verifier HTTP',
      type: 'http',
      url: 'https://verifier.example.com/plugin-signatures',
      required: false,
      accept_statuses: [200, 204, 400, 401, 403, 405, 415],
    },
    {
      key: 'plugin-sandbox-executor',
      label: 'Plugin sandbox executor HTTP',
      type: 'http',
      url: 'https://sandbox.example.com/execute',
      required: false,
      accept_statuses: [200, 204, 400, 401, 403, 405, 415],
    },
  ]);
});

test('buildDependencyProbePlan skips explicitly disabled optional backends', () => {
  const plan = buildDependencyProbePlan({
    ...env,
    QDRANT_ENABLED: 'false',
    OPENSEARCH_ENABLED: 'false',
    RUNTIME_TEMPORAL_ENABLED: 'false',
    PLUGIN_SIGNATURE_VERIFIER_URL: '',
    PLUGIN_SANDBOX_EXECUTOR_URL: '',
  });

  assert.deepEqual(plan.map((probe) => probe.key), ['postgres', 'minio', 'otel']);
});

test('collectDependencyProbeIssues reports missing required config and failed probes', () => {
  assert.deepEqual(
    collectDependencyProbeIssues([
      {
        key: 'postgres',
        label: 'PostgreSQL TCP',
        required: true,
        skipped: true,
        reason: 'DATABASE_URL is not configured',
      },
      {
        key: 'qdrant',
        label: 'Qdrant HTTP',
        required: true,
        result: { ok: false, status: 503, error: null },
      },
      {
        key: 'plugin-sandbox-executor',
        label: 'Plugin sandbox executor HTTP',
        required: false,
        result: { ok: false, status: 404, error: null },
      },
    ]),
    [
      'PostgreSQL TCP skipped: DATABASE_URL is not configured',
      'Qdrant HTTP returned HTTP 503',
      'Plugin sandbox executor HTTP returned HTTP 404',
    ],
  );
});

test('collectDependencyProbeIssues accepts explicitly allowed HTTP status probes', () => {
  assert.deepEqual(
    collectDependencyProbeIssues([
      {
        key: 'otel',
        label: 'OpenTelemetry Collector HTTP',
        required: true,
        result: { ok: true, status: 405, error: null },
      },
      {
        key: 'plugin-signature-verifier',
        label: 'Plugin signature verifier HTTP',
        required: false,
        result: { ok: true, status: 401, error: null },
      },
    ]),
    [],
  );
});

test('collectDependencyProbeOutput redacts sensitive evidence payloads', () => {
  const output = collectDependencyProbeOutput({
    generatedAt: '2026-05-12T00:00:00.000Z',
    probes: [
      {
        key: 'postgres',
        label: 'PostgreSQL TCP',
        type: 'tcp',
        required: true,
        redacted_target: 'postgresql://[REDACTED]@postgres.example.com:5432/aiaget_platform',
        result: { ok: true, status: 0, elapsed_ms: 12 },
      },
      {
        key: 'verifier',
        label: 'Verifier',
        type: 'http',
        required: false,
        url: 'https://verifier.example.com',
        result: {
          ok: true,
          status: 200,
          elapsed_ms: 30,
          body: {
            accessToken: 'should-not-leak',
            nested: { password: 'secret' },
          },
        },
      },
    ],
  });

  assert.equal(output.summary.status, 'PASSED');
  assert.equal(output.probes[0]?.target, 'postgresql://[REDACTED]@postgres.example.com:5432/aiaget_platform');
  assert.equal(output.probes[1]?.body.accessToken, '[REDACTED]');
  assert.equal(output.probes[1]?.body.nested.password, '[REDACTED]');
});
