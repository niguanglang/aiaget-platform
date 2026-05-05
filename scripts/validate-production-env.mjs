#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const requiredKeys = [
  'NODE_ENV',
  'CORS_ORIGIN',
  'NEXT_PUBLIC_CONTROL_API_BASE_URL',
  'NEXT_PUBLIC_RUNTIME_BASE_URL',
  'CONTROL_API_PORT',
  'RUNTIME_PORT',
  'RUNTIME_BASE_URL',
  'CONTROL_API_INTERNAL_BASE_URL',
  'AGENT_RUNTIME_EXECUTION_MODE',
  'KNOWLEDGE_WORKFLOW_MODE',
  'JWT_ACCESS_TOKEN_SECRET',
  'JWT_REFRESH_TOKEN_SECRET',
  'SECRET_ENCRYPTION_KEY',
  'MODEL_KEY_ENCRYPTION_SECRET',
  'DEFAULT_TENANT_CODE',
  'DEFAULT_TENANT_NAME',
  'DEFAULT_ADMIN_EMAIL',
  'DEFAULT_ADMIN_PASSWORD',
  'RUNTIME_CORS_ORIGIN',
  'RUNTIME_CONTROL_API_BASE_URL',
  'RUNTIME_INTERNAL_TOKEN',
  'RUNTIME_TEMPORAL_ENABLED',
  'RUNTIME_TEMPORAL_ADDRESS',
  'RUNTIME_TEMPORAL_NAMESPACE',
  'RUNTIME_TEMPORAL_TASK_QUEUE',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'DATABASE_URL',
  'MINIO_ENDPOINT',
  'MINIO_CONSOLE',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
  'MINIO_BUCKET',
  'MINIO_REGION',
  'QDRANT_URL',
  'QDRANT_COLLECTION_PREFIX',
  'OPENSEARCH_URL',
  'OPENSEARCH_INDEX_PREFIX',
  'TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE',
  'TOOL_GATEWAY_MAX_RETRIES',
  'TOOL_GATEWAY_MAX_RESPONSE_CHARS',
];

const urlKeys = [
  'CORS_ORIGIN',
  'NEXT_PUBLIC_CONTROL_API_BASE_URL',
  'NEXT_PUBLIC_RUNTIME_BASE_URL',
  'RUNTIME_BASE_URL',
  'CONTROL_API_INTERNAL_BASE_URL',
  'RUNTIME_CORS_ORIGIN',
  'RUNTIME_CONTROL_API_BASE_URL',
  'MINIO_ENDPOINT',
  'MINIO_CONSOLE',
  'QDRANT_URL',
  'OPENSEARCH_URL',
];

const portKeys = ['CONTROL_API_PORT', 'RUNTIME_PORT', 'POSTGRES_PORT'];
const positiveIntegerKeys = [
  'TOOL_GATEWAY_RATE_LIMIT_PER_MINUTE',
  'TOOL_GATEWAY_MAX_RETRIES',
  'TOOL_GATEWAY_MAX_RESPONSE_CHARS',
];
const productionSecretKeys = [
  'JWT_ACCESS_TOKEN_SECRET',
  'JWT_REFRESH_TOKEN_SECRET',
  'SECRET_ENCRYPTION_KEY',
  'MODEL_KEY_ENCRYPTION_SECRET',
  'DEFAULT_ADMIN_PASSWORD',
  'RUNTIME_INTERNAL_TOKEN',
  'POSTGRES_PASSWORD',
  'MINIO_ROOT_PASSWORD',
];
const workflowModeKeys = [
  'KNOWLEDGE_WORKFLOW_MODE',
  'AGENT_TEAM_WORKFLOW_MODE',
  'CHANNEL_RELEASE_WORKFLOW_MODE',
  'CHANNEL_RELEASE_SELF_HEALING_WORKFLOW_MODE',
];

const placeholderFragments = [
  'change-me',
  'replace-this',
  'your-',
  'example',
  'AIAgetDev!9sK4pQ7m',
  'password',
];

export function parseEnvText(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (!key) continue;

    env[key] = stripMatchingQuotes(rawValue);
  }
  return env;
}

