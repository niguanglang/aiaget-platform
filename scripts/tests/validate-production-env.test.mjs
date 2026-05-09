import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  collectProductionEnvIssues,
  parseEnvText,
} from '../validate-production-env.mjs';

const validEnv = {
  NODE_ENV: 'production',
  CORS_ORIGIN: 'https://console.example.com',
  NEXT_PUBLIC_CONTROL_API_BASE_URL: 'https://api.example.com/api/v1',
  NEXT_PUBLIC_RUNTIME_BASE_URL: 'https://runtime.example.com/runtime',
  CONTROL_API_PORT: '3001',
  RUNTIME_PORT: '8000',
  RUNTIME_BASE_URL: 'http://agent-runtime:8000',
  CONTROL_API_INTERNAL_BASE_URL: 'http://control-api:3001',
  AGENT_RUNTIME_EXECUTION_MODE: 'runtime_first',
  KNOWLEDGE_WORKFLOW_MODE: 'temporal_first',
  AGENT_TEAM_WORKFLOW_MODE: 'temporal_first',
  CHANNEL_RELEASE_WORKFLOW_MODE: 'runtime_first',
  CHANNEL_RELEASE_SELF_HEALING_WORKFLOW_MODE: 'runtime_first',
  PLUGIN_ROLLBACK_WORKFLOW_MODE: 'temporal_first',
  PLUGIN_HOOK_WORKFLOW_MODE: 'temporal_first',
  JWT_ACCESS_TOKEN_SECRET: 'prod-access-token-secret-prod-access-token-secret',
  JWT_REFRESH_TOKEN_SECRET: 'prod-refresh-token-secret-prod-refresh-token-secret',
  SECRET_ENCRYPTION_KEY: '1234567890abcdef1234567890abcdef',
  MODEL_KEY_ENCRYPTION_SECRET: 'model-key-secret-prod-model-key-secret-prod',
  DEFAULT_TENANT_CODE: 'default',
  DEFAULT_TENANT_NAME: '默认企业',
  DEFAULT_ADMIN_EMAIL: 'oss-admin-7f4c2a@local.invalid',
  DEFAULT_ADMIN_PASSWORD: 'AiaGetAdminSecret2026',
  RUNTIME_CORS_ORIGIN: 'https://console.example.com',
  RUNTIME_CONTROL_API_BASE_URL: 'http://control-api:3001',
  RUNTIME_INTERNAL_TOKEN: 'runtime-internal-token-runtime-internal-token',
  RUNTIME_TEMPORAL_ENABLED: 'false',
  RUNTIME_TEMPORAL_ADDRESS: 'temporal:7233',
  RUNTIME_TEMPORAL_NAMESPACE: 'default',
  RUNTIME_TEMPORAL_TASK_QUEUE: 'aiaget-production',
  POSTGRES_HOST: 'db.example.com',
  POSTGRES_PORT: '5432',
  POSTGRES_DB: 'aiaget_platform',
  POSTGRES_USER: 'aiaget',
  POSTGRES_PASSWORD: 'PgSecretValue2026',
  DATABASE_URL: 'postgresql://aiaget:PgSecretValue2026@db.example.com:5432/aiaget_platform',
  MINIO_ENDPOINT: 'http://minio.example.com:9000',
  MINIO_CONSOLE: 'http://minio.example.com:9001',
  MINIO_ROOT_USER: 'minio-admin',
  MINIO_ROOT_PASSWORD: 'MinioSecretValue2026',
  MINIO_BUCKET: 'aiaget-files',
  MINIO_REGION: 'us-east-1',
  QDRANT_URL: 'http://qdrant.example.com:6333',
  QDRANT_API_KEY: 'qdrant-secret',
  QDRANT_COLLECTION_PREFIX: 'aiaget',
  OPENSEARCH_URL: 'http://opensearch.example.com:9200',
  OPENSEARCH_INDEX_PREFIX: 'aiaget',
  TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE: '120',
  TOOL_GATEWAY_MAX_RETRIES: '1',
  TOOL_GATEWAY_MAX_RESPONSE_CHARS: '20000',
  OTEL_SERVICE_NAMESPACE: 'aiaget',
  OTEL_DEPLOYMENT_ENVIRONMENT: 'production',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel-collector.example.com:4318',
  OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
  OTEL_TRACES_EXPORTER: 'otlp',
  OTEL_METRICS_EXPORTER: 'otlp',
  OTEL_LOGS_EXPORTER: 'otlp',
  OTEL_RESOURCE_ATTRIBUTES: 'deployment.environment=production,service.namespace=aiaget',
  OTEL_PROPAGATORS: 'tracecontext,baggage',
  OTEL_TRACES_SAMPLER: 'parentbased_traceidratio',
  OTEL_TRACES_SAMPLER_ARG: '1.0',
};

test('parseEnvText ignores comments and strips matching quotes', () => {
  const parsed = parseEnvText(`
    # comment
    NODE_ENV="production"
    CORS_ORIGIN='https://console.example.com'
    EMPTY=
  `);

  assert.equal(parsed.NODE_ENV, 'production');
  assert.equal(parsed.CORS_ORIGIN, 'https://console.example.com');
  assert.equal(parsed.EMPTY, '');
});

test('collectProductionEnvIssues accepts a complete production env', () => {
  assert.deepEqual(collectProductionEnvIssues(validEnv), []);
});

test('collectProductionEnvIssues rejects missing required values', () => {
  const env = { ...validEnv };
  delete env.DATABASE_URL;
  delete env.MINIO_ENDPOINT;

  assert.deepEqual(collectProductionEnvIssues(env), [
    'DATABASE_URL is required',
    'MINIO_ENDPOINT is required',
  ]);
});

