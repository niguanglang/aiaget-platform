import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  SecurityCenterOperationalAlert,
  SecurityOperationAlertNotificationItem,
  SecurityOperationAlertNotificationTaskOverview,
  SecurityOperationAlertNotificationTaskRunOverview,
  SecurityOperationAlertNotificationTaskRunResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityCenterService } from './security-center.service';

const ENV_POLICY = {
  autoNotifyEnabled: process.env.SECURITY_OPERATION_ALERT_AUTO_NOTIFY_ENABLED !== 'false',
  autoNotifyIntervalMs: clampInteger(
    process.env.SECURITY_OPERATION_ALERT_AUTO_NOTIFY_INTERVAL_MS,
    10_000,
    3_600_000,
    60_000,
  ),
  autoNotifyBatchSize: clampInteger(process.env.SECURITY_OPERATION_ALERT_AUTO_NOTIFY_BATCH_SIZE, 1, 30, 8),
  autoRetryEnabled: process.env.SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_ENABLED !== 'false',
  retryIntervalMs: clampInteger(process.env.SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_INTERVAL_MS, 10_000, 3_600_000, 60_000),
  retryBatchSize: clampInteger(process.env.SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_BATCH_SIZE, 1, 30, 8),
  maxRetryCount: clampInteger(process.env.SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_MAX_RETRY_COUNT, 1, 10, 3),
  retryBackoffSeconds: clampInteger(process.env.SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_BACKOFF_SECONDS, 1, 3600, 60),
  lookbackHours: clampInteger(process.env.SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_LOOKBACK_HOURS, 1, 720, 24),
  source: 'ENVIRONMENT' as const,
};
const TASK_REQUEST_ID_PREFIX = 'security_operation_alert_notification_task';
const AUTO_NOTIFY_ALERT_IDS = new Set([
  'sla-dead-letter-archive-delete-pending',
  'sla-dead-letter-archive-delete-rejected-risk',
  'agent-team-report-archive-delete-pending',
  'agent-team-report-archive-delete-rejected-risk',
  'notification-task-recovery-audit-archive-delete-pending',
  'notification-task-recovery-audit-archive-delete-rejected-risk',
  'operation-alert-notification-task-sla-dead-letter-failure-source',
  'operation-alert-notification-task-agent-team-report-archive-failure-source',
  'operation-alert-notification-task-recovery-archive-failure-source',
  'operation-alert-notification-task-mixed-failure-source',
]);
const SLA_DEAD_LETTER_AUTO_NOTIFY_ALERT_IDS = new Set([
  'sla-dead-letter-archive-delete-pending',
  'sla-dead-letter-archive-delete-rejected-risk',
  'operation-alert-notification-task-sla-dead-letter-failure-source',
  'operation-alert-notification-task-mixed-failure-source',
]);
const AGENT_TEAM_REPORT_ARCHIVE_DELETE_AUTO_NOTIFY_ALERT_IDS = new Set([
  'agent-team-report-archive-delete-pending',
  'agent-team-report-archive-delete-rejected-risk',
  'operation-alert-notification-task-agent-team-report-archive-failure-source',
  'operation-alert-notification-task-mixed-failure-source',
]);
const RECOVERY_ARCHIVE_DELETE_AUTO_NOTIFY_ALERT_IDS = new Set([
  'notification-task-recovery-audit-archive-delete-pending',
  'notification-task-recovery-audit-archive-delete-rejected-risk',
  'operation-alert-notification-task-recovery-archive-failure-source',
  'operation-alert-notification-task-mixed-failure-source',
]);
const TASK_EVENT_TYPES = [
  'platform.security.approval_operation_alert_notification_task.manual_auto_notify',
  'platform.security.approval_operation_alert_notification_task.auto_notify_finished',
  'platform.security.approval_operation_alert_notification_task.manual_auto_retry',
  'platform.security.approval_operation_alert_notification_task.auto_retry_finished',
] as const;

