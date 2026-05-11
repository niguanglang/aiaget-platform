import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { PluginsService } from './plugins.service';

const currentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  tenantId: '00000000-0000-0000-0000-000000000002',
  email: 'operator@example.com',
  roles: ['tenant_admin'],
  roleIds: [],
  permissions: [],
  departmentId: null,
};

test('install blocks invalid custom manifest before writing plugin records and records failure event', async () => {
  let pluginUpsertCalled = false;
  const recordedEvents: unknown[] = [];
  const service = new PluginsService(
    {
      plugin: {
        upsert: () => {
          pluginUpsertCalled = true;
          throw new Error('plugin upsert should not be called for invalid manifest');
        },
      },
    } as never,
    {} as never,
    {
      recordEvent: (event: unknown) => {
        recordedEvents.push(event);
        return Promise.resolve(event);
      },
    } as never,
    {
      verifyPackage: async () => {
        throw new Error('package integrity should not run for invalid manifest metadata');
      },
    } as never,
  );

  await assert.rejects(
    () => service.install(currentUser, {
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
    }),
    BadRequestException,
  );

  assert.equal(pluginUpsertCalled, false);
  assert.equal(recordedEvents.length, 1);
  assert.equal((recordedEvents[0] as { eventType?: string }).eventType, 'plugin.manifest.validation_failed');
  assert.equal((recordedEvents[0] as { status?: string }).status, 'FAILED');
});

test('install verifies custom plugin package integrity before writing plugin records', async () => {
  let pluginUpsertCalled = false;
  const recordedEvents: unknown[] = [];
  const service = new PluginsService(
    {
      plugin: {
        upsert: () => {
          pluginUpsertCalled = true;
          throw new Error('plugin upsert should not be called for mismatched package');
        },
      },
    } as never,
    {} as never,
    {
      recordEvent: (event: unknown) => {
        recordedEvents.push(event);
        return Promise.resolve(event);
      },
    } as never,
    {
      verifyPackage: async () => ({
        status: 'FAILED',
        verified: false,
        source_url: 'https://plugins.example.com/ticket-suite-1.2.0.tgz',
        final_url: 'https://plugins.example.com/ticket-suite-1.2.0.tgz',
        expected_sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        actual_sha256: createHash('sha256').update('tampered').digest('hex'),
        package_size_bytes: 8,
        content_type: 'application/gzip',
        error_code: 'PACKAGE_SHA256_MISMATCH',
        error_message: '插件包 sha256 与 Manifest 声明不一致。',
      }),
    } as never,
  );

  await assert.rejects(
    () => service.install(currentUser, {
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
        tools: [
          {
            code: 'create-ticket',
            name: '创建工单',
            method: 'POST',
            url: 'https://plugins.example.com/tools/create-ticket',
          },
        ],
      },
    }),
    BadRequestException,
  );

  assert.equal(pluginUpsertCalled, false);
  assert.equal(recordedEvents.length, 1);
  assert.equal((recordedEvents[0] as { eventType?: string }).eventType, 'plugin.manifest.validation_failed');
  assert.equal((recordedEvents[0] as { payloadJson?: { package_integrity?: { error_code?: string } } }).payloadJson?.package_integrity?.error_code, 'PACKAGE_SHA256_MISMATCH');
});