test('collectProductionEnvIssues rejects placeholder and weak secrets', () => {
  const env = {
    ...validEnv,
    JWT_ACCESS_TOKEN_SECRET: 'change-me-access-token-secret',
    RUNTIME_INTERNAL_TOKEN: 'short',
  };

  assert.deepEqual(collectProductionEnvIssues(env), [
    'JWT_ACCESS_TOKEN_SECRET must not use a placeholder value',
    'RUNTIME_INTERNAL_TOKEN should be at least 24 characters for production',
  ]);
});

test('collectProductionEnvIssues validates modes and URL-shaped values', () => {
  const env = {
    ...validEnv,
    AGENT_RUNTIME_EXECUTION_MODE: 'remote',
    NEXT_PUBLIC_CONTROL_API_BASE_URL: 'api.example.com',
  };

  assert.deepEqual(collectProductionEnvIssues(env), [
    'NEXT_PUBLIC_CONTROL_API_BASE_URL must start with http:// or https://',
    'AGENT_RUNTIME_EXECUTION_MODE must be one of runtime_first, runtime_only, control_first',
  ]);
});

test('collectProductionEnvIssues rejects legacy knowledge workflow runtime modes', () => {
  const env = {
    ...validEnv,
    KNOWLEDGE_WORKFLOW_MODE: 'runtime_first',
  };

  assert.deepEqual(collectProductionEnvIssues(env), [
    'KNOWLEDGE_WORKFLOW_MODE must be one of local, temporal_first, temporal',
  ]);
});

test('collectProductionEnvIssues rejects legacy agent team workflow runtime modes', () => {
  const env = {
    ...validEnv,
    AGENT_TEAM_WORKFLOW_MODE: 'runtime_first',
  };

  assert.deepEqual(collectProductionEnvIssues(env), [
    'AGENT_TEAM_WORKFLOW_MODE must be one of local, temporal_first, temporal',
  ]);
});

test('collectProductionEnvIssues allows disabled search backends without URLs', () => {
  const env = {
    ...validEnv,
    QDRANT_ENABLED: 'false',
    OPENSEARCH_ENABLED: 'false',
  };
  delete env.QDRANT_URL;
  delete env.OPENSEARCH_URL;

  assert.deepEqual(collectProductionEnvIssues(env), []);
});

test('collectProductionEnvIssues requires search backend URLs when enabled', () => {
  const env = {
    ...validEnv,
    QDRANT_ENABLED: 'true',
    OPENSEARCH_ENABLED: 'true',
  };
  delete env.QDRANT_URL;
  delete env.OPENSEARCH_URL;

  assert.deepEqual(collectProductionEnvIssues(env), [
    'QDRANT_URL is required when QDRANT_ENABLED=true',
    'OPENSEARCH_URL is required when OPENSEARCH_ENABLED=true',
  ]);
});

test('production env template uses a recognized knowledge workflow mode', () => {
  const template = parseEnvText(readFileSync(new URL('../../.env.production.example', import.meta.url), 'utf8'));

  assert.ok(['local', 'temporal_first', 'temporal'].includes(template.KNOWLEDGE_WORKFLOW_MODE));
});

test('production env template uses a recognized agent team workflow mode', () => {
  const template = parseEnvText(readFileSync(new URL('../../.env.production.example', import.meta.url), 'utf8'));

  assert.ok(['local', 'temporal_first', 'temporal'].includes(template.AGENT_TEAM_WORKFLOW_MODE));
});

test('production compose default uses a recognized knowledge workflow mode', () => {
  const compose = readFileSync(new URL('../../deploy/docker-compose.production.yml', import.meta.url), 'utf8');
  const match = compose.match(/KNOWLEDGE_WORKFLOW_MODE:\s*\$\{KNOWLEDGE_WORKFLOW_MODE:-([^}]+)}/);

  assert.ok(match);
  assert.ok(['local', 'temporal_first', 'temporal'].includes(match[1] ?? ''));
});

test('production compose default uses a recognized agent team workflow mode', () => {
  const compose = readFileSync(new URL('../../deploy/docker-compose.production.yml', import.meta.url), 'utf8');
  const match = compose.match(/AGENT_TEAM_WORKFLOW_MODE:\s*\$\{AGENT_TEAM_WORKFLOW_MODE:-([^}]+)}/);

  assert.ok(match);
  assert.ok(['local', 'temporal_first', 'temporal'].includes(match[1] ?? ''));
});

test('production compose does not require disabled search backend URLs during interpolation', () => {
  const compose = readFileSync(new URL('../../deploy/docker-compose.production.yml', import.meta.url), 'utf8');

  assert.doesNotMatch(compose, /QDRANT_URL:\s*\$\{QDRANT_URL:\?/);
  assert.doesNotMatch(compose, /OPENSEARCH_URL:\s*\$\{OPENSEARCH_URL:\?/);
});

test('collectProductionEnvIssues requires a complete OTEL exporter contract', () => {
  const env = { ...validEnv };
  delete env.OTEL_EXPORTER_OTLP_ENDPOINT;
  env.OTEL_EXPORTER_OTLP_PROTOCOL = 'jaeger';
  env.OTEL_TRACES_EXPORTER = 'none';
  env.OTEL_PROPAGATORS = 'b3';
  env.OTEL_TRACES_SAMPLER_ARG = '2';

  assert.deepEqual(collectProductionEnvIssues(env), [
    'OTEL_EXPORTER_OTLP_ENDPOINT is required',
    'OTEL_EXPORTER_OTLP_PROTOCOL must be one of http/protobuf, grpc',
    'OTEL_TRACES_EXPORTER must include otlp for production trace export',
    'OTEL_PROPAGATORS must include tracecontext',
    'OTEL_TRACES_SAMPLER_ARG must be between 0 and 1',
  ]);
});