interface NotificationRetryPolicy {
  autoNotifyEnabled: boolean;
  autoNotifyIntervalMs: number;
  autoNotifyBatchSize: number;
  autoRetryEnabled: boolean;
  retryIntervalMs: number;
  retryBatchSize: number;
  maxRetryCount: number;
  retryBackoffSeconds: number;
  lookbackHours: number;
  source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
}

@Injectable()
export class SecurityOperationAlertNotificationTaskService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SecurityOperationAlertNotificationTaskService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastTickAt: Date | null = null;
  private lastAutoNotifyResult: SecurityOperationAlertNotificationTaskRunResult | null = null;
  private lastAutoRetryResult: SecurityOperationAlertNotificationTaskRunResult | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SecurityCenterService) private readonly securityCenter: SecurityCenterService,
  ) {}

  onModuleInit() {
    if (!ENV_POLICY.autoNotifyEnabled && !ENV_POLICY.autoRetryEnabled) return;

    this.timer = setInterval(() => {
      void this.runScheduledTick().catch((error) => {
        const message = error instanceof Error ? error.message : '审批与归档告警通知自动重试任务失败。';
        this.logger.warn(message);
      });
    }, Math.min(ENV_POLICY.autoNotifyIntervalMs, ENV_POLICY.retryIntervalMs));
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async getOverview(currentUser: AuthenticatedUser): Promise<SecurityOperationAlertNotificationTaskOverview> {
    const policy = await this.loadPolicy(currentUser.tenantId);
    const notifications = await this.loadRecentNotificationItems(currentUser.tenantId, policy);
    const autoNotifyAlerts = await this.loadAutoNotifyAlerts(currentUser.tenantId, policy);
    const retryable = eligibleRetryNotifications(notifications, policy);
    const notifiedAlertIds = new Set(
      notifications.filter((item) => AUTO_NOTIFY_ALERT_IDS.has(item.alert_id)).map((item) => item.alert_id),
    );
    const oldestAutoNotify = autoNotifyAlerts
      .map((alert) => alert.triggered_at)
      .sort((left, right) => Date.parse(left) - Date.parse(right))[0];
    const oldestRetryable = retryable
      .map((item) => item.delivered_at)
      .sort((left, right) => Date.parse(left) - Date.parse(right))[0];

    return {
      generated_at: new Date().toISOString(),
      scheduler_enabled: policy.autoNotifyEnabled || policy.autoRetryEnabled,
      running: this.running,
      last_tick_at: this.lastTickAt?.toISOString() ?? null,
      next_tick_after_seconds:
        policy.autoNotifyEnabled || policy.autoRetryEnabled
          ? Math.ceil(Math.min(policy.autoNotifyIntervalMs, policy.retryIntervalMs) / 1000)
          : null,
      policy: mapPolicy(policy),
      summary: {
        pending_auto_notify_count: autoNotifyAlerts.length,
        auto_notified_count: notifiedAlertIds.size,
        oldest_auto_notify_at: oldestAutoNotify ?? null,
        pending_auto_retry_count: retryable.length,
        failed_notification_count: notifications.filter((item) => item.status === 'FAILED').length,
        partial_notification_count: notifications.filter((item) => item.status === 'PARTIAL').length,
        retried_notification_count: notifications.filter((item) => item.retry_count > 0 || item.retried_from_event_id).length,
        oldest_retryable_at: oldestRetryable ?? null,
      },
      last_auto_notify_result: this.lastAutoNotifyResult,
      last_auto_retry_result: this.lastAutoRetryResult,
    };
  }

  async runAutoNotify(currentUser: AuthenticatedUser): Promise<SecurityOperationAlertNotificationTaskRunResult> {
    const result = await this.runAutoNotifyForTenant(currentUser.tenantId, buildRequestId('manual_notify'));
    await this.recordTaskEvent(
      currentUser.tenantId,
      currentUser.id,
      'platform.security.approval_operation_alert_notification_task.manual_auto_notify',
      result,
      currentUser.requestId ?? null,
      currentUser.traceId ?? null,
    );

    return result;
  }

  async runAutoRetry(currentUser: AuthenticatedUser): Promise<SecurityOperationAlertNotificationTaskRunResult> {
    const result = await this.runAutoRetryForTenant(currentUser.tenantId, buildRequestId('manual_retry'));
    await this.recordTaskEvent(
      currentUser.tenantId,
      currentUser.id,
      'platform.security.approval_operation_alert_notification_task.manual_auto_retry',
      result,
      currentUser.requestId ?? null,
      currentUser.traceId ?? null,
    );

    return result;
  }

  async listRuns(
    currentUser: AuthenticatedUser,
    query: {
      task?: 'AUTO_NOTIFY' | 'AUTO_RETRY';
      status?: 'SUCCESS' | 'FAILED' | 'SKIPPED';
      keyword?: string;
    },
  ): Promise<SecurityOperationAlertNotificationTaskRunOverview> {
    const keyword = query.keyword?.trim().toLowerCase();
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        resourceType: 'security_operation_alert_notification_task',
        eventSource: 'security_center',
        eventType: {
          in: [...TASK_EVENT_TYPES],
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 100,
    });
    const items = events
      .filter((event) => !isManualFinishedDuplicate(event))
      .map(mapTaskRunEvent)
      .filter((item) => !query.task || item.task === query.task)
      .filter((item) => !query.status || item.status === query.status)
      .filter((item) => {
        if (!keyword) return true;

        return [
          item.event_id,
          item.event_type,
          item.task,
          item.status,
          item.trigger_type,
          item.request_id,
          item.trace_id,
          item.summary,
          item.error_message,
        ].some((value) => value?.toLowerCase().includes(keyword));
      });

    return {
      generated_at: new Date().toISOString(),
      summary: buildTaskRunSummary(items),
      items,
    };
  }

  private async runScheduledTick() {
    if (this.running) return;

    this.running = true;
    this.lastTickAt = new Date();
    try {
      const tenants = await this.prisma.tenant.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      for (const tenant of tenants) {
        const policy = await this.loadPolicy(tenant.id);
        if (policy.autoNotifyEnabled) {
          this.lastAutoNotifyResult = await this.runAutoNotifyForTenant(tenant.id, buildRequestId('scheduled_notify'));
        }
        if (policy.autoRetryEnabled) {
          this.lastAutoRetryResult = await this.runAutoRetryForTenant(tenant.id, buildRequestId('scheduled_retry'));
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async runAutoNotifyForTenant(
    tenantId: string,
    requestId: string,
  ): Promise<SecurityOperationAlertNotificationTaskRunResult> {
    const startedAt = new Date();
    const policy = await this.loadPolicy(tenantId);
    if (!policy.autoNotifyEnabled) {
      return this.storeAutoNotifyResult(buildTaskResult('AUTO_NOTIFY', startedAt, { skipped_count: 1 }));
    }

    const alerts = (await this.loadAutoNotifyAlerts(tenantId, policy)).slice(0, policy.autoNotifyBatchSize);
    if (alerts.length === 0) {
      return this.storeAutoNotifyResult(buildTaskResult('AUTO_NOTIFY', startedAt));
    }

    let notifiedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let slaDeadLetterNotifyCount = 0;
    let agentTeamReportArchiveDeleteNotifyCount = 0;
    let recoveryArchiveDeleteNotifyCount = 0;
    let errorMessage: string | null = null;

    for (const alert of alerts) {
      try {
        const result = await this.securityCenter.notifyOperationAlert(buildSystemUser(tenantId, requestId), alert.id, {
          channels: ['IN_APP', 'WEBHOOK'],
          note: 'SLA 死信、团队报告与自愈归档删除审批运营告警自动通知',
        });
        notifiedCount += 1;
        if (SLA_DEAD_LETTER_AUTO_NOTIFY_ALERT_IDS.has(alert.id)) {
          slaDeadLetterNotifyCount += 1;
        }
        if (AGENT_TEAM_REPORT_ARCHIVE_DELETE_AUTO_NOTIFY_ALERT_IDS.has(alert.id)) {
          agentTeamReportArchiveDeleteNotifyCount += 1;
        }
        if (RECOVERY_ARCHIVE_DELETE_AUTO_NOTIFY_ALERT_IDS.has(alert.id)) {
          recoveryArchiveDeleteNotifyCount += 1;
        }
        if (result.status === 'FAILED') {
          failedCount += 1;
        } else if (result.status === 'SKIPPED') {
          skippedCount += 1;
        } else {
          successCount += 1;
        }
      } catch (error) {
        failedCount += 1;
        errorMessage =
          errorMessage ??
          (error instanceof Error ? error.message : 'SLA 死信、团队报告与自愈归档删除审批运营告警自动通知失败。');
      }
    }

    const result = buildTaskResult('AUTO_NOTIFY', startedAt, {
      scanned_count: alerts.length,
      notified_count: notifiedCount,
      sla_dead_letter_notify_count: slaDeadLetterNotifyCount,
      agent_team_report_archive_delete_notify_count: agentTeamReportArchiveDeleteNotifyCount,
      recovery_archive_delete_notify_count: recoveryArchiveDeleteNotifyCount,
      success_count: successCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      error_message: errorMessage,
    });
    await this.recordTaskEvent(
      tenantId,
      null,
      'platform.security.approval_operation_alert_notification_task.auto_notify_finished',
      result,
      requestId,
      null,
    );

    return this.storeAutoNotifyResult(result);
  }

  private async runAutoRetryForTenant(
    tenantId: string,
    requestId: string,
  ): Promise<SecurityOperationAlertNotificationTaskRunResult> {
    const startedAt = new Date();
    const policy = await this.loadPolicy(tenantId);
    if (!policy.autoRetryEnabled) {
      return this.storeAutoRetryResult(buildTaskResult('AUTO_RETRY', startedAt, { skipped_count: 1 }));
    }

    const notifications = await this.loadRecentNotificationItems(tenantId, policy);
    const retryable = eligibleRetryNotifications(notifications, policy).slice(0, policy.retryBatchSize);
    if (retryable.length === 0) {
      return this.storeAutoRetryResult(buildTaskResult('AUTO_RETRY', startedAt));
    }

    let retriedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let errorMessage: string | null = null;

    for (const notification of retryable) {
      try {
        const result = await this.securityCenter.retryOperationAlertNotification(
          buildSystemUser(tenantId, requestId),
          notification.notification_event_id,
        );
        retriedCount += 1;
        if (result.status === 'FAILED') {
          failedCount += 1;
        } else if (result.status === 'SKIPPED') {
          skippedCount += 1;
        } else {
          successCount += 1;
        }
      } catch (error) {
        failedCount += 1;
        errorMessage = errorMessage ?? (error instanceof Error ? error.message : '审批与归档告警通知自动重试失败。');
      }
    }

    const result = buildTaskResult('AUTO_RETRY', startedAt, {
      scanned_count: retryable.length,
      retried_count: retriedCount,
      success_count: successCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      error_message: errorMessage,
    });
    await this.recordTaskEvent(
      tenantId,
      null,
      'platform.security.approval_operation_alert_notification_task.auto_retry_finished',
      result,
      requestId,
      null,
    );

    return this.storeAutoRetryResult(result);
  }

  private async loadAutoNotifyAlerts(
    tenantId: string,
    policy: NotificationRetryPolicy,
  ): Promise<SecurityCenterOperationalAlert[]> {
    const notifications = await this.loadRecentNotificationItems(tenantId, policy);
    const notifiedAlertIds = new Set(
      notifications.filter((item) => AUTO_NOTIFY_ALERT_IDS.has(item.alert_id)).map((item) => item.alert_id),
    );
    const alerts = await this.securityCenter.listCurrentOperationAlerts(buildSystemUser(tenantId, buildRequestId('auto_notify_scan')));

    return alerts
      .filter((alert) => AUTO_NOTIFY_ALERT_IDS.has(alert.id))
      .filter((alert) => alert.status !== 'CLOSED')
      .filter((alert) => !notifiedAlertIds.has(alert.id))
      .sort((left, right) => Date.parse(left.triggered_at) - Date.parse(right.triggered_at));
  }

  private async loadRecentNotificationItems(tenantId: string, policy: NotificationRetryPolicy) {
    const since = new Date(Date.now() - policy.lookbackHours * 60 * 60 * 1000);
    const overview = await this.securityCenter.listOperationAlertNotifications(
      buildSystemUser(tenantId, buildRequestId('overview')),
      {},
    );

    return overview.items.filter((item) => Date.parse(item.delivered_at) >= since.getTime());
  }

  private async loadPolicy(tenantId: string): Promise<NotificationRetryPolicy> {
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        tenantId,
        category: 'NOTIFICATION',
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        key: true,
        value: true,
      },
    });
    if (settings.length === 0) return ENV_POLICY;

    const values = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      autoNotifyEnabled: booleanSetting(values.get('alert_notification_auto_notify_enabled'), ENV_POLICY.autoNotifyEnabled),
      autoNotifyIntervalMs: clampInteger(
        values.get('alert_notification_auto_notify_interval_ms'),
        10_000,
        3_600_000,
        ENV_POLICY.autoNotifyIntervalMs,
      ),
      autoNotifyBatchSize: clampInteger(
        values.get('alert_notification_auto_notify_batch_size'),
        1,
        30,
        ENV_POLICY.autoNotifyBatchSize,
      ),
      autoRetryEnabled: booleanSetting(values.get('alert_notification_auto_retry_enabled'), ENV_POLICY.autoRetryEnabled),
      retryIntervalMs: clampInteger(values.get('alert_notification_retry_interval_ms'), 10_000, 3_600_000, ENV_POLICY.retryIntervalMs),
      retryBatchSize: clampInteger(values.get('alert_notification_retry_batch_size'), 1, 30, ENV_POLICY.retryBatchSize),
      maxRetryCount: clampInteger(values.get('alert_notification_max_retry_count'), 1, 10, ENV_POLICY.maxRetryCount),
      retryBackoffSeconds: clampInteger(values.get('alert_notification_retry_backoff_seconds'), 1, 3600, ENV_POLICY.retryBackoffSeconds),
      lookbackHours: clampInteger(values.get('alert_notification_lookback_hours'), 1, 720, ENV_POLICY.lookbackHours),
      source: 'SYSTEM_SETTING',
    };
  }

  private storeAutoNotifyResult(result: SecurityOperationAlertNotificationTaskRunResult) {
    this.lastAutoNotifyResult = result;

    return result;
  }

  private storeAutoRetryResult(result: SecurityOperationAlertNotificationTaskRunResult) {
    this.lastAutoRetryResult = result;

    return result;
  }

  private async recordTaskEvent(
    tenantId: string,
    userId: string | null,
    eventType: string,
    result: SecurityOperationAlertNotificationTaskRunResult,
    requestId: string | null,
    traceId: string | null,
  ) {
    await this.prisma.platformEvent.create({
      data: {
        tenantId,
        userId,
        actorType: userId ? 'USER' : 'SYSTEM',
        resourceType: 'security_operation_alert_notification_task',
        requestId,
        traceId,
        eventSource: 'security_center',
        eventType,
        status: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
        severity: result.status === 'FAILED' ? 'WARN' : 'INFO',
        securityLevel: 'INTERNAL',
        billable: false,
        summary: taskSummary(result),
        payloadJson: result as unknown as Prisma.InputJsonObject,
        sourceSystem: 'security_center',
        sourceId: result.task.toLowerCase(),
      },
    });
  }
}

