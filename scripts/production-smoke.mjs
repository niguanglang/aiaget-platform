#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

export function resolveProductionSmokeUrls({ controlApi, runtime, web }) {
  return {
    controlHealth: appendPath(controlApi, '/api/v1/health', '/health'),
    runtimeProxyHealth: appendPath(controlApi, '/api/v1/runtime/health', '/runtime/health'),
    runtimeHealth: appendPath(runtime, '/runtime/health', '/health'),
    webLogin: appendPath(web, '/login', '/login'),
  };
}

export function resolveProductionSmokeCredentials(args, env = process.env) {
  const tenantCode = args.get('tenant-code') ?? env.DEFAULT_TENANT_CODE;
  const email = args.get('email') ?? env.DEFAULT_ADMIN_EMAIL;
  const password = args.get('password') ?? env.DEFAULT_ADMIN_PASSWORD;

  if (!tenantCode || !email || !password) {
    return null;
  }

  return {
    tenantCode,
    email,
    password,
  };
}

export function buildAuthenticatedSmokeChecks(controlApiBaseUrl) {
  return [
    { label: 'Auth current user', url: appendPath(controlApiBaseUrl, '/api/v1/auth/me', '/auth/me') },
    { label: 'Agent list', url: appendPath(controlApiBaseUrl, '/api/v1/agents?page=1&page_size=1', '/agents') },
    { label: 'Agent team overview', url: appendPath(controlApiBaseUrl, '/api/v1/agent-teams/overview', '/agent-teams/overview') },
    { label: 'Model provider list', url: appendPath(controlApiBaseUrl, '/api/v1/model-providers?page=1&page_size=1', '/model-providers') },
    { label: 'Prompt template list', url: appendPath(controlApiBaseUrl, '/api/v1/prompt-templates?page=1&page_size=1', '/prompt-templates') },
    { label: 'Knowledge overview', url: appendPath(controlApiBaseUrl, '/api/v1/knowledge-bases/overview', '/knowledge-bases/overview') },
    { label: 'Tool list', url: appendPath(controlApiBaseUrl, '/api/v1/tools?page=1&page_size=1', '/tools') },
    { label: 'Conversation list', url: appendPath(controlApiBaseUrl, '/api/v1/conversations?page=1&page_size=1', '/conversations') },
    { label: 'Monitor overview', url: appendPath(controlApiBaseUrl, '/api/v1/monitor/overview?window=24h', '/monitor/overview') },
    { label: 'Monitor observability quality', url: appendPath(controlApiBaseUrl, '/api/v1/monitor/observability?window=24h', '/monitor/observability') },
    { label: 'Runtime workflow status', url: appendPath(controlApiBaseUrl, '/api/v1/runtime/workflows/status', '/runtime/workflows/status') },
    { label: 'Security overview', url: appendPath(controlApiBaseUrl, '/api/v1/security-center/overview', '/security-center/overview') },
    { label: 'Billing overview', url: appendPath(controlApiBaseUrl, '/api/v1/billing/overview?window=30d', '/billing/overview') },
    { label: 'Channel overview', url: appendPath(controlApiBaseUrl, '/api/v1/channels/overview', '/channels/overview') },
    { label: 'API key list', url: appendPath(controlApiBaseUrl, '/api/v1/api-keys', '/api-keys') },
    { label: 'Plugin overview', url: appendPath(controlApiBaseUrl, '/api/v1/plugins/overview', '/plugins/overview') },
    { label: 'Storage settings', url: appendPath(controlApiBaseUrl, '/api/v1/storage/settings', '/storage/settings') },
    { label: 'System settings overview', url: appendPath(controlApiBaseUrl, '/api/v1/system-settings/overview', '/system-settings/overview') },
    { label: 'Production readiness', url: appendPath(controlApiBaseUrl, '/api/v1/system-settings/production-readiness', '/system-settings/production-readiness') },
    { label: 'Customer success plan list', url: appendPath(controlApiBaseUrl, '/api/v1/customer-success-plans?page=1&page_size=1', '/customer-success-plans') },
    { label: 'Customer success action list', url: appendPath(controlApiBaseUrl, '/api/v1/customer-success-actions?page=1&page_size=1', '/customer-success-actions') },
    { label: 'Customer success opportunity list', url: appendPath(controlApiBaseUrl, '/api/v1/customer-success-opportunities?page=1&page_size=1', '/customer-success-opportunities') },
    { label: 'Customer success opportunity analytics', url: appendPath(controlApiBaseUrl, '/api/v1/customer-success-opportunities/analytics', '/customer-success-opportunities/analytics') },
    { label: 'Menu tree', url: appendPath(controlApiBaseUrl, '/api/v1/menus/tree', '/menus/tree') },
    { label: 'Role overview', url: appendPath(controlApiBaseUrl, '/api/v1/roles/overview', '/roles/overview') },
    { label: 'Department overview', url: appendPath(controlApiBaseUrl, '/api/v1/departments/overview', '/departments/overview') },
  ];
}

