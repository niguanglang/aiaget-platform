import assert from 'node:assert/strict';
import test from 'node:test';

import { SecurityCenterService } from './security-center.service';

test('getOverview surfaces approval workbench export metrics and operation alerts', async () => {
  const service = new SecurityCenterService(buildPrisma() as never, buildStorage() as never);
  stubOverviewDependencies(service);

  const overview = await service.getOverview(buildUser());
  const operations = overview.approval_operations;

  assert.equal(operations.approval_workbench_exports_24h, 12);
  assert.equal(operations.approval_workbench_exported_records_24h, 7_150);
  assert.equal(operations.approval_workbench_high_risk_exports_24h, 5);
  assert.equal(operations.approval_workbench_repeated_exports_24h, 8);
  assert.equal(operations.customer_success_close_won_report_archive_delete_pending, 1);
  assert.equal(operations.customer_success_close_won_report_archive_delete_approved, 0);
  assert.equal(operations.customer_success_close_won_report_archive_delete_rejected, 0);
  assert.equal(operations.customer_success_close_won_report_archive_delete_applied, 0);

  const alerts = new Map(operations.operational_alerts.map((alert) => [alert.id, alert]));

  assert.equal(alerts.get('approval-workbench-export-volume-risk')?.severity, 'HIGH');
  assert.equal(alerts.get('approval-workbench-export-volume-risk')?.metric, '12 次 / 7150 条');
  assert.equal(alerts.get('approval-workbench-export-volume-risk')?.status, 'OPEN');

  assert.equal(alerts.get('approval-workbench-export-high-risk-filter')?.severity, 'HIGH');
  assert.equal(alerts.get('approval-workbench-export-high-risk-filter')?.metric, '5 次高风险导出');

  assert.equal(alerts.get('approval-workbench-export-repeated-risk')?.severity, 'HIGH');
  assert.equal(alerts.get('approval-workbench-export-repeated-risk')?.metric, '8 次重复导出');

  assert.equal(alerts.get('customer-success-close-won-report-archive-delete-pending')?.severity, 'MEDIUM');
  assert.equal(alerts.get('customer-success-close-won-report-archive-delete-pending')?.metric, '1 个删除申请');

  assert.ok(overview.recent.security_denials.some((item) => item.source === 'APPROVAL_WORKBENCH'));
  assert.ok(overview.risks.some((item) => item.id === 'customer-success-close-won-report-archive-delete-pending-risk'));
});

test('operation alert notify and lifecycle actions persist approval workbench export alert events', async () => {
  const prisma = buildPrisma();
  const service = new SecurityCenterService(prisma as never, buildStorage() as never);
  stubOverviewDependencies(service);

  const notification = await service.notifyOperationAlert(buildUser(), 'approval-workbench-export-volume-risk', {
    channels: ['IN_APP'],
    note: '请安全管理员复核审批工作台导出。',
  });

  assert.equal(notification.status, 'SENT');
  assert.deepEqual(notification.channels, ['IN_APP']);
  assert.deepEqual(notification.targets, ['租户管理员', '安全管理员', '审计员']);
  assert.equal(notification.delivery_event_id, 'platform-create-1');
  assert.equal(prisma.createdEvents[0]?.data.eventType, 'platform.security.approval_operation_alert.notification_sent');
  assert.equal(prisma.createdEvents[0]?.data.resourceId, 'approval-workbench-export-volume-risk');
  assert.equal(prisma.createdEvents[0]?.data.payloadJson.alert_category, 'APPROVAL_WORKBENCH_EXPORT');
  assert.equal(prisma.createdEvents[0]?.data.payloadJson.status, 'SENT');

  const acknowledged = await service.updateOperationAlert(buildUser(), 'approval-workbench-export-volume-risk', {
    action: 'ACKNOWLEDGE',
    note: '已经安排审计员复核。',
  });

  assert.equal(acknowledged.status, 'ACKNOWLEDGED');
  assert.equal(acknowledged.last_action, 'ACKNOWLEDGE');
  assert.equal(prisma.createdEvents[1]?.data.eventType, 'platform.security.approval_operation_alert.acknowledged');
  assert.equal(prisma.createdEvents[1]?.data.payloadJson.note, '已经安排审计员复核。');

  const overviewAfterAction = await service.getOverview(buildUser());
  const alertAfterAction = overviewAfterAction.approval_operations.operational_alerts.find(
    (alert) => alert.id === 'approval-workbench-export-volume-risk',
  );

  assert.equal(alertAfterAction?.status, 'ACKNOWLEDGED');
  assert.equal(alertAfterAction?.last_action, 'ACKNOWLEDGE');
  assert.equal(alertAfterAction?.last_note, '已经安排审计员复核。');
});