function eligibleRetryNotifications(items: SecurityOperationAlertNotificationItem[], policy: NotificationRetryPolicy) {
  const backoffAt = Date.now() - policy.retryBackoffSeconds * 1000;

  return items
    .filter((item) => (item.status === 'FAILED' || item.status === 'PARTIAL'))
    .filter((item) => item.retry_count < policy.maxRetryCount)
    .filter((item) => Date.parse(item.delivered_at) <= backoffAt)
    .sort((left, right) => Date.parse(left.delivered_at) - Date.parse(right.delivered_at));
}

function mapPolicy(policy: NotificationRetryPolicy): SecurityOperationAlertNotificationTaskOverview['policy'] {
  return {
    auto_notify_enabled: policy.autoNotifyEnabled,
    auto_notify_interval_ms: policy.autoNotifyIntervalMs,
    auto_notify_batch_size: policy.autoNotifyBatchSize,
    auto_retry_enabled: policy.autoRetryEnabled,
    retry_interval_ms: policy.retryIntervalMs,
    retry_batch_size: policy.retryBatchSize,
    max_retry_count: policy.maxRetryCount,
    retry_backoff_seconds: policy.retryBackoffSeconds,
    lookback_hours: policy.lookbackHours,
    source: policy.source,
  };
}

function booleanSetting(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) return fallback;

  return Math.min(Math.max(numberValue, min), max);
}