export function buildDeepAuthenticatedSmokeChecks(controlApiBaseUrl) {
  return [
    {
      label: 'Plugin manifest precheck rejects incomplete custom package',
      method: 'POST',
      url: appendPath(controlApiBaseUrl, '/api/v1/plugins/manifest/validate', '/plugins/manifest/validate'),
      expect: 'manifest-validation-failed',
      body: {
        code: 'aiaget-plugin-smoke',
        source_type: 'CUSTOM',
        manifest_json: {
          schema_version: '1.0',
          code: 'aiaget-plugin-smoke',
          version: '0.0.0-smoke',
          package: {
            source_url: 'minio://aiaget-plugin-smoke/incomplete-plugin.tgz',
          },
          permissions: ['plugin:smoke:view'],
          tools: [
            {
              code: 'smoke-check',
              name: '生产 Smoke 校验',
              method: 'POST',
              url: 'https://example.invalid/smoke',
            },
          ],
        },
      },
    },
    {
      label: 'Production readiness contains plugin sandbox executor gate',
      method: 'GET',
      url: appendPath(controlApiBaseUrl, '/api/v1/system-settings/production-readiness', '/system-settings/production-readiness'),
      expect: 'production-readiness-plugin-sandbox-gate',
    },
  ];
}

export function collectProductionSmokeIssues(results) {
  const issues = [];

  checkHealthResult(issues, 'Control API health', results.controlHealth);
  checkHealthResult(issues, 'Control API runtime proxy', results.runtimeProxyHealth);
  checkHealthResult(issues, 'Runtime health', results.runtimeHealth);
  checkHttpResult(issues, 'Web console login', results.webLogin);
  if (results.authenticatedChecks) {
    for (const check of results.authenticatedChecks) {
      checkHttpResult(issues, check.label, check.result);
      checkExpectationResult(issues, check.label, check.expect, check.result);
    }
  }

  return issues;
}

function checkHealthResult(issues, label, result) {
  if (!result) {
    issues.push(`${label} was not checked`);
    return;
  }
  if (result.error) {
    issues.push(`${label} request failed: ${result.error}`);
    return;
  }
  if (!result.ok) {
    issues.push(`${label} returned HTTP ${result.status}`);
    return;
  }
  const status = result.body?.status;
  if (status !== 'healthy') {
    issues.push(`${label} status is ${status ?? 'missing'}`);
  }
}

function checkHttpResult(issues, label, result) {
  if (!result) {
    issues.push(`${label} was not checked`);
    return;
  }
  if (result.error) {
    issues.push(`${label} request failed: ${result.error}`);
    return;
  }
  if (!result.ok) {
    issues.push(`${label} returned HTTP ${result.status}`);
  }
}

function checkExpectationResult(issues, label, expectation, result) {
  if (!expectation || !result || result.error || !result.ok) return;

  if (expectation === 'manifest-validation-failed') {
    const errorCodes = Array.isArray(result.body?.errors)
      ? result.body.errors.map((issue) => issue?.code).filter(Boolean)
      : [];
    const failed = result.body?.status === 'FAILED'
      && result.body?.can_install === false
      && errorCodes.includes('PACKAGE_SHA256_REQUIRED')
      && errorCodes.includes('PACKAGE_SIGNATURE_REQUIRED');
    if (!failed) {
      issues.push(`${label} expected manifest validation to fail safely`);
    }
    return;
  }

  if (expectation === 'production-readiness-plugin-sandbox-gate') {
    if (!hasReadinessItem(result.body, 'plugin-sandbox-executor')) {
      issues.push(`${label} did not include plugin-sandbox-executor readiness item`);
    }
  }
}

