import assert from 'node:assert/strict';
import test from 'node:test';

import { DATA_SCOPE_RESOURCE_DEFINITIONS } from '../data-scopes/data-scope.constants';
import { RESOURCE_ACL_RESOURCE_DEFINITIONS } from '../resource-acls/resource-acl.constants';
import {
  auditSandboxPolicyForHookExecution,
  buildPluginManifestPolicy,
  buildPluginGeneratedCodes,
  validatePluginManifestInput,
} from './plugin-policy';

test('blocks high risk plugin enablement until review is approved', () => {
  const policy = buildPluginManifestPolicy({
    riskLevel: 'HIGH',
    status: 'INSTALLED',
    manifest: {
      security_review: {
        status: 'PENDING',
      },
    },
  });

  assert.equal(policy.canEnable, false);
  assert.equal(policy.reviewRequired, true);
  assert.match(policy.reason ?? '', /安全审核/);
});

test('allows high risk plugin enablement after security review is approved', () => {
  const policy = buildPluginManifestPolicy({
    riskLevel: 'HIGH',
    status: 'INSTALLED',
    manifest: {
      security_review: {
        status: 'APPROVED',
        reviewed_at: '2026-05-05T00:00:00.000Z',
      },
    },
  });

  assert.equal(policy.canEnable, true);
  assert.equal(policy.reviewRequired, true);
  assert.equal(policy.reason, null);
});

test('extracts generated plugin menu and tool codes for uninstall cleanup', () => {
  const codes = buildPluginGeneratedCodes('ops-suite', {
    menus: [{ code: 'root' }, { menu_code: 'incident-board' }],
    tools: [{ code: 'restart-service' }, { tool_code: 'create-ticket' }],
  });

  assert.deepEqual(codes.menuCodes, ['plugin_ops-suite_root', 'plugin_ops-suite_incident-board']);
  assert.deepEqual(codes.toolCodes, ['plugin_tool_ops-suite_restart-service', 'plugin_tool_ops-suite_create-ticket']);
});

test('plugin permission catalogs include uninstall for the full production lifecycle', () => {
  const dataScopePlugin = DATA_SCOPE_RESOURCE_DEFINITIONS.find((item) => item.resource_type === 'PLUGIN');
  const resourceAclPlugin = RESOURCE_ACL_RESOURCE_DEFINITIONS.find((item) => item.resource_type === 'PLUGIN');

  assert.ok(dataScopePlugin?.permission_codes.includes('plugin:center:uninstall'));
  assert.ok(resourceAclPlugin?.permission_codes.includes('plugin:center:uninstall'));
});

test('blocks custom plugin manifests without package source integrity metadata', () => {
  const validation = validatePluginManifestInput({
    code: 'ticket-suite',
    source_type: 'CUSTOM',
    manifest_json: {
      schema_version: '1.0',
      code: 'ticket-suite',
      version: '1.2.0',
      tools: [
        {
          code: 'create-ticket',
          name: '创建工单',
          method: 'POST',
          url: 'https://plugins.example.com/tools/create-ticket',
        },
      ],
    },
  });

  assert.equal(validation.status, 'FAILED');
  assert.equal(validation.can_install, false);
  assert.deepEqual(
    validation.errors.map((issue) => issue.code),
    ['PACKAGE_SOURCE_REQUIRED', 'PACKAGE_SHA256_REQUIRED', 'PACKAGE_SIGNATURE_REQUIRED'],
  );
});

test('previews plugin tool center binding for valid custom manifests', () => {
  const validation = validatePluginManifestInput({
    code: 'ticket-suite',
    source_type: 'CUSTOM',
    manifest_json: {
      schema_version: '1.0',
      code: 'ticket-suite',
      version: '1.2.0',
      package: {
        source_url: 'https://plugins.example.com/ticket-suite-1.2.0.tgz',
        sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        signature: 'sigstore-bundle-placeholder',
      },
      permissions: ['plugin:ticket:create'],
      tools: [
        {
          code: 'create-ticket',
          name: '创建工单',
          method: 'POST',
          url: 'https://plugins.example.com/tools/create-ticket',
          risk_level: 'HIGH',
        },
      ],
    },
  });

  assert.equal(validation.status, 'PASSED');
  assert.equal(validation.can_install, true);
  assert.equal(validation.package_source, 'https://plugins.example.com/ticket-suite-1.2.0.tgz');
  assert.equal(validation.tool_bindings.length, 1);
  assert.equal(validation.tool_bindings[0]?.generated_tool_code, 'plugin_tool_ticket-suite_create-ticket');
  assert.equal(validation.tool_bindings[0]?.gateway, 'TOOL_GATEWAY');
  assert.equal(validation.tool_bindings[0]?.require_approval, true);
});

test('audits declared custom code sandbox policy as low risk before hook execution', () => {
  const audit = auditSandboxPolicyForHookExecution({
    runtime: {
      type: 'code',
      entry: 'dist/index.js',
    },
    sandbox: {
      isolation: 'PROCESS',
      network: 'DENY',
      filesystem: 'READONLY',
      timeout_ms: 5000,
      memory_mb: 128,
    },
  });

  assert.equal(audit.allowed, true);
  assert.equal(audit.risk_level, 'LOW');
  assert.deepEqual(audit.violations, []);
  assert.equal(audit.policy.status, 'DECLARED');
  assert.equal(audit.policy.isolation, 'PROCESS');
  assert.equal(audit.policy.network, 'DENY');
  assert.equal(audit.policy.filesystem, 'READONLY');
});

test('audits custom code sandbox policy with open network as critical and blocking', () => {
  const audit = auditSandboxPolicyForHookExecution({
    runtime: {
      type: 'code',
      entry: 'dist/index.js',
    },
    sandbox: {
      isolation: 'PROCESS',
      network: 'ALLOW',
      filesystem: 'READONLY',
      timeout_ms: 5000,
      memory_mb: 128,
    },
  });

  assert.equal(audit.allowed, false);
  assert.equal(audit.risk_level, 'CRITICAL');
  assert.ok(audit.violations.includes('sandbox.network 不允许使用 ALLOW。'));
});

test('audits malformed sandbox limits as incomplete policy instead of coercing strings', () => {
  const audit = auditSandboxPolicyForHookExecution({
    runtime: {
      type: 'code',
      entry: 'dist/index.js',
    },
    sandbox: {
      isolation: 'PROCESS',
      network: 'DENY',
      filesystem: 'READONLY',
      timeout_ms: '5000ms',
      memory_mb: '1.5',
    },
  });

  assert.equal(audit.allowed, false);
  assert.equal(audit.risk_level, 'HIGH');
  assert.ok(audit.violations.includes('sandbox.timeout_ms 必须大于 0。'));
  assert.ok(audit.violations.includes('sandbox.memory_mb 必须大于 0。'));
});