function buildTaskResult(
  task: SecurityOperationAlertNotificationTaskRunResult['task'],
  startedAt: Date,
  input: Partial<Omit<SecurityOperationAlertNotificationTaskRunResult, 'task' | 'status' | 'started_at' | 'finished_at'>> = {},
): SecurityOperationAlertNotificationTaskRunResult {
  const failedCount = input.failed_count ?? 0;
  const activityCount =
    (input.scanned_count ?? 0) + (input.notified_count ?? 0) + (input.retried_count ?? 0) + (input.skipped_count ?? 0);

  return {
    task,
    status: failedCount > 0 ? 'FAILED' : activityCount > 0 ? 'SUCCESS' : 'SKIPPED',
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    scanned_count: input.scanned_count ?? 0,
    notified_count: input.notified_count ?? 0,
    retried_count: input.retried_count ?? 0,
    sla_dead_letter_notify_count: input.sla_dead_letter_notify_count ?? 0,
    agent_team_report_archive_delete_notify_count: input.agent_team_report_archive_delete_notify_count ?? 0,
    recovery_archive_delete_notify_count: input.recovery_archive_delete_notify_count ?? 0,
    success_count: input.success_count ?? 0,
    failed_count: failedCount,
    skipped_count: input.skipped_count ?? 0,
    error_message: input.error_message ?? null,
  };
}