function hasReadinessItem(body, itemId) {
  const categories = Array.isArray(body?.categories) ? body.categories : [];
  return categories.some((category) => {
    const items = Array.isArray(category?.items) ? category.items : [];
    return items.some((item) => item?.id === itemId);
  });
}

function appendPath(baseUrl, expectedPath, existingPrefixPath) {
  const url = new URL(baseUrl);
  const [expectedPathname, expectedSearch = ''] = expectedPath.split('?');
  const cleanPath = url.pathname.replace(/\/$/, '');
  if (!cleanPath || cleanPath === '/') {
    url.pathname = expectedPathname;
  } else if (cleanPath.endsWith(existingPrefixPath)) {
    url.pathname = `${cleanPath.slice(0, -existingPrefixPath.length)}${expectedPathname}`;
  } else if (expectedPathname.startsWith(cleanPath)) {
    url.pathname = expectedPathname;
  } else {
    url.pathname = `${cleanPath}${expectedPathname}`;
  }
  url.search = expectedSearch;
  return url.toString();
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

async function fetchProbe(url, expectsJson) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body: expectsJson && text ? JSON.parse(text) : null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function login(controlApiBaseUrl, credentials) {
  const response = await fetch(appendPath(controlApiBaseUrl, '/api/v1/auth/login', '/auth/login'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      tenantCode: credentials.tenantCode,
      email: credentials.email,
      password: credentials.password,
    }),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${response.url}: ${text.slice(0, 500)}`);
  }
  if (!body.accessToken) {
    throw new Error('Login response did not include accessToken');
  }
  return String(body.accessToken);
}

async function fetchAuthenticatedCheck(check, token) {
  try {
    const method = check.method ?? 'GET';
    const headers = {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    };
    if (check.body) {
      headers['content-type'] = 'application/json';
    }
    const response = await fetch(check.url, {
      method,
      headers,
      body: check.body ? JSON.stringify(check.body) : undefined,
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body: text ? safeJson(text) : null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const controlApi = args.get('control-api') ?? process.env.NEXT_PUBLIC_CONTROL_API_BASE_URL ?? process.env.CONTROL_API_BASE_URL;
  const runtime = args.get('runtime') ?? process.env.NEXT_PUBLIC_RUNTIME_BASE_URL ?? process.env.RUNTIME_PUBLIC_BASE_URL;
  const web = args.get('web') ?? process.env.WEB_BASE_URL ?? process.env.CORS_ORIGIN;
  const credentials = resolveProductionSmokeCredentials(args);

  if (!controlApi || !runtime || !web) {
    throw new Error('Usage: node scripts/production-smoke.mjs --control-api https://api.example.com/api/v1 --runtime https://runtime.example.com/runtime --web https://console.example.com');
  }

  const urls = resolveProductionSmokeUrls({ controlApi, runtime, web });
  const results = {
    controlHealth: await fetchProbe(urls.controlHealth, true),
    runtimeProxyHealth: await fetchProbe(urls.runtimeProxyHealth, true),
    runtimeHealth: await fetchProbe(urls.runtimeHealth, true),
    webLogin: await fetchProbe(urls.webLogin, false),
  };

  if (credentials) {
    const token = await login(controlApi, credentials);
    results.authenticatedChecks = [];
    const authenticatedChecks = buildAuthenticatedSmokeChecks(controlApi);
    if (args.has('deep')) {
      authenticatedChecks.push(...buildDeepAuthenticatedSmokeChecks(controlApi));
    }
    for (const check of authenticatedChecks) {
      results.authenticatedChecks.push({
        label: check.label,
        expect: check.expect,
        result: await fetchAuthenticatedCheck(check, token),
      });
    }
  }

  const issues = collectProductionSmokeIssues(results);

  if (issues.length > 0) {
    console.error('Production smoke validation failed:');
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
    return;
  }

  console.log('Production smoke validation passed.');
  for (const [name, url] of Object.entries(urls)) {
    console.log(`- ${name}: ${url}`);
  }
  if (credentials) {
    console.log(`- authenticated checks: ${results.authenticatedChecks?.length ?? 0}`);
  } else {
    console.log('- authenticated checks: skipped; provide --tenant-code, --email and --password or DEFAULT_* env values');
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
