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

function buildPrisma() {
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
        if (typeof eventType === 'object' && eventType.in?.includes('platform.security.approval_workbench.exported')) {
          return exportEvents;
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

function buildStorage() {
  return {
    listTenantObjects: async () => [],
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