test('install blocks custom plugin when signature verification fails', async () => {
  let pluginUpsertCalled = false;
  const recordedEvents: unknown[] = [];
  const service = new PluginsService(
    {
      plugin: {
        upsert: () => {
          pluginUpsertCalled = true;
          throw new Error('plugin upsert should not be called for rejected signature');
        },
      },
    } as never,
    {} as never,
    {
      recordEvent: (event: unknown) => {
        recordedEvents.push(event);
        return Promise.resolve(event);
      },
    } as never,
    {
      verifyPackage: async () => ({
        status: 'FAILED',
        verified: false,
        source_url: 'https://plugins.example.com/ticket-suite-1.2.0.tgz',
        final_url: 'https://plugins.example.com/ticket-suite-1.2.0.tgz',
        expected_sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        actual_sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        package_size_bytes: 128,
        content_type: 'application/gzip',
        signature: {
          status: 'FAILED',
          verified: false,
          signature_type: 'SIGSTORE',
          signature_present: true,
          verification_url: 'https://verify.example.com/sigstore',
          subject: null,
          issuer: null,
          error_code: 'PACKAGE_SIGNATURE_REJECTED',
          error_message: '插件包签名校验失败。',
        },
        error_code: 'PACKAGE_SIGNATURE_REJECTED',
        error_message: '插件包签名校验失败。',
      }),
    } as never,
  );

  await assert.rejects(
    () => service.install(currentUser, {
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
          signature_type: 'SIGSTORE',
          verification_url: 'https://verify.example.com/sigstore',
        },
        tools: [
          {
            code: 'create-ticket',
            name: '创建工单',
            method: 'POST',
            url: 'https://plugins.example.com/tools/create-ticket',
          },
        ],
      },
    }),
    BadRequestException,
  );

  assert.equal(pluginUpsertCalled, false);
  assert.equal(recordedEvents.length, 1);
  assert.equal((recordedEvents[0] as { eventType?: string }).eventType, 'plugin.manifest.validation_failed');
  assert.equal((recordedEvents[0] as { payloadJson?: { package_integrity?: { signature?: { error_code?: string } } } }).payloadJson?.package_integrity?.signature?.error_code, 'PACKAGE_SIGNATURE_REJECTED');
});