function taskSummary(result: SecurityOperationAlertNotificationTaskRunResult) {
  if (result.task === 'AUTO_NOTIFY') {
    return `审批与归档告警自动通知完成：扫描 ${result.scanned_count} 条，通知 ${result.notified_count} 条，成功 ${result.success_count} 条，失败 ${result.failed_count} 条。`;
  }

  return `审批与归档告警通知自动重试完成：扫描 ${result.scanned_count} 条，重试 ${result.retried_count} 条，成功 ${result.success_count} 条，失败 ${result.failed_count} 条。`;
}

function mapTaskRunEvent(
  event: Prisma.PlatformEventGetPayload<object>,
): SecurityOperationAlertNotificationTaskRunOverview['items'][number] {
  const payload = jsonObjectOrNull(event.payloadJson);
  const task = normalizeTaskName(payload?.task);
  const status = normalizeTaskStatus(payload?.status);
  const startedAt = typeof payload?.started_at === 'string' ? payload.started_at : event.occurredAt.toISOString();
  const finishedAt = typeof payload?.finished_at === 'string' ? payload.finished_at : event.occurredAt.toISOString();

  return {
    event_id: event.id,
    event_type: event.eventType,
    trigger_type: event.eventType.includes('.manual_') ? 'MANUAL' : 'SCHEDULED',
    task,
    status,
    started_at: startedAt,
    finished_at: finishedAt,
    scanned_count: numberField(payload?.scanned_count),
    notified_count: numberField(payload?.notified_count),
    retried_count: numberField(payload?.retried_count),
    sla_dead_letter_notify_count: numberField(payload?.sla_dead_letter_notify_count),
    agent_team_report_archive_delete_notify_count: numberField(payload?.agent_team_report_archive_delete_notify_count),
    recovery_archive_delete_notify_count: numberField(payload?.recovery_archive_delete_notify_count),
    success_count: numberField(payload?.success_count),
    failed_count: numberField(payload?.failed_count),
    skipped_count: numberField(payload?.skipped_count),
    error_message: typeof payload?.error_message === 'string' ? payload.error_message : null,
    request_id: event.requestId,
    trace_id: event.traceId,
    summary: event.summary,
    duration_ms: Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt)),
    created_at: event.createdAt.toISOString(),
  };
}

