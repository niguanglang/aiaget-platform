import assert from 'node:assert/strict';
import test from 'node:test';

import { SecurityOperationAlertNotificationTaskService } from './security-operation-alert-notification-task.service';

test('runAutoNotify sends focused archive approval alerts and records source counters', async () => {
  const prisma = buildPrisma();
  const securityCenter = buildSecurityCenter({
    alerts: [
      buildAlert('sla-dead-letter-archive-delete-pending', 'SLA 死信归档删除等待审批'),
      buildAlert('agent-team-report-archive-delete-pending', '团队报告归档删除等待审批'),
      buildAlert('notification-task-recovery-audit-archive-delete-pending', '自愈审计归档删除等待审批'),
      buildAlert('approval-workbench-export-volume-risk', '审批工作台导出量偏高'),
    ],
  });
  const service = new SecurityOperationAlertNotificationTaskService(prisma as never, securityCenter as never);

  const result = await service.runAutoNotify(buildUser());

  assert.equal(result.task, 'AUTO_NOTIFY');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.scanned_count, 3);
  assert.equal(result.notified_count, 3);
  assert.equal(result.success_count, 3);
  assert.equal(result.sla_dead_letter_notify_count, 1);
  assert.equal(result.agent_team_report_archive_delete_notify_count, 1);
  assert.equal(result.recovery_archive_delete_notify_count, 1);
  assert.deepEqual(securityCenter.notifiedAlertIds, [
    'sla-dead-letter-archive-delete-pending',
    'agent-team-report-archive-delete-pending',
    'notification-task-recovery-audit-archive-delete-pending',
  ]);
  assert.equal(prisma.createdEvents.at(-1)?.data.eventType, 'platform.security.approval_operation_alert_notification_task.manual_auto_notify');
  assert.equal(prisma.createdEvents.at(-1)?.data.payloadJson.sla_dead_letter_notify_count, 1);
  assert.equal(prisma.createdEvents.at(-1)?.data.payloadJson.agent_team_report_archive_delete_notify_count, 1);
  assert.equal(prisma.createdEvents.at(-1)?.data.payloadJson.recovery_archive_delete_notify_count, 1);
});

test('runAutoRetry retries old failed notifications within policy and skips backoff protected items', async () => {
  const prisma = buildPrisma({
    settings: [
      { key: 'alert_notification_auto_retry_enabled', value: true },
      { key: 'alert_notification_retry_backoff_seconds', value: 60 },
      { key: 'alert_notification_max_retry_count', value: 3 },
      { key: 'alert_notification_retry_batch_size', value: 5 },
      { key: 'alert_notification_lookback_hours', value: 24 },
    ],
  });
  const securityCenter = buildSecurityCenter({
    notifications: [
      buildNotification('failed-old', 'FAILED', { deliveredAt: minutesAgo(10), retryCount: 0 }),
      buildNotification('partial-old', 'PARTIAL', { deliveredAt: minutesAgo(8), retryCount: 1 }),
      buildNotification('failed-recent', 'FAILED', { deliveredAt: secondsAgo(10), retryCount: 0 }),
      buildNotification('failed-exhausted', 'FAILED', { deliveredAt: minutesAgo(30), retryCount: 3 }),
    ],
  });
  const service = new SecurityOperationAlertNotificationTaskService(prisma as never, securityCenter as never);

  const result = await service.runAutoRetry(buildUser());

  assert.equal(result.task, 'AUTO_RETRY');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.scanned_count, 2);
  assert.equal(result.retried_count, 2);
  assert.equal(result.success_count, 2);
  assert.deepEqual(securityCenter.retriedNotificationIds, ['failed-old', 'partial-old']);
  assert.equal(prisma.createdEvents.at(-1)?.data.eventType, 'platform.security.approval_operation_alert_notification_task.manual_auto_retry');
  assert.equal(prisma.createdEvents.at(-1)?.data.payloadJson.retried_count, 2);
});

test('runAutoNotify skips archive alerts that already have recent notifications', async () => {
  const prisma = buildPrisma();
  const securityCenter = buildSecurityCenter({
    alerts: [
      buildAlert('sla-dead-letter-archive-delete-pending', 'SLA 死信归档删除等待审批'),
      buildAlert('agent-team-report-archive-delete-pending', '团队报告归档删除等待审批'),
    ],
    notifications: [
      buildNotification('existing-sla-notification', 'SENT', {
        alertId: 'sla-dead-letter-archive-delete-pending',
        deliveredAt: minutesAgo(5),
        retryCount: 0,
      }),
    ],
  });
  const service = new SecurityOperationAlertNotificationTaskService(prisma as never, securityCenter as never);

  const result = await service.runAutoNotify(buildUser());

  assert.equal(result.task, 'AUTO_NOTIFY');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.scanned_count, 1);
  assert.equal(result.notified_count, 1);
  assert.deepEqual(securityCenter.notifiedAlertIds, ['agent-team-report-archive-delete-pending']);
});

test('runAutoNotify records failed task result when notification delivery fails', async () => {
  const prisma = buildPrisma();
  const securityCenter = buildSecurityCenter({
    alerts: [buildAlert('notification-task-recovery-audit-archive-delete-pending', '自愈审计归档删除等待审批')],
    notifyResults: {
      'notification-task-recovery-audit-archive-delete-pending': 'FAILED',
    },
  });
  const service = new SecurityOperationAlertNotificationTaskService(prisma as never, securityCenter as never);

  const result = await service.runAutoNotify(buildUser());

  assert.equal(result.task, 'AUTO_NOTIFY');
  assert.equal(result.status, 'FAILED');
  assert.equal(result.scanned_count, 1);
  assert.equal(result.notified_count, 1);
  assert.equal(result.failed_count, 1);
  assert.equal(result.recovery_archive_delete_notify_count, 1);
  assert.equal(prisma.createdEvents.at(-2)?.data.eventType, 'platform.security.approval_operation_alert_notification_task.auto_notify_finished');
  assert.equal(prisma.createdEvents.at(-2)?.data.status, 'FAILED');
  assert.equal(prisma.createdEvents.at(-1)?.data.eventType, 'platform.security.approval_operation_alert_notification_task.manual_auto_notify');
  assert.equal(prisma.createdEvents.at(-1)?.data.status, 'FAILED');
});