test('validateManifest includes real package integrity result for custom plugin packages', async () => {
  const service = new PluginsService(
    {} as never,
    {} as never,
    {} as never,
    {
      verifyPackage: async () => ({
        status: 'PASSED',
        verified: true,
        source_url: 'https://plugins.example.com/ticket-suite-1.2.0.tgz',
        final_url: 'https://plugins.example.com/ticket-suite-1.2.0.tgz',
        expected_sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        actual_sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        package_size_bytes: 128,
        content_type: 'application/gzip',
        error_code: null,
        error_message: null,
      }),
    } as never,
  );

  const validation = await service.validateManifest(currentUser, {
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

  assert.equal(validation.status, 'PASSED');
  assert.equal(validation.package_integrity?.verified, true);
  assert.equal(validation.package_integrity?.package_size_bytes, 128);
});

test('validateManifest records failed custom manifest precheck as platform event before install flow', async () => {
  const recordedEvents: unknown[] = [];
  const service = new PluginsService(
    {} as never,
    {} as never,
    {
      recordEvent: (event: unknown) => {
        recordedEvents.push(event);
        return Promise.resolve(event);
      },
    } as never,
    {
      verifyPackage: async () => {
        throw new Error('package integrity should not run when manifest metadata is already invalid');
      },
    } as never,
  );

  const validation = await (service as unknown as {
    validateManifest: (user: typeof currentUser, dto: Record<string, unknown>) => Promise<{ can_install: boolean; errors: Array<{ code: string }> }>;
  }).validateManifest(currentUser, {
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

  assert.equal(validation.can_install, false);
  assert.equal(validation.errors.some((issue) => issue.code === 'PACKAGE_SOURCE_REQUIRED'), true);
  assert.equal(recordedEvents.length, 1);
  assert.equal((recordedEvents[0] as { eventType?: string }).eventType, 'plugin.manifest.validation_failed');
  assert.equal((recordedEvents[0] as { resourceId?: string }).resourceId, 'ticket-suite');
  assert.equal((recordedEvents[0] as { userId?: string }).userId, currentUser.id);
});

test('validateManifest blocks custom plugin code entry without sandbox policy', async () => {
  const recordedEvents: unknown[] = [];
  const service = new PluginsService(
    {} as never,
    {} as never,
    {
      recordEvent: (event: unknown) => {
        recordedEvents.push(event);
        return Promise.resolve(event);
      },
    } as never,
    {
      verifyPackage: async () => {
        throw new Error('package integrity should not run when sandbox policy is missing');
      },
    } as never,
  );

  const validation = await service.validateManifest(currentUser, {
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
      runtime: {
        type: 'code',
        entry: 'dist/index.js',
      },
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

  assert.equal(validation.can_install, false);
  assert.equal(validation.sandbox_required, true);
  assert.equal(validation.sandbox_policy?.status, 'MISSING');
  assert.equal(validation.errors.some((issue) => issue.code === 'PLUGIN_SANDBOX_POLICY_REQUIRED'), true);
  assert.equal(recordedEvents.length, 1);
  assert.equal((recordedEvents[0] as { payloadJson?: { sandbox_policy?: { status?: string } } }).payloadJson?.sandbox_policy?.status, 'MISSING');
});

test('validateManifest reports sandbox policy when custom code entry is explicitly isolated', async () => {
  const service = new PluginsService(
    {} as never,
    {} as never,
    {} as never,
    {
      verifyPackage: async () => ({
        status: 'PASSED',
        verified: true,
        source_url: 'https://plugins.example.com/ticket-suite-1.2.0.tgz',
        final_url: 'https://plugins.example.com/ticket-suite-1.2.0.tgz',
        expected_sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        actual_sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        package_size_bytes: 128,
        content_type: 'application/gzip',
        error_code: null,
        error_message: null,
      }),
    } as never,
  );

  const validation = await service.validateManifest(currentUser, {
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

  assert.equal(validation.can_install, true);
  assert.equal(validation.sandbox_required, true);
  assert.equal(validation.sandbox_policy?.status, 'DECLARED');
  assert.equal(validation.sandbox_policy?.isolation, 'PROCESS');
  assert.equal(validation.sandbox_policy?.network, 'DENY');
  assert.equal(validation.sandbox_policy?.filesystem, 'READONLY');
});

test('rollback rejects missing target version before loading plugin installation', async () => {
  const service = new PluginsService(
    {
      pluginInstallation: {
        findFirst: async () => {
          throw new Error('plugin installation lookup should not run without rollback target');
        },
      },
    } as never,
    {} as never,
    {} as never,
    { verifyPackage: async () => { throw new Error('rollback should not verify package'); } } as never,
  );

  await assert.rejects(
    () => service.rollback(currentUser, 'plugin-1', {}),
    BadRequestException,
  );
});

test('rollback rejects ambiguous target version before loading plugin installation', async () => {
  const service = new PluginsService(
    {
      pluginInstallation: {
        findFirst: async () => {
          throw new Error('plugin installation lookup should not run with ambiguous rollback target');
        },
      },
    } as never,
    {} as never,
    {} as never,
    { verifyPackage: async () => { throw new Error('rollback should not verify package'); } } as never,
  );

  await assert.rejects(
    () => service.rollback(currentUser, 'plugin-1', {
      version: '1.1.0',
      version_id: 'version-1',
    }),
    BadRequestException,
  );
});

test('rollback restores a published plugin version snapshot and records event before returning detail', async () => {
  const calls: Array<{ data?: Record<string, unknown>; model: string; op: string; where?: Record<string, unknown> }> = [];
  const recordedEvents: unknown[] = [];
  const rollbackManifest = {
    code: 'ticket-suite',
    name: '工单套件',
    version: '1.1.0',
    provider: '内部插件',
    risk_level: 'MEDIUM',
    permissions: ['plugin:ticket:view'],
    tools: [],
  };
  const installation = {
    id: 'plugin-installation-1',
    tenantId: currentUser.tenantId,
    pluginId: 'plugin-1',
    installedVersion: '1.2.0',
    latestVersion: '1.2.0',
    manifestJson: { code: 'ticket-suite', version: '1.2.0' },
    configJson: { enabled: true },
    riskLevel: 'MEDIUM',
    status: 'ACTIVE',
    runtimeStatus: 'RUNNING',
    enabledAt: null,
    disabledAt: null,
  };
  const service = new PluginsService(
    {
      pluginInstallation: {
        findFirst: async () => installation,
        update: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'pluginInstallation', op: 'update', ...args });
          return { ...installation, ...args.data };
        },
      },
      pluginVersion: {
        findFirst: async () => ({
          id: 'version-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          version: '1.1.0',
          status: 'PUBLISHED',
          manifestJson: rollbackManifest,
          changeNote: '稳定版本',
          publishedAt: new Date('2026-05-01T00:00:00Z'),
          createdAt: new Date('2026-05-01T00:00:00Z'),
          deletedAt: null,
          createdBy: currentUser.id,
        }),
        upsert: async (args: { create: Record<string, unknown>; update: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ data: args.update, model: 'pluginVersion', op: 'upsert', where: args.where });
          return args.create;
        },
      },
      plugin: {
        update: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'plugin', op: 'update', ...args });
          return { id: 'plugin-1', ...args.data };
        },
      },
      permission: { upsert: async () => ({}) },
      pluginHook: {
        upsert: async () => ({}),
        updateMany: async () => ({ count: 0 }),
      },
      menu: {
        upsert: async () => ({ id: 'menu-1' }),
        updateMany: async () => ({ count: 0 }),
      },
      pluginMenuBinding: {
        upsert: async () => ({}),
        updateMany: async () => ({ count: 0 }),
      },
      tool: {
        upsert: async () => ({}),
        updateMany: async () => ({ count: 0 }),
      },
      pluginAuditLog: { create: async (args: { data: Record<string, unknown> }) => {
        calls.push({ data: args.data, model: 'pluginAuditLog', op: 'create' });
        return args.data;
      } },
    } as never,
    {} as never,
    {
      recordEvent: (event: unknown) => {
        recordedEvents.push(event);
        return Promise.resolve(event);
      },
    } as never,
    { verifyPackage: async () => { throw new Error('rollback should not verify package'); } } as never,
  );
  const getInstallation = service.getInstallation.bind(service);
  service.getInstallation = (async () => ({
    id: installation.id,
    tenant_id: currentUser.tenantId,
    plugin_id: 'plugin-1',
    code: 'ticket-suite',
    name: '工单套件',
    provider: '内部插件',
    description: null,
    source_type: 'CUSTOM',
    installed_version: '1.1.0',
    latest_version: '1.1.0',
    status: 'INSTALLED',
    runtime_status: 'STOPPED',
    risk_level: 'MEDIUM',
    owner_id: currentUser.id,
    menu_count: 0,
    hook_count: 0,
    permission_count: 1,
    installed_at: null,
    last_upgraded_at: null,
    enabled_at: null,
    disabled_at: null,
    updated_at: new Date().toISOString(),
    manifest_json: rollbackManifest,
    config_json: null,
    permission_preview: ['plugin:ticket:view'],
    menu_bindings: [],
    hooks: [],
    versions: [],
    audit_logs: [],
    security_preview: { summary: 'ok', risks: [], notes: [] },
  })) as typeof service.getInstallation;

  try {
    const detail = await service.rollback(currentUser, 'plugin-1', {
      change_note: '回滚到稳定版本',
      version_id: 'version-1',
    });

    assert.equal(detail.installed_version, '1.1.0');
    assert.equal(recordedEvents.length, 2);
    assert.equal((recordedEvents[1] as { eventType?: string }).eventType, 'plugin.rolled_back');
    assert.ok(calls.some((call) => call.model === 'plugin' && call.op === 'update' && call.data?.latestVersion === '1.1.0'));
    assert.ok(calls.some((call) => call.model === 'pluginInstallation' && call.op === 'update' && call.data?.installedVersion === '1.1.0'));
    assert.ok(calls.some((call) => call.model === 'pluginAuditLog' && call.op === 'create' && call.data?.action === 'ROLLBACK'));
    assert.ok(calls.some((call) => call.model === 'pluginVersion' && call.op === 'upsert'));
  } finally {
    service.getInstallation = getInstallation;
  }
});

test('rollback dispatches plugin rollback workflow after control-plane snapshot restore', async () => {
  const calls: Array<{ data?: Record<string, unknown>; model: string; op: string; where?: Record<string, unknown> }> = [];
  const recordedEvents: unknown[] = [];
  const dispatchedRollbacks: Array<{ pluginId: string; versionId: string; version: string }> = [];
  const rollbackManifest = {
    code: 'ticket-suite',
    name: '工单套件',
    version: '1.1.0',
    provider: '内部插件',
    risk_level: 'MEDIUM',
    permissions: ['plugin:ticket:view'],
    tools: [],
  };
  const installation = {
    id: 'plugin-installation-1',
    tenantId: currentUser.tenantId,
    pluginId: 'plugin-1',
    installedVersion: '1.2.0',
    latestVersion: '1.2.0',
    manifestJson: { code: 'ticket-suite', version: '1.2.0' },
    configJson: { enabled: true },
    riskLevel: 'MEDIUM',
    status: 'ACTIVE',
    runtimeStatus: 'RUNNING',
    enabledAt: null,
    disabledAt: null,
  };
  const service = new PluginsService(
    {
      pluginInstallation: {
        findFirst: async () => installation,
        update: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'pluginInstallation', op: 'update', ...args });
          return { ...installation, ...args.data };
        },
      },
      pluginVersion: {
        findFirst: async () => ({
          id: 'version-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          version: '1.1.0',
          status: 'PUBLISHED',
          manifestJson: rollbackManifest,
          changeNote: '稳定版本',
          publishedAt: new Date('2026-05-01T00:00:00Z'),
          createdAt: new Date('2026-05-01T00:00:00Z'),
          deletedAt: null,
          createdBy: currentUser.id,
        }),
        upsert: async (args: { create: Record<string, unknown>; update: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ data: args.update, model: 'pluginVersion', op: 'upsert', where: args.where });
          return args.create;
        },
      },
      plugin: {
        update: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'plugin', op: 'update', ...args });
          return { id: 'plugin-1', ...args.data };
        },
      },
      permission: { upsert: async () => ({}) },
      pluginHook: {
        upsert: async () => ({}),
        updateMany: async () => ({ count: 0 }),
      },
      menu: {
        upsert: async () => ({ id: 'menu-1' }),
        updateMany: async () => ({ count: 0 }),
      },
      pluginMenuBinding: {
        upsert: async () => ({}),
        updateMany: async () => ({ count: 0 }),
      },
      tool: {
        upsert: async () => ({}),
        updateMany: async () => ({ count: 0 }),
      },
      pluginAuditLog: { create: async (args: { data: Record<string, unknown> }) => {
        calls.push({ data: args.data, model: 'pluginAuditLog', op: 'create' });
        return args.data;
      } },
    } as never,
    {} as never,
    {
      recordEvent: (event: unknown) => {
        recordedEvents.push(event);
        return Promise.resolve(event);
      },
    } as never,
    { verifyPackage: async () => { throw new Error('rollback should not verify package'); } } as never,
    {
      dispatchRollback: async (user: typeof currentUser, pluginId: string, versionInput: { versionId: string; version: string }) => {
        assert.equal(user.id, currentUser.id);
        dispatchedRollbacks.push({ pluginId, versionId: versionInput.versionId, version: versionInput.version });
        return {
          workflow_backend: 'TEMPORAL',
          workflow_id: 'plugin-rollback-plugin-1-version-1',
          workflow_run_id: 'run-1',
        };
      },
    } as never,
  );
  const getInstallation = service.getInstallation.bind(service);
  service.getInstallation = (async () => ({
    id: installation.id,
    tenant_id: currentUser.tenantId,
    plugin_id: 'plugin-1',
    code: 'ticket-suite',
    name: '工单套件',
    provider: '内部插件',
    description: null,
    source_type: 'CUSTOM',
    installed_version: '1.1.0',
    latest_version: '1.1.0',
    status: 'INSTALLED',
    runtime_status: 'STOPPED',
    risk_level: 'MEDIUM',
    owner_id: currentUser.id,
    menu_count: 0,
    hook_count: 0,
    permission_count: 1,
    installed_at: null,
    last_upgraded_at: null,
    enabled_at: null,
    disabled_at: null,
    updated_at: new Date().toISOString(),
    manifest_json: rollbackManifest,
    config_json: null,
    permission_preview: ['plugin:ticket:view'],
    menu_bindings: [],
    hooks: [],
    versions: [],
    audit_logs: [],
    security_preview: { summary: 'ok', risks: [], notes: [] },
  })) as typeof service.getInstallation;

  try {
    await service.rollback(currentUser, 'plugin-1', {
      change_note: '回滚到稳定版本',
      version_id: 'version-1',
    });

    assert.deepEqual(dispatchedRollbacks, [{ pluginId: 'plugin-1', versionId: 'version-1', version: '1.1.0' }]);
    const rollbackEvent = recordedEvents.find((event) => (event as { eventType?: string }).eventType === 'plugin.rolled_back') as {
      payloadJson?: { workflow_backend?: string; workflow_id?: string; workflow_run_id?: string };
    };
    assert.equal(rollbackEvent.payloadJson?.workflow_backend, 'TEMPORAL');
    assert.equal(rollbackEvent.payloadJson?.workflow_id, 'plugin-rollback-plugin-1-version-1');
    assert.equal(rollbackEvent.payloadJson?.workflow_run_id, 'run-1');
  } finally {
    service.getInstallation = getInstallation;
  }
});