test('operation alert notify and lifecycle actions persist archive approval source categories', async () => {
  const cases = [
    {
      alertId: 'sla-dead-letter-archive-delete-pending',
      category: 'SLA_DEAD_LETTER_ARCHIVE_DELETE',
      expectedTargets: ['安全管理员', '审计员'],
    },
    {
      alertId: 'agent-team-report-archive-delete-pending',
      category: 'AGENT_TEAM_REPORT_ARCHIVE_DELETE',
      expectedTargets: ['安全管理员', '审计员'],
    },
    {
      alertId: 'notification-task-recovery-audit-archive-delete-pending',
      category: 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE',
      expectedTargets: ['安全管理员', '审计员'],
    },
    {
      alertId: 'customer-success-close-won-report-archive-delete-pending',
      category: 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE',
      expectedTargets: ['安全管理员', '审计员'],
    },
  ];

  for (const item of cases) {
    const prisma = buildPrisma();
    const service = new SecurityCenterService(prisma as never, buildStorage() as never);
    stubOverviewDependencies(service);

    const notification = await service.notifyOperationAlert(buildUser(), item.alertId, {
      channels: ['IN_APP'],
      note: '请复核归档删除审批。',
    });

    assert.equal(notification.status, 'SENT');
    assert.deepEqual(notification.targets, item.expectedTargets);
    assert.equal(prisma.createdEvents[0]?.data.eventType, 'platform.security.approval_operation_alert.notification_sent');
    assert.equal(prisma.createdEvents[0]?.data.resourceId, item.alertId);
    assert.equal(prisma.createdEvents[0]?.data.payloadJson.alert_category, item.category);
    assert.equal(prisma.createdEvents[0]?.data.payloadJson.note, '请复核归档删除审批。');

    const closed = await service.updateOperationAlert(buildUser(), item.alertId, {
      action: 'CLOSE',
      note: '归档删除审批已处理。',
    });

    assert.equal(closed.status, 'CLOSED');
    assert.equal(closed.last_action, 'CLOSE');
    assert.equal(prisma.createdEvents[1]?.data.eventType, 'platform.security.approval_operation_alert.closed');
    assert.equal(prisma.createdEvents[1]?.data.payloadJson.alert_category, item.category);
  }
});

test('notification task recovery summaries preserve customer success archive delete as its own failure source', async () => {
  const prisma = buildPrisma({
    notificationTaskEvents: [
      buildNotificationTaskEvent('customer-success-auto-notify-failed', {
        status: 'FAILED',
        customer_success_close_won_report_archive_delete_notify_count: 2,
        failed_count: 2,
      }),
    ],
  });
  const service = new SecurityCenterService(prisma as never, buildStorage() as never);
  stubOverviewDependencies(service);

  const overview = await service.getOverview(buildUser());
  const suggestion = overview.approval_operations.notification_task_recovery_suggestions.find(
    (item) => item.failure_source === 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE',
  );

  assert.ok(suggestion);
  assert.equal(suggestion.customer_success_close_won_report_archive_delete_failed_count, 2);
  assert.match(suggestion.evidence, /客户成功复盘归档删除覆盖 2 条/);
});

