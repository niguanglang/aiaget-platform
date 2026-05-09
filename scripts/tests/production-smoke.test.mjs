import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAuthenticatedSmokeChecks,
  collectProductionSmokeIssues,
  resolveProductionSmokeCredentials,
  resolveProductionSmokeUrls,
} from '../production-smoke.mjs';

test('resolveProductionSmokeUrls builds health endpoints from public base URLs', () => {
  assert.deepEqual(
    resolveProductionSmokeUrls({
      controlApi: 'https://api.example.com/api/v1',
      runtime: 'https://runtime.example.com/runtime',
      web: 'https://console.example.com',
    }),
    {
      controlHealth: 'https://api.example.com/api/v1/health',
      runtimeProxyHealth: 'https://api.example.com/api/v1/runtime/health',
      runtimeHealth: 'https://runtime.example.com/runtime/health',
      webLogin: 'https://console.example.com/login',
    },
  );
});

test('resolveProductionSmokeUrls tolerates base URLs without application path prefixes', () => {
  assert.deepEqual(
    resolveProductionSmokeUrls({
      controlApi: 'https://api.example.com',
      runtime: 'https://runtime.example.com',
      web: 'https://console.example.com/',
    }),
    {
      controlHealth: 'https://api.example.com/api/v1/health',
      runtimeProxyHealth: 'https://api.example.com/api/v1/runtime/health',
      runtimeHealth: 'https://runtime.example.com/runtime/health',
      webLogin: 'https://console.example.com/login',
    },
  );
});

test('collectProductionSmokeIssues accepts healthy application endpoints', () => {
  assert.deepEqual(
    collectProductionSmokeIssues({
      controlHealth: {
        ok: true,
        status: 200,
        body: { service: 'control-api', status: 'healthy' },
      },
      runtimeProxyHealth: {
        ok: true,
        status: 200,
        body: { service: 'agent-runtime', status: 'healthy' },
      },
      runtimeHealth: {
        ok: true,
        status: 200,
        body: { service: 'agent-runtime', status: 'healthy' },
      },
      webLogin: {
        ok: true,
        status: 200,
        body: null,
      },
    }),
    [],
  );
});

test('resolveProductionSmokeCredentials reads explicit credentials before environment fallback', () => {
  assert.deepEqual(
    resolveProductionSmokeCredentials(
      new Map([
        ['tenant-code', 'arg-tenant'],
        ['email', 'arg@example.com'],
        ['password', 'arg-password'],
      ]),
      {
        DEFAULT_TENANT_CODE: 'env-tenant',
        DEFAULT_ADMIN_EMAIL: 'env@example.com',
        DEFAULT_ADMIN_PASSWORD: 'env-password',
      },
    ),
    {
      tenantCode: 'arg-tenant',
      email: 'arg@example.com',
      password: 'arg-password',
    },
  );

  assert.deepEqual(
    resolveProductionSmokeCredentials(new Map(), {
      DEFAULT_TENANT_CODE: 'env-tenant',
      DEFAULT_ADMIN_EMAIL: 'env@example.com',
      DEFAULT_ADMIN_PASSWORD: 'env-password',
    }),
    {
      tenantCode: 'env-tenant',
      email: 'env@example.com',
      password: 'env-password',
    },
  );
});

test('resolveProductionSmokeCredentials disables authenticated probes when credentials are incomplete', () => {
  assert.equal(
    resolveProductionSmokeCredentials(new Map([['email', 'oss-admin-7f4c2a@local.invalid']]), {
      DEFAULT_TENANT_CODE: 'default',
    }),
    null,
  );
});

test('buildAuthenticatedSmokeChecks covers core business read endpoints', () => {
  const checks = buildAuthenticatedSmokeChecks('https://api.example.com/api/v1');

  assert.deepEqual(
    checks.map((check) => check.label),
    [
      'Auth current user',
      'Agent list',
      'Agent team overview',
      'Model provider list',
      'Prompt template list',
      'Knowledge overview',
      'Tool list',
      'Conversation list',
      'Monitor overview',
      'Runtime workflow status',
      'Security overview',
      'Billing overview',
      'Channel overview',
      'API key list',
      'Plugin overview',
      'Storage settings',
      'System settings overview',
      'Menu tree',
      'Role overview',
      'Department overview',
    ],
  );
  assert.equal(checks[0]?.url, 'https://api.example.com/api/v1/auth/me');
  assert.equal(checks.at(-1)?.url, 'https://api.example.com/api/v1/departments/overview');
});

test('collectProductionSmokeIssues reports unhealthy services and failed HTTP responses', () => {
  assert.deepEqual(
    collectProductionSmokeIssues({
      controlHealth: {
        ok: true,
        status: 200,
        body: { service: 'control-api', status: 'degraded' },
      },
      runtimeProxyHealth: {
        ok: false,
        status: 502,
        body: { status: 'unavailable' },
      },
      runtimeHealth: {
        ok: false,
        status: 0,
        error: 'connection refused',
      },
      webLogin: {
        ok: false,
        status: 404,
        body: null,
      },
    }),
    [
      'Control API health status is degraded',
      'Control API runtime proxy returned HTTP 502',
      'Runtime health request failed: connection refused',
      'Web console login returned HTTP 404',
    ],
  );
});
