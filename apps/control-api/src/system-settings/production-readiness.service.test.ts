import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';

test('production readiness overview groups rollout checks without marking manual integrations ready', async () => {
  const { SystemSettingsService } = await import('./system-settings.service');
  const prisma = buildPrisma();
  const service = new SystemSettingsService(prisma as never);

  const overview = await service.getProductionReadinessOverview(buildUser());

  assert.equal(overview.categories.length, 5);
  assert.deepEqual(
    overview.categories.map((category) => category.category),
    ['ENVIRONMENT', 'EXTERNAL_SERVICE', 'THIRD_PARTY', 'RELEASE_VALIDATION', 'RISK'],
  );
  assert.equal(overview.summary.total_checks, overview.categories.flatMap((category) => category.items).length);
  assert.ok(overview.summary.manual_checks > 0);
  assert.ok(overview.summary.blocked_checks > 0);
  assert.ok(overview.generated_at);

  const allItems = overview.categories.flatMap((category) => category.items);
  assert.ok(allItems.some((item) => item.title === '生产环境变量模板'));
  assert.ok(allItems.some((item) => item.action_href === '/storage/settings'));
  assert.ok(allItems.some((item) => item.action_href === '/models'));
  assert.ok(allItems.some((item) => item.evidence.some((evidence) => evidence.includes('verify:prod-template'))));

  const externalItems = overview.categories.find((category) => category.category === 'EXTERNAL_SERVICE')?.items ?? [];
  assert.ok(externalItems.some((item) => item.title.includes('Qdrant')));
  assert.ok(externalItems.some((item) => item.title.includes('OpenSearch')));
  assert.ok(externalItems.every((item) => item.status !== 'READY'));
});

test('production readiness overview derives tenant counts from platform data', async () => {
  const { SystemSettingsService } = await import('./system-settings.service');
  const prisma = buildPrisma({
    counts: {
      activeModelProvider: 2,
      activeModelConfig: 3,
      modelApiKey: 2,
      activePublishChannel: 1,
      enabledTenantApiKey: 4,
      activeSecurityPolicy: 6,
      pendingKnowledgeTask: 0,
      failedKnowledgeTask: 1,
      qdrantSegment: 7,
      opensearchSegment: 5,
    },
  });
  const service = new SystemSettingsService(prisma as never);

  const overview = await service.getProductionReadinessOverview(buildUser());
  const allItems = overview.categories.flatMap((category) => category.items);
  const modelItem = allItems.find((item) => item.title === '模型供应商联调');
  const apiKeyItem = allItems.find((item) => item.title === '外部 API Key 调用');
  const knowledgeItem = allItems.find((item) => item.title === '知识库混合检索');

  assert.equal(modelItem?.status, 'MANUAL');
  assert.ok(modelItem?.evidence.includes('模型供应商 2 个，启用模型 3 个，密钥 2 个。'));
  assert.equal(apiKeyItem?.status, 'MANUAL');
  assert.ok(apiKeyItem?.evidence.includes('启用 API Key 4 个。'));
  assert.equal(knowledgeItem?.status, 'WARNING');
  assert.ok(knowledgeItem?.evidence.includes('Qdrant 片段 7 条，OpenSearch 片段 5 条。'));
  assert.ok(knowledgeItem?.evidence.includes('失败任务 1 个，待处理任务 0 个。'));
});