test('operation alert notification audit filters and exports customer success source with Chinese labels', async () => {
  const prisma = buildPrisma({
    operationAlertNotificationEvents: [
      buildOperationAlertNotificationEvent('customer-success-notification', {
        alert_id: 'customer-success-close-won-report-archive-delete-pending',
        alert_category: 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE',
        status: 'SENT',
        message: '客户成功复盘归档删除等待审批通知已发送。',
      }),
      buildOperationAlertNotificationEvent('agent-team-notification', {
        alert_id: 'agent-team-report-archive-delete-pending',
        alert_category: 'AGENT_TEAM_REPORT_ARCHIVE_DELETE',
        status: 'SENT',
        message: '团队报告归档删除等待审批通知已发送。',
      }),
    ],
  });
  const service = new SecurityCenterService(prisma as never, buildStorage() as never);
  stubOverviewDependencies(service);

  const overview = await service.listOperationAlertNotifications(buildUser(), {
    alert_category: 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE',
  });

  assert.equal(overview.summary.total_count, 1);
  assert.equal(overview.items[0]?.alert_category, 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE');
  assert.equal(overview.items[0]?.alert_category_label, '客户成功复盘归档删除');

  const csv = await service.exportOperationAlertNotifications(buildUser(), {
    alert_category: 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE',
  });

  assert.match(csv, /客户成功复盘归档删除/);
  assert.doesNotMatch(csv, /团队报告归档删除等待审批通知已发送/);
});

test('operation alert notification archives preserve notification audit filter context', async () => {
  const prisma = buildPrisma();
  const storage = buildStorage([
    {
      key: 'audit-archives/security-operation-alert-notifications/customer-success.csv',
      relative_key: 'audit-archives/security-operation-alert-notifications/customer-success.csv',
      file_name: 'customer-success.csv',
      folder: 'audit-archives/security-operation-alert-notifications',
      size_bytes: 2048,
      etag: 'etag-customer-success',
      last_modified: '2026-05-08T08:08:00.000Z',
      metadata: {
        archive_type: 'security_operation_alert_notification_audit',
        status: 'SENT',
        alert_category: 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE',
        keyword: 'trace-customer',
      },
    },
  ]);
  const service = new SecurityCenterService(prisma as never, storage as never);
  stubOverviewDependencies(service);

  const archives = await service.listOperationAlertNotificationArchives(buildUser());

  assert.equal(archives.items[0]?.status_filter, 'SENT');
  assert.equal(archives.items[0]?.alert_category, 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE');
  assert.equal(archives.items[0]?.alert_category_label, '客户成功复盘归档删除');
  assert.equal(archives.items[0]?.keyword, 'trace-customer');

  const archive = archives.items[0];
  assert.ok(archive);

  const deletion = await service.deleteOperationAlertNotificationArchive(buildUser(), archive.id);

  assert.equal(deletion.approval_id, 'platform-create-1');
  assert.equal(prisma.createdEvents[0]?.data.payloadJson.archive_size_bytes, 2048);
  assert.equal(prisma.createdEvents[0]?.data.payloadJson.status_filter, 'SENT');
  assert.equal(
    prisma.createdEvents[0]?.data.payloadJson.alert_category,
    'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE',
  );
  assert.equal(prisma.createdEvents[0]?.data.payloadJson.alert_category_label, '客户成功复盘归档删除');
  assert.equal(prisma.createdEvents[0]?.data.payloadJson.keyword, 'trace-customer');

  const approvals = await service.listOperationAlertNotificationArchiveApprovals(buildUser());

  assert.equal(approvals[0]?.archive_size_bytes, 2048);
  assert.equal(approvals[0]?.status_filter, 'SENT');
  assert.equal(approvals[0]?.alert_category, 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE');
  assert.equal(approvals[0]?.alert_category_label, '客户成功复盘归档删除');
  assert.equal(approvals[0]?.keyword, 'trace-customer');

  const detail = await service.getOperationAlertNotificationArchiveApproval(buildUser(), approvals[0]!.id);

  assert.equal(detail.audit_timeline[0]?.status_filter, 'SENT');
  assert.equal(detail.audit_timeline[0]?.alert_category, 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE');
  assert.equal(detail.audit_timeline[0]?.alert_category_label, '客户成功复盘归档删除');
  assert.equal(detail.audit_timeline[0]?.keyword, 'trace-customer');
});

function stubOverviewDependencies(service: SecurityCenterService) {
  const target = service as unknown as {
    loadPolicyStats: () => Promise<unknown>;
    loadDataScopeStats: () => Promise<unknown>;
    loadResourceAclStats: () => Promise<unknown>;
    loadApprovalStats: () => Promise<unknown>;
    loadAuditStats: () => Promise<unknown>;
    loadMonitorStats: () => Promise<unknown>;
    loadRuntimeSecurityStats: () => Promise<unknown>;
    loadRecentEvaluations: () => Promise<unknown[]>;
    loadRecentAuditFailures: () => Promise<unknown[]>;
    loadRecentMonitorErrors: () => Promise<unknown[]>;
  };

  target.loadPolicyStats = async () => ({
    total: 2,
    active: 2,
    disabled: 0,
    deny: 1,
    allow: 1,
    evaluations: 0,
  });
  target.loadDataScopeStats = async () => ({
    roleCount: 2,
    configuredRoleCount: 2,
    total: 2,
    all: 0,
    tenant: 1,
    dept: 1,
    self: 0,
    custom: 0,
  });
  target.loadResourceAclStats = async () => ({
    total: 2,
    active: 2,
    disabled: 0,
    allow: 1,
    deny: 1,
  });
  target.loadApprovalStats = async () => ({
    pending: 0,
    approved: 0,
    rejected: 0,
    toolPending: 0,
    runtimePending: 0,
    testPending: 0,
    notificationPending: 0,
    notificationApproved: 0,
    notificationRejected: 0,
    notificationHighImpactPending: 0,
  });
  target.loadAuditStats = async () => ({
    loginTotal: 0,
    operationTotal: 0,
    securityEvents: 0,
    configChanges: 0,
    successRate: 100,
  });
  target.loadMonitorStats = async () => ({
    eventsTotal: 0,
    successRate: 100,
    failedEvents: 0,
    averageLatencyMs: 0,
    p95LatencyMs: 0,
    activeConversations: 0,
  });
  target.loadRuntimeSecurityStats = async () => ({
    securityPolicyDenials: 0,
    listDataScopeFilters: 2,
    resourceAclConditionChecks: 1,
  });
  target.loadRecentEvaluations = async () => [];
  target.loadRecentAuditFailures = async () => [];
  target.loadRecentMonitorErrors = async () => [];
}

function buildPrisma(input: {
  notificationTaskEvents?: ReturnType<typeof buildNotificationTaskEvent>[];
  operationAlertNotificationEvents?: ReturnType<typeof buildOperationAlertNotificationEvent>[];
} = {}) {
  const exportedAt = new Date('2026-05-08T08:00:00.000Z');
  const createdEvents: Array<{ data: PlatformEventData }> = [];
  const exportEvents = Array.from({ length: 12 }, (_, index) => ({
    id: `export-${index + 1}`,
    tenantId: 'tenant-1',
    userId: index < 6 ? 'user-1' : 'user-2',
    resourceType: 'SECURITY_APPROVAL_WORKBENCH',
    resourceId: 'approval-workbench',
    requestId: `request-${index + 1}`,
    traceId: `trace-${index + 1}`,
    eventSource: 'security_center',
    eventType: 'platform.security.approval_workbench.exported',
    status: 'SUCCESS',
    severity: 'INFO',
    summary: '统一安全审批工作台导出完成',
    payloadJson: {
      exported_count: index === 0 ? 1_200 : index === 1 ? 950 : 500,
      filter: highRiskFilter(index),
    },
    occurredAt: new Date(exportedAt.getTime() + index * 60_000),
    user: {
      id: index < 6 ? 'user-1' : 'user-2',
      name: index < 6 ? '安全管理员' : '审计员',
      email: index < 6 ? 'security@example.test' : 'audit@example.test',
    },
  }));

  const prisma = {
    createdEvents,
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
    operationLog: {
      findMany: async () => [],
    },
    securityPolicyEvaluation: {
      findMany: async () => [],
    },
    toolApprovalRequest: {
      count: async () => 0,
      findFirst: async () => null,
    },
    systemSettingSnapshot: {
      count: async () => 0,
      findFirst: async () => null,
    },
    approvalAuditEvent: {
      findMany: async (args: { where?: { sourceType?: string } }) => {
        if (args.where?.sourceType === 'AGENT_TEAM_RUN_REPORT_ARCHIVE') {
          return [
            {
              sourceId: 'team-report-request',
              eventType: 'DELETE_REQUESTED',
              occurredAt: new Date('2026-05-08T08:04:30.000Z'),
            },
          ];
        }
        if (args.where?.sourceType === 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE') {
          return [
            {
              sourceId: 'customer-success-report-request',
              eventType: 'DELETE_REQUESTED',
              occurredAt: new Date('2026-05-08T08:04:45.000Z'),
            },
          ];
        }
        return [];
      },
    },
    platformEvent: {
      findMany: async (args: { where?: { eventType?: string | { in?: string[] } }; include?: unknown }) => {
        const eventType = args.where?.eventType;
        if (typeof eventType === 'object' && eventType.in?.includes('platform.security.approval_operation_alert.acknowledged')) {
          return createdEvents
            .map((event) => event.data)
            .filter((event) => event.eventType === 'platform.security.approval_operation_alert.acknowledged');
        }
        if (eventType === 'platform.security.approval_workbench.exported') {
          return args.include ? exportEvents : exportEvents.map(({ user, ...event }) => event);
        }
        if (eventType === 'platform.security.approval_operation_alert.notification_sent') {
          return input.operationAlertNotificationEvents ?? [];
        }
        if (
          typeof eventType === 'object' &&
          eventType.in?.includes('platform.security.approval_operation_alert_notification_task.auto_notify_finished')
        ) {
          return input.notificationTaskEvents ?? [];
        }
        if (typeof eventType === 'object' && eventType.in?.includes('platform.security.approval_workbench.exported')) {
          return exportEvents;
        }
        if (
          typeof eventType === 'object' &&
          eventType.in?.includes('platform.security.approval_operation_alert_notification.archive.delete_requested')
        ) {
          return createdEvents
            .map((event, index) => buildCreatedPlatformEvent(index, event.data))
            .filter((event) => eventType.in?.includes(event.eventType));
        }
        if (
          typeof eventType === 'object' &&
          eventType.in?.includes('platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_requested')
        ) {
          return [
            buildPlatformArchiveDeleteEvent(
              'sla-request',
              'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_requested',
            ),
          ];
        }
        if (
          typeof eventType === 'object' &&
          eventType.in?.includes('platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested')
        ) {
          return [
            buildPlatformArchiveDeleteEvent(
              'recovery-request',
              'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested',
            ),
          ];
        }
        return [];
      },
      create: async (args: { data: PlatformEventData }) => {
        createdEvents.push(args);
        return {
          id: `platform-create-${createdEvents.length}`,
          ...args.data,
        };
      },
    },
    systemSetting: {
      findFirst: async () => null,
      findMany: async () => [],
    },
    securityEvent: {
      findMany: async () => [],
    },
  };

  return prisma;
}

function buildOperationAlertNotificationEvent(id: string, payload: Record<string, unknown>) {
  return {
    id,
    tenantId: 'tenant-1',
    userId: 'user-1',
    resourceType: 'security_operation_alert',
    resourceId: typeof payload.alert_id === 'string' ? payload.alert_id : id,
    requestId: `request-${id}`,
    traceId: `trace-${id}`,
    eventSource: 'security_center',
    eventType: 'platform.security.approval_operation_alert.notification_sent',
    status: payload.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
    severity: payload.status === 'FAILED' ? 'WARN' : 'INFO',
    summary: typeof payload.message === 'string' ? payload.message : '审批与归档告警通知已发送',
    payloadJson: {
      channels: ['IN_APP'],
      targets: ['安全管理员'],
      delivered_at: '2026-05-08T08:01:00.000Z',
      retry_count: 0,
      ...payload,
    },
    occurredAt: new Date('2026-05-08T08:01:00.000Z'),
    createdAt: new Date('2026-05-08T08:01:00.000Z'),
  };
}

function buildNotificationTaskEvent(id: string, payload: Record<string, unknown>) {
  return {
    id,
    tenantId: 'tenant-1',
    userId: null,
    resourceType: 'security_operation_alert_notification_task',
    resourceId: 'auto_notify',
    requestId: `request-${id}`,
    traceId: `trace-${id}`,
    eventSource: 'security_center',
    eventType: 'platform.security.approval_operation_alert_notification_task.auto_notify_finished',
    status: payload.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
    severity: payload.status === 'FAILED' ? 'WARN' : 'INFO',
    summary: '审批与归档告警自动通知完成',
    payloadJson: {
      task: 'AUTO_NOTIFY',
      scanned_count: 2,
      notified_count: 2,
      success_count: 0,
      skipped_count: 0,
      started_at: '2026-05-08T08:00:00.000Z',
      finished_at: '2026-05-08T08:01:00.000Z',
      ...payload,
    },
    occurredAt: new Date('2026-05-08T08:01:00.000Z'),
    createdAt: new Date('2026-05-08T08:01:00.000Z'),
  };
}

type PlatformEventData = {
  eventType: string;
  resourceId?: string | null;
  payloadJson: Record<string, unknown>;
  status?: string;
} & Record<string, unknown>;

function highRiskFilter(index: number) {
  if (index < 3) return { status: 'PENDING' };
  if (index === 3) return { risk_domain: 'AUDIT_ARCHIVE' };
  if (index === 4) return { type: 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE' };
  return { status: 'APPROVED' };
}

function buildPlatformArchiveDeleteEvent(sourceId: string, eventType: string) {
  return {
    sourceId,
    eventType,
    occurredAt: new Date('2026-05-08T08:04:00.000Z'),
  };
}

function buildCreatedPlatformEvent(index: number, data: PlatformEventData) {
  return {
    id: `platform-create-${index + 1}`,
    ...data,
    user: data.userId
      ? {
          id: data.userId,
          name: '安全管理员',
          email: 'security@example.test',
        }
      : null,
    createdAt: data.occurredAt,
  };
}

function buildStorage(initialObjects: Array<Record<string, unknown>> = []) {
  const objects = [...initialObjects];

  return {
    listTenantObjects: async (input: { prefix: string }) =>
      objects.filter((item) => typeof item.key === 'string' && item.key.startsWith(input.prefix)),
    putTenantObject: async (input: {
      key: string;
      body: Buffer | string;
      metadata?: Record<string, string>;
    }) => {
      const item = {
        key: input.key,
        relative_key: input.key,
        file_name: input.key.split('/').at(-1) ?? input.key,
        folder: input.key.split('/').slice(0, -1).join('/'),
        size_bytes: typeof input.body === 'string' ? Buffer.byteLength(input.body) : input.body.byteLength,
        etag: 'etag-created',
        last_modified: '2026-05-08T08:09:00.000Z',
        metadata: input.metadata ?? {},
      };
      objects.push(item);
      return item;
    },
    getTenantObjectInfo: async (_tenantId: string, key: string) => {
      const item = objects.find((object) => object.key === key);
      if (!item) throw new Error(`missing object: ${key}`);
      return item;
    },
    deleteTenantObject: async () => ({ success: true }),
  };
}

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    departmentId: 'department-1',
    email: 'security@example.test',
    roles: [],
    permissions: ['security:rule:view'],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}
