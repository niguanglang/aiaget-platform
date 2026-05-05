import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPluginManifestPolicy, buildPluginGeneratedCodes } from './plugin-policy';

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