test('production readiness overview includes observability trace quality evidence in release validation', async () => {
  const { SystemSettingsService } = await import('./system-settings.service');
  const service = new SystemSettingsService(buildPrisma() as never);

  const overview = await service.getProductionReadinessOverview(buildUser());
  const releaseItems = overview.categories.find((category) => category.category === 'RELEASE_VALIDATION')?.items ?? [];
  const traceQualityItem = releaseItems.find((item) => item.id === 'observability-trace-quality');

  assert.ok(traceQualityItem);
  assert.equal(traceQualityItem.status, 'MANUAL');
  assert.equal(traceQualityItem.action_href, '/monitor/observability');
  assert.equal(traceQualityItem.observability_signal?.trace_coverage_label, 'Trace 覆盖率待在监控中心确认');
  assert.equal(traceQualityItem.observability_signal?.orphan_event_label, '孤立事件需为 0 或已有解释');
  assert.equal(traceQualityItem.observability_signal?.error_trace_label, '错误链路需完成归因');
  assert.equal(traceQualityItem.observability_signal?.slow_trace_label, '慢链路需完成阈值复核');
  assert.ok(traceQualityItem.evidence_summary?.includes('Trace 覆盖率'));
  assert.ok(traceQualityItem.evidence_summary?.includes('孤立事件'));
  assert.ok(traceQualityItem.evidence_summary?.includes('错误链路'));
  assert.ok(traceQualityItem.evidence_summary?.includes('慢链路'));
  assert.ok(traceQualityItem.evidence.some((evidence) => evidence.includes('/monitor/observability')));
});

test('production readiness overview blocks custom code plugin hooks without sandbox executor', async () => {
  const { SystemSettingsService } = await import('./system-settings.service');
  const previousExecutorUrl = process.env.PLUGIN_SANDBOX_EXECUTOR_URL;
  delete process.env.PLUGIN_SANDBOX_EXECUTOR_URL;
  const service = new SystemSettingsService(buildPrisma({
    counts: {
      customCodePluginHook: 2,
    },
  }) as never);

  try {
    const overview = await service.getProductionReadinessOverview(buildUser());
    const pluginSandboxItem = overview.categories
      .flatMap((category) => category.items)
      .find((item) => item.id === 'plugin-sandbox-executor');

    assert.equal(pluginSandboxItem?.status, 'BLOCKED');
    assert.equal(pluginSandboxItem?.severity, 'HIGH');
    assert.equal(pluginSandboxItem?.action_href, '/plugins/security');
    assert.ok(pluginSandboxItem?.evidence.some((evidence) => evidence.includes('代码型插件 Hook 2 个')));
    assert.ok(pluginSandboxItem?.evidence.some((evidence) => evidence.includes('PLUGIN_SANDBOX_EXECUTOR_URL 未配置')));
  } finally {
    restoreEnv('PLUGIN_SANDBOX_EXECUTOR_URL', previousExecutorUrl);
  }
});

test('production readiness overview marks custom code plugin sandbox executor as manual when configured', async () => {
  const { SystemSettingsService } = await import('./system-settings.service');
  const previousExecutorUrl = process.env.PLUGIN_SANDBOX_EXECUTOR_URL;
  process.env.PLUGIN_SANDBOX_EXECUTOR_URL = 'https://sandbox.example.com/execute';
  const service = new SystemSettingsService(buildPrisma({
    counts: {
      customCodePluginHook: 1,
    },
  }) as never);

  try {
    const overview = await service.getProductionReadinessOverview(buildUser());
    const pluginSandboxItem = overview.categories
      .flatMap((category) => category.items)
      .find((item) => item.id === 'plugin-sandbox-executor');

    assert.equal(pluginSandboxItem?.status, 'MANUAL');
    assert.equal(pluginSandboxItem?.severity, 'HIGH');
    assert.ok(pluginSandboxItem?.evidence.some((evidence) => evidence.includes('PLUGIN_SANDBOX_EXECUTOR_URL 已配置')));
  } finally {
    restoreEnv('PLUGIN_SANDBOX_EXECUTOR_URL', previousExecutorUrl);
  }
});

