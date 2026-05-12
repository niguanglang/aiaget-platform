import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAuthenticatedSmokeChecks,
  buildDeepAuthenticatedSmokeChecks,
  collectProductionSmokeIssues,
  collectProductionSmokeOutput,
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

test('resolveProductionSmokeCredentials reports an issue when authenticated probes are required', () => {
  assert.equal(
    resolveProductionSmokeCredentials(new Map([['require-auth', 'true']]), {
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
      'Monitor observability quality',
      'Runtime workflow status',
      'Security overview',
      'Billing overview',
      'Channel overview',
      'API key list',
      'Plugin overview',
      'Storage settings',
      'System settings overview',
      'Production readiness',
      'Customer success plan list',
      'Customer success action list',
      'Customer success opportunity list',
      'Customer success opportunity analytics',
      'Menu tree',
      'Role overview',
      'Department overview',
    ],
  );
  assert.equal(checks[0]?.url, 'https://api.example.com/api/v1/auth/me');
  assert.equal(
    checks.find((check) => check.label === 'Production readiness')?.url,
    'https://api.example.com/api/v1/system-settings/production-readiness',
  );
  assert.equal(
    checks.find((check) => check.label === 'Customer success plan list')?.url,
    'https://api.example.com/api/v1/customer-success-plans?page=1&page_size=1',
  );
  assert.equal(
    checks.find((check) => check.label === 'Customer success action list')?.url,
    'https://api.example.com/api/v1/customer-success-actions?page=1&page_size=1',
  );
  assert.equal(
    checks.find((check) => check.label === 'Customer success opportunity list')?.url,
    'https://api.example.com/api/v1/customer-success-opportunities?page=1&page_size=1',
  );
  assert.equal(
    checks.find((check) => check.label === 'Customer success opportunity analytics')?.url,
    'https://api.example.com/api/v1/customer-success-opportunities/analytics',
  );
  assert.equal(
    checks.find((check) => check.label === 'Monitor observability quality')?.url,
    'https://api.example.com/api/v1/monitor/observability?window=24h',
  );
  assert.equal(checks.at(-1)?.url, 'https://api.example.com/api/v1/departments/overview');
});

test('buildDeepAuthenticatedSmokeChecks adds safe production closure probes', () => {
  const checks = buildDeepAuthenticatedSmokeChecks('https://api.example.com/api/v1');

  assert.deepEqual(
    checks.map((check) => [check.label, check.method, check.url]),
    [
      [
        'Plugin manifest precheck rejects incomplete custom package',
        'POST',
        'https://api.example.com/api/v1/plugins/manifest/validate',
      ],
      [
        'Production readiness contains plugin sandbox executor gate',
        'GET',
        'https://api.example.com/api/v1/system-settings/production-readiness',
      ],
    ],
  );
  assert.equal(
    checks[0]?.body?.manifest_json?.package?.source_url,
    'minio://aiaget-plugin-smoke/incomplete-plugin.tgz',
  );
});

test('collectProductionSmokeIssues accepts successful deep authenticated smoke checks', () => {
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
      authenticatedChecks: [
        {
          label: 'Plugin manifest precheck rejects incomplete custom package',
          expect: 'manifest-validation-failed',
          result: {
            ok: true,
            status: 200,
            body: {
              status: 'FAILED',
              can_install: false,
              errors: [
                { code: 'PACKAGE_SHA256_REQUIRED' },
                { code: 'PACKAGE_SIGNATURE_REQUIRED' },
              ],
            },
          },
        },
        {
          label: 'Production readiness contains plugin sandbox executor gate',
          expect: 'production-readiness-plugin-sandbox-gate',
          result: {
            ok: true,
            status: 200,
            body: {
              categories: [
                {
                  category: 'THIRD_PARTY',
                  items: [
                    {
                      id: 'plugin-sandbox-executor',
                      status: 'READY',
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    }),
    [],
  );
});

test('collectProductionSmokeIssues reports failed deep authenticated smoke expectations', () => {
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
      authenticatedChecks: [
        {
          label: 'Plugin manifest precheck rejects incomplete custom package',
          expect: 'manifest-validation-failed',
          result: {
            ok: true,
            status: 200,
            body: {
              status: 'PASSED',
              can_install: true,
              errors: [],
            },
          },
        },
        {
          label: 'Production readiness contains plugin sandbox executor gate',
          expect: 'production-readiness-plugin-sandbox-gate',
          result: {
            ok: true,
            status: 200,
            body: {
              categories: [
                {
                  category: 'THIRD_PARTY',
                  items: [{ id: 'plugin-ecosystem', status: 'MANUAL' }],
                },
              ],
            },
          },
        },
      ],
    }),
    [
      'Plugin manifest precheck rejects incomplete custom package expected manifest validation to fail safely',
      'Production readiness contains plugin sandbox executor gate did not include plugin-sandbox-executor readiness item',
    ],
  );
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

test('collectProductionSmokeIssues reports missing authenticated checks when required', () => {
  assert.deepEqual(
    collectProductionSmokeIssues({
      requireAuthenticatedChecks: true,
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
    ['Authenticated smoke checks were required but credentials were not provided'],
  );
});

test('collectProductionSmokeOutput returns a redacted JSON evidence payload', () => {
  const output = collectProductionSmokeOutput({
    generatedAt: '2026-05-12T00:00:00.000Z',
    deep: true,
    requireAuthenticatedChecks: true,
    urls: {
      controlHealth: 'https://api.example.com/api/v1/health',
      runtimeProxyHealth: 'https://api.example.com/api/v1/runtime/health',
      runtimeHealth: 'https://runtime.example.com/runtime/health',
      webLogin: 'https://console.example.com/login',
    },
    controlHealth: {
      ok: true,
      status: 200,
      body: { status: 'healthy' },
    },
    runtimeProxyHealth: {
      ok: true,
      status: 200,
      body: { status: 'healthy' },
    },
    runtimeHealth: {
      ok: true,
      status: 200,
      body: { status: 'healthy' },
    },
    webLogin: {
      ok: true,
      status: 200,
      body: null,
    },
    authenticatedChecks: [
      {
        label: 'Auth current user',
        method: 'GET',
        url: 'https://api.example.com/api/v1/auth/me',
        result: {
          ok: true,
          status: 200,
          body: {
            email: 'oss-admin-7f4c2a@local.invalid',
            accessToken: 'should-not-leak',
          },
        },
      },
    ],
  });

  assert.deepEqual(output.summary, {
    status: 'PASSED',
    issue_count: 0,
    authenticated_check_count: 1,
    deep: true,
    require_authenticated_checks: true,
  });
  assert.equal(output.authenticated_checks[0]?.body.email, 'oss-admin-7f4c2a@local.invalid');
  assert.equal(output.authenticated_checks[0]?.body.accessToken, '[REDACTED]');
});