test('rollback manifest sync prunes removed plugin hooks menus and tools while wiring hook generated tool code', async () => {
  const calls: Array<{ data?: Record<string, unknown>; model: string; op: string; where?: Record<string, unknown> }> = [];
  const recordedEvents: unknown[] = [];
  const rollbackManifest = {
    code: 'ticket-suite',
    name: '工单套件',
    version: '1.1.0',
    provider: '内部插件',
    risk_level: 'MEDIUM',
    permissions: ['plugin:ticket:view'],
    menus: [
      {
        code: 'dashboard',
        name: '插件看板',
        type: 'MENU',
        path: '/plugins/ticket-suite/dashboard',
        component: 'PluginDashboard',
      },
    ],
    hooks: [
      {
        code: 'ticket_created',
        name: '工单创建',
        type: 'EVENT',
        target: 'ticket.created',
        tool_code: 'create_ticket',
      },
    ],
    tools: [
      {
        code: 'create_ticket',
        name: '创建工单',
        method: 'POST',
        url: 'https://plugins.example.com/tools/create-ticket',
      },
    ],
  };
  const installation = {
    id: 'plugin-installation-1',
    tenantId: currentUser.tenantId,
    pluginId: 'plugin-1',
    installedVersion: '1.2.0',
    latestVersion: '1.2.0',
    manifestJson: {
      code: 'ticket-suite',
      version: '1.2.0',
      menus: [{ code: 'legacy' }],
      hooks: [{ code: 'legacy_hook' }],
      tools: [{ code: 'legacy_tool' }],
    },
    configJson: { enabled: true },
    riskLevel: 'MEDIUM',
    status: 'ACTIVE',
    runtimeStatus: 'RUNNING',
    enabledAt: null,
    disabledAt: null,
  };
  const service = new PluginsService(
    {
      pluginInstallation: {
        findFirst: async () => installation,
        update: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'pluginInstallation', op: 'update', ...args });
          return { ...installation, ...args.data };
        },
      },
      pluginVersion: {
        findFirst: async () => ({
          id: 'version-1',
          tenantId: currentUser.tenantId,
          pluginId: 'plugin-1',
          version: '1.1.0',
          status: 'PUBLISHED',
          manifestJson: rollbackManifest,
          changeNote: '稳定版本',
          publishedAt: new Date('2026-05-01T00:00:00Z'),
          createdAt: new Date('2026-05-01T00:00:00Z'),
          deletedAt: null,
          createdBy: currentUser.id,
        }),
        upsert: async (args: { create: Record<string, unknown>; update: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ data: args.update, model: 'pluginVersion', op: 'upsert', where: args.where });
          return args.create;
        },
      },
      plugin: {
        update: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'plugin', op: 'update', ...args });
          return { id: 'plugin-1', ...args.data };
        },
      },
      permission: { upsert: async () => ({}) },
      pluginHook: {
        upsert: async (args: { create: Record<string, unknown>; update: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ data: args.create, model: 'pluginHook', op: 'upsert', where: args.where });
          return args.create;
        },
        updateMany: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'pluginHook', op: 'updateMany', ...args });
          return { count: 1 };
        },
      },
      menu: {
        upsert: async (args: { create: Record<string, unknown>; update: Record<string, unknown>; where: Record<string, unknown> }) => {
          const code = (args.where.tenantId_code as { code: string }).code;
          calls.push({ data: args.create, model: 'menu', op: 'upsert', where: args.where });
          return { id: `menu-${code}`, code };
        },
        updateMany: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'menu', op: 'updateMany', ...args });
          return { count: 1 };
        },
      },
      pluginMenuBinding: {
        upsert: async (args: { create: Record<string, unknown>; update: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ data: args.create, model: 'pluginMenuBinding', op: 'upsert', where: args.where });
          return args.create;
        },
        updateMany: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'pluginMenuBinding', op: 'updateMany', ...args });
          return { count: 1 };
        },
      },
      tool: {
        upsert: async (args: { create: Record<string, unknown>; update: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ data: args.create, model: 'tool', op: 'upsert', where: args.where });
          return args.create;
        },
        updateMany: async (args: { data: Record<string, unknown>; where: Record<string, unknown> }) => {
          calls.push({ model: 'tool', op: 'updateMany', ...args });
          return { count: 1 };
        },
      },
      pluginAuditLog: { create: async (args: { data: Record<string, unknown> }) => {
        calls.push({ data: args.data, model: 'pluginAuditLog', op: 'create' });
        return args.data;
      } },
    } as never,
    {} as never,
    {
      recordEvent: (event: unknown) => {
        recordedEvents.push(event);
        return Promise.resolve(event);
      },
    } as never,
    { verifyPackage: async () => { throw new Error('rollback should not verify package'); } } as never,
  );
  const getInstallation = service.getInstallation.bind(service);
  service.getInstallation = (async () => ({
    id: installation.id,
    tenant_id: currentUser.tenantId,
    plugin_id: 'plugin-1',
    code: 'ticket-suite',
    name: '工单套件',
    provider: '内部插件',
    description: null,
    source_type: 'CUSTOM',
    installed_version: '1.1.0',
    latest_version: '1.1.0',
    status: 'INSTALLED',
    runtime_status: 'STOPPED',
    risk_level: 'MEDIUM',
    owner_id: currentUser.id,
    menu_count: 1,
    hook_count: 1,
    permission_count: 1,
    installed_at: null,
    last_upgraded_at: null,
    enabled_at: null,
    disabled_at: null,
    updated_at: new Date().toISOString(),
    manifest_json: rollbackManifest,
    config_json: null,
    permission_preview: ['plugin:ticket:view'],
    menu_bindings: [],
    hooks: [],
    versions: [],
    audit_logs: [],
    security_preview: { summary: 'ok', risks: [], notes: [] },
  })) as typeof service.getInstallation;

  try {
    await service.rollback(currentUser, 'plugin-1', {
      version_id: 'version-1',
    });

    const hookCreate = calls.find((call) => call.model === 'pluginHook' && call.op === 'upsert' && call.data?.code === 'ticket_created');
    assert.equal((hookCreate?.data?.configJson as { generated_tool_code?: string } | undefined)?.generated_tool_code, 'plugin_tool_ticket-suite_create_ticket');
    assert.ok(calls.some((call) => call.model === 'pluginHook' && call.op === 'updateMany' && (call.where?.code as { notIn?: string[] } | undefined)?.notIn?.includes('ticket_created')));
    assert.ok(calls.some((call) => call.model === 'pluginMenuBinding' && call.op === 'updateMany' && (call.where?.menuId as { notIn?: string[] } | undefined)?.notIn?.includes('menu-plugin_ticket-suite_dashboard')));
    assert.ok(calls.some((call) => call.model === 'menu' && call.op === 'updateMany' && (call.where?.code as { startsWith?: string; notIn?: string[] } | undefined)?.startsWith === 'plugin_ticket-suite_' && (call.where?.code as { notIn?: string[] } | undefined)?.notIn?.includes('plugin_ticket-suite_dashboard')));
    assert.ok(calls.some((call) => call.model === 'tool' && call.op === 'updateMany' && (call.where?.code as { startsWith?: string; notIn?: string[] } | undefined)?.startsWith === 'plugin_tool_ticket-suite_' && (call.where?.code as { notIn?: string[] } | undefined)?.notIn?.includes('plugin_tool_ticket-suite_create_ticket')));
  } finally {
    service.getInstallation = getInstallation;
  }
});