test('production readiness overview keeps plugin sandbox executor ready when no custom code hooks exist', async () => {
  const { SystemSettingsService } = await import('./system-settings.service');
  const previousExecutorUrl = process.env.PLUGIN_SANDBOX_EXECUTOR_URL;
  delete process.env.PLUGIN_SANDBOX_EXECUTOR_URL;
  const service = new SystemSettingsService(buildPrisma() as never);

  try {
    const overview = await service.getProductionReadinessOverview(buildUser());
    const pluginSandboxItem = overview.categories
      .flatMap((category) => category.items)
      .find((item) => item.id === 'plugin-sandbox-executor');

    assert.equal(pluginSandboxItem?.status, 'READY');
    assert.equal(pluginSandboxItem?.severity, 'MEDIUM');
    assert.ok(pluginSandboxItem?.evidence.some((evidence) => evidence.includes('当前未发现代码型插件 Hook')));
  } finally {
    restoreEnv('PLUGIN_SANDBOX_EXECUTOR_URL', previousExecutorUrl);
  }
});

test('production readiness overview attaches latest manual acceptance evidence per checklist item', async () => {
  const { SystemSettingsService } = await import('./system-settings.service');
  const prisma = buildPrisma({
    readinessEvents: [
      buildReadinessEvent({
        checkId: 'model-provider',
        title: '旧验收',
        note: '旧记录',
        occurredAt: new Date('2026-05-08T08:00:00.000Z'),
      }),
      buildReadinessEvent({
        checkId: 'model-provider',
        title: '模型供应商验收通过',
        note: '生产模型已完成一次真实调用。',
        occurredAt: new Date('2026-05-09T08:00:00.000Z'),
      }),
    ],
  });
  const service = new SystemSettingsService(prisma as never);

  const overview = await service.getProductionReadinessOverview(buildUser());
  const modelItem = overview.categories
    .flatMap((category) => category.items)
    .find((item) => item.id === 'model-provider');

  assert.equal(modelItem?.acceptance?.status, 'ACCEPTED');
  assert.equal(modelItem?.acceptance?.note, '生产模型已完成一次真实调用。');
  assert.equal(modelItem?.acceptance?.accepted_by?.name, '发布负责人');
  assert.equal(modelItem?.acceptance?.accepted_at, '2026-05-09T08:00:00.000Z');
});

test('acceptProductionReadinessCheck records manual acceptance as an approval audit event', async () => {
  const { SystemSettingsService } = await import('./system-settings.service');
  const writes: Array<{ data: Record<string, unknown> }> = [];
  const prisma = buildPrisma({ writes });
  const service = new SystemSettingsService(prisma as never);

  const result = await service.acceptProductionReadinessCheck(buildUser(), 'model-provider', {
    note: '生产模型已完成真实调用、限流和告警验证。',
  });

  assert.equal(result.check_id, 'model-provider');
  assert.equal(result.status, 'ACCEPTED');
  assert.equal(result.note, '生产模型已完成真实调用、限流和告警验证。');
  assert.equal(writes.length, 1);
  assert.equal(writes[0]?.data.tenantId, 'tenant-1');
  assert.equal(writes[0]?.data.sourceType, 'PRODUCTION_READINESS');
  assert.equal(writes[0]?.data.eventType, 'ACCEPTED');
  assert.equal(writes[0]?.data.eventStatus, 'SUCCESS');
  assert.equal(writes[0]?.data.actorId, 'user-1');
});

test('acceptProductionReadinessCheck rejects unknown check ids and blank notes', async () => {
  const { SystemSettingsService } = await import('./system-settings.service');
  const service = new SystemSettingsService(buildPrisma() as never);

  await assert.rejects(
    () => service.acceptProductionReadinessCheck(buildUser(), 'missing-check', { note: '已验收' }),
    /Production readiness check not found/,
  );
  await assert.rejects(
    () => service.acceptProductionReadinessCheck(buildUser(), 'model-provider', { note: '   ' }),
    /Acceptance note is required/,
  );
});

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    departmentId: 'dept-1',
    email: 'operator@example.test',
    roles: [],
    roleIds: [],
    permissions: [],
  };
}