test('runAutoNotify classifies mixed failure source alerts for all archive approval domains', async () => {
  const prisma = buildPrisma();
  const securityCenter = buildSecurityCenter({
    alerts: [
      buildAlert('operation-alert-notification-task-mixed-failure-source', '多来源通知任务失败'),
    ],
  });
  const service = new SecurityOperationAlertNotificationTaskService(prisma as never, securityCenter as never);

  const result = await service.runAutoNotify(buildUser());

  assert.equal(result.task, 'AUTO_NOTIFY');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.scanned_count, 1);
  assert.equal(result.notified_count, 1);
  assert.equal(result.sla_dead_letter_notify_count, 1);
  assert.equal(result.agent_team_report_archive_delete_notify_count, 1);
  assert.equal(result.recovery_archive_delete_notify_count, 1);
  assert.deepEqual(securityCenter.notifiedAlertIds, ['operation-alert-notification-task-mixed-failure-source']);
});

function buildPrisma(input: { settings?: Array<{ key: string; value: unknown }> } = {}) {
  const createdEvents: Array<{ data: PlatformEventData }> = [];

  return {
    createdEvents,
    systemSetting: {
      findMany: async () => input.settings ?? [],
    },
    platformEvent: {
      create: async (args: { data: PlatformEventData }) => {
        createdEvents.push(args);
        return {
          id: `task-event-${createdEvents.length}`,
          ...args.data,
        };
      },
    },
  };
}

type PlatformEventData = {
  eventType: string;
  status?: string;
  payloadJson: Record<string, unknown>;
} & Record<string, unknown>;

function buildSecurityCenter(input: {
  alerts?: ReturnType<typeof buildAlert>[];
  notifications?: ReturnType<typeof buildNotification>[];
  notifyResults?: Record<string, 'SENT' | 'FAILED' | 'SKIPPED'>;
} = {}) {
  const notifiedAlertIds: string[] = [];
  const retriedNotificationIds: string[] = [];

  return {
    notifiedAlertIds,
    retriedNotificationIds,
    listCurrentOperationAlerts: async () => input.alerts ?? [],
    listOperationAlertNotifications: async () => ({
      generated_at: new Date().toISOString(),
      summary: {
        total_count: input.notifications?.length ?? 0,
        sent_count: 0,
        partial_count: input.notifications?.filter((item) => item.status === 'PARTIAL').length ?? 0,
        skipped_count: 0,
        failed_count: input.notifications?.filter((item) => item.status === 'FAILED').length ?? 0,
        retryable_count: 0,
      },
      items: input.notifications ?? [],
    }),
    notifyOperationAlert: async (_user: unknown, alertId: string) => {
      notifiedAlertIds.push(alertId);
      const status = input.notifyResults?.[alertId] ?? 'SENT';
      return {
        alert_id: alertId,
        status,
        channels: ['IN_APP', 'WEBHOOK'],
        targets: ['安全管理员'],
        delivery_event_id: `delivery-${alertId}`,
        webhook_status: status === 'FAILED' ? 'FAILED' : null,
        message: status === 'FAILED' ? '审批与归档告警通知发送失败。' : '审批与归档告警通知已发送。',
        delivered_at: new Date().toISOString(),
      };
    },
    retryOperationAlertNotification: async (_user: unknown, notificationEventId: string) => {
      retriedNotificationIds.push(notificationEventId);
      return {
        alert_id: 'sla-dead-letter-archive-delete-pending',
        status: 'SENT',
        channels: ['IN_APP'],
        targets: ['安全管理员'],
        delivery_event_id: `retry-${notificationEventId}`,
        webhook_status: null,
        message: '审批与归档告警通知已重试。',
        delivered_at: new Date().toISOString(),
      };
    },
  };
}

function buildAlert(id: string, title: string) {
  return {
    id,
    title,
    description: title,
    severity: 'HIGH',
    href: '/security',
    metric: '1 个',
    action_label: '处理',
    status: 'OPEN',
    last_action: null,
    last_note: null,
    updated_at: null,
    triggered_at: minutesAgo(30),
  };
}

function buildNotification(
  notificationEventId: string,
  status: 'FAILED' | 'PARTIAL' | 'SENT' | 'SKIPPED',
  input: { alertId?: string; deliveredAt: string; retryCount: number },
) {
  return {
    alert_id: input.alertId ?? 'sla-dead-letter-archive-delete-pending',
    status,
    channels: ['IN_APP'],
    targets: ['安全管理员'],
    delivery_event_id: notificationEventId,
    webhook_status: null,
    message: '通知投递失败。',
    delivered_at: input.deliveredAt,
    notification_event_id: notificationEventId,
    alert_category: 'SLA_DEAD_LETTER_ARCHIVE_DELETE',
    webhook_error: status === 'FAILED' ? 'timeout' : null,
    retry_count: input.retryCount,
    retried_from_event_id: null,
    request_id: `request-${notificationEventId}`,
    trace_id: `trace-${notificationEventId}`,
    created_at: input.deliveredAt,
  };
}

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'security@example.test',
    roles: [],
    permissions: ['security:rule:view'],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function secondsAgo(seconds: number) {
  return new Date(Date.now() - seconds * 1000).toISOString();
}