export function collectProductionEnvIssues(env) {
  const issues = [];

  for (const key of requiredKeys) {
    if (!hasValue(env[key])) issues.push(`${key} is required`);
  }

  for (const key of urlKeys) {
    if (hasValue(env[key]) && !startsWithHttp(env[key])) {
      issues.push(`${key} must start with http:// or https://`);
    }
  }

  for (const key of portKeys) {
    if (hasValue(env[key]) && !isPort(env[key])) {
      issues.push(`${key} must be a TCP port between 1 and 65535`);
    }
  }

  for (const key of positiveIntegerKeys) {
    if (hasValue(env[key]) && !isNonNegativeInteger(env[key])) {
      issues.push(`${key} must be a non-negative integer`);
    }
  }

  if (hasValue(env.NODE_ENV) && env.NODE_ENV !== 'production') {
    issues.push('NODE_ENV should be production for production deployment');
  }

  if (hasValue(env.AGENT_RUNTIME_EXECUTION_MODE) && !['runtime_first', 'runtime_only', 'control_first'].includes(env.AGENT_RUNTIME_EXECUTION_MODE)) {
    issues.push('AGENT_RUNTIME_EXECUTION_MODE must be one of runtime_first, runtime_only, control_first');
  }

  for (const key of workflowModeKeys) {
    if (hasValue(env[key]) && !['local', 'runtime_first', 'runtime_only', 'temporal_first', 'temporal'].includes(env[key])) {
      issues.push(`${key} must be one of local, runtime_first, runtime_only, temporal_first, temporal`);
    }
  }

  if (hasValue(env.RUNTIME_TEMPORAL_ENABLED) && !['true', 'false'].includes(env.RUNTIME_TEMPORAL_ENABLED)) {
    issues.push('RUNTIME_TEMPORAL_ENABLED must be true or false');
  }

  if (hasValue(env.DATABASE_URL) && !env.DATABASE_URL.startsWith('postgresql://')) {
    issues.push('DATABASE_URL must start with postgresql://');
  }

  if (hasValue(env.DEFAULT_ADMIN_EMAIL) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.DEFAULT_ADMIN_EMAIL)) {
    issues.push('DEFAULT_ADMIN_EMAIL must be a valid email address');
  }

  for (const key of productionSecretKeys) {
    const value = env[key];
    if (!hasValue(value)) continue;
    if (isPlaceholder(value)) {
      issues.push(`${key} must not use a placeholder value`);
      continue;
    }
    if (String(value).length < minSecretLength(key)) {
      issues.push(`${key} should be at least ${minSecretLength(key)} characters for production`);
    }
  }

  if (hasValue(env.SECRET_ENCRYPTION_KEY) && ![32, 44, 64].includes(env.SECRET_ENCRYPTION_KEY.length)) {
    issues.push('SECRET_ENCRYPTION_KEY should be 32 raw characters, 44 base64 characters, or 64 hex characters');
  }

  return issues;
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

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function startsWithHttp(value) {
  return /^https?:\/\//.test(String(value));
}

function isPort(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535;
}

function isNonNegativeInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0;
}

function isPlaceholder(value) {
  const normalized = String(value).toLowerCase();
  return placeholderFragments.some((fragment) => normalized.includes(fragment));
}

function minSecretLength(key) {
  if (key === 'DEFAULT_ADMIN_PASSWORD' || key === 'POSTGRES_PASSWORD' || key === 'MINIO_ROOT_PASSWORD') return 12;
  return 24;
}

function loadEnvFile(path) {
  const absolutePath = resolve(process.cwd(), path);
  if (!existsSync(absolutePath)) {
    throw new Error(`Environment file not found: ${absolutePath}`);
  }
  return parseEnvText(readFileSync(absolutePath, 'utf8'));
}

function runCli() {
  const envPath = process.argv[2] ?? '.env.production';
  const env = loadEnvFile(envPath);
  const issues = collectProductionEnvIssues(env);

  if (issues.length > 0) {
    console.error(`Production environment validation failed for ${envPath}:`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Production environment validation passed for ${envPath}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli();
}