function buildPrisma(
  input: {
    counts?: Partial<Record<CountKey, number>>;
    readinessEvents?: ReturnType<typeof buildReadinessEvent>[];
    writes?: Array<{ data: Record<string, unknown> }>;
  } = {},
) {
  const counts: Record<CountKey, number> = {
    activeModelProvider: 0,
    activeModelConfig: 0,
    modelApiKey: 0,
    activePublishChannel: 0,
    enabledTenantApiKey: 0,
    activeSecurityPolicy: 0,
    pendingKnowledgeTask: 2,
    failedKnowledgeTask: 0,
    qdrantSegment: 0,
    opensearchSegment: 0,
    customCodePluginHook: 0,
    ...input.counts,
  };

  return {
    modelProvider: {
      count: async () => counts.activeModelProvider,
    },
    modelConfig: {
      count: async () => counts.activeModelConfig,
    },
    modelApiKey: {
      count: async () => counts.modelApiKey,
    },
    agentPublishChannel: {
      count: async () => counts.activePublishChannel,
    },
    apiKey: {
      count: async () => counts.enabledTenantApiKey,
    },
    securityPolicy: {
      count: async () => counts.activeSecurityPolicy,
    },
    knowledgeEmbeddingTask: {
      count: async (args: { where?: { status?: { in?: string[] } | string } }) => {
        const status = args.where?.status;
        if (typeof status === 'string') return status === 'FAILED' ? counts.failedKnowledgeTask : counts.pendingKnowledgeTask;
        if (status?.in?.includes('FAILED')) return counts.failedKnowledgeTask;
        return counts.pendingKnowledgeTask;
      },
    },
    knowledgeSegment: {
      count: async (args: { where?: { metadata?: { path?: string[]; equals?: string } } }) => {
        const backend = args.where?.metadata?.equals;
        if (backend === 'QDRANT') return counts.qdrantSegment;
        if (backend === 'OPENSEARCH') return counts.opensearchSegment;
        return 0;
      },
    },
    pluginHook: {
      count: async () => counts.customCodePluginHook,
    },
    approvalAuditEvent: {
      findMany: async () => input.readinessEvents ?? [],
      create: async (args: { data: Record<string, unknown> }) => {
        input.writes?.push({ data: args.data });
        return buildReadinessEvent({
          checkId: String((args.data.metadata as { check_id?: string } | undefined)?.check_id ?? 'model-provider'),
          note: typeof args.data.note === 'string' ? args.data.note : null,
          title: typeof args.data.title === 'string' ? args.data.title : '生产验收已确认',
          occurredAt: new Date('2026-05-09T09:00:00.000Z'),
        });
      },
    },
  };
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

function buildReadinessEvent(input: {
  checkId: string;
  title?: string;
  note?: string | null;
  occurredAt?: Date;
}) {
  return {
    id: `event-${input.checkId}-${input.occurredAt?.getTime() ?? 1}`,
    tenantId: 'tenant-1',
    sourceType: 'PRODUCTION_READINESS',
    sourceId: '00000000-0000-0000-0000-000000000000',
    eventType: 'ACCEPTED',
    eventStatus: 'SUCCESS',
    title: input.title ?? '生产验收已确认',
    note: input.note ?? null,
    requestId: null,
    traceId: null,
    metadata: {
      check_id: input.checkId,
    },
    actorId: 'user-1',
    occurredAt: input.occurredAt ?? new Date('2026-05-09T08:00:00.000Z'),
    actor: {
      id: 'user-1',
      name: '发布负责人',
      email: 'operator@example.test',
    },
  };
}

type CountKey =
  | 'activeModelProvider'
  | 'activeModelConfig'
  | 'modelApiKey'
  | 'activePublishChannel'
  | 'enabledTenantApiKey'
  | 'activeSecurityPolicy'
  | 'pendingKnowledgeTask'
  | 'failedKnowledgeTask'
  | 'qdrantSegment'
  | 'opensearchSegment'
  | 'customCodePluginHook';