function isManualFinishedDuplicate(event: Prisma.PlatformEventGetPayload<object>) {
  return event.eventType.endsWith('_finished') && Boolean(event.requestId?.includes('_manual_'));
}

function buildTaskRunSummary(items: SecurityOperationAlertNotificationTaskRunOverview['items']) {
  return {
    total_count: items.length,
    success_count: items.filter((item) => item.status === 'SUCCESS').length,
    failed_count: items.filter((item) => item.status === 'FAILED').length,
    skipped_count: items.filter((item) => item.status === 'SKIPPED').length,
    manual_count: items.filter((item) => item.trigger_type === 'MANUAL').length,
    scheduled_count: items.filter((item) => item.trigger_type === 'SCHEDULED').length,
    auto_notify_count: items.filter((item) => item.task === 'AUTO_NOTIFY').length,
    auto_retry_count: items.filter((item) => item.task === 'AUTO_RETRY').length,
    sla_dead_letter_notify_count: items.reduce((sum, item) => sum + item.sla_dead_letter_notify_count, 0),
    agent_team_report_archive_delete_notify_count: items.reduce(
      (sum, item) => sum + item.agent_team_report_archive_delete_notify_count,
      0,
    ),
    recovery_archive_delete_notify_count: items.reduce(
      (sum, item) => sum + item.recovery_archive_delete_notify_count,
      0,
    ),
    latest_finished_at: items[0]?.finished_at ?? null,
  };
}

function normalizeTaskName(value: unknown): SecurityOperationAlertNotificationTaskRunResult['task'] {
  if (value === 'AUTO_NOTIFY' || value === 'AUTO_RETRY') return value;
  return 'AUTO_RETRY';
}

function normalizeTaskStatus(value: unknown): SecurityOperationAlertNotificationTaskRunResult['status'] {
  if (value === 'SUCCESS' || value === 'FAILED' || value === 'SKIPPED') return value;
  return 'SKIPPED';
}

function numberField(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function jsonObjectOrNull(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function buildRequestId(source: string) {
  return `${TASK_REQUEST_ID_PREFIX}_${source}_${Date.now()}`;
}

function buildSystemUser(tenantId: string, requestId: string): AuthenticatedUser {
  return {
    id: 'system-security-operation-alert-notification-task',
    tenantId,
    email: 'system@aiaget.local',
    roles: ['system'],
    permissions: ['security:rule:view'],
    requestId,
  };
}
