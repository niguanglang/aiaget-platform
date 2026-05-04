import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  PlatformUsageAlertNotificationItem,
  PlatformUsageAlertNotificationTaskOverview,
  PlatformUsageAlertNotificationTaskRunResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventsService } from './platform-events.service';

const ENV_POLICY = {
  autoRetryEnabled: process.env.PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_ENABLED !== 'false',
  retryIntervalMs: clampInteger(process.env.PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_INTERVAL_MS, 10_000, 3_600_000, 60_000),
  retryBatchSize: clampInteger(process.env.PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_BATCH_SIZE, 1, 30, 8),
  maxRetryCount: clampInteger(process.env.PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_MAX_RETRY_COUNT, 1, 10, 3),
  retryBackoffSeconds: clampInteger(process.env.PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_BACKOFF_SECONDS, 1, 3600, 60),
  lookbackHours: clampInteger(process.env.PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_LOOKBACK_HOURS, 1, 720, 24),
  source: 'ENVIRONMENT' as const,
};
const TASK_REQUEST_ID_PREFIX = 'platform_usage_alert_notification_task';

interface NotificationRetryPolicy {
  autoRetryEnabled: boolean;
  retryIntervalMs: number;
  retryBatchSize: number;
  maxRetryCount: number;
  retryBackoffSeconds: number;
  lookbackHours: number;
  source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
}

@Injectable()
export class PlatformUsageAlertNotificationTaskService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlatformUsageAlertNotificationTaskService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastTickAt: Date | null = null;
  private lastAutoRetryResult: PlatformUsageAlertNotificationTaskRunResult | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
  ) {}

  onModuleInit() {
    if (!ENV_POLICY.autoRetryEnabled) return;

    this.timer = setInterval(() => {
      void this.runScheduledTick().catch((error) => {
        const message = error instanceof Error ? error.message : '平台用量告警通知自动重试任务失败。';
        this.logger.warn(message);
      });
    }, ENV_POLICY.retryIntervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async getOverview(currentUser: AuthenticatedUser): Promise<PlatformUsageAlertNotificationTaskOverview> {
    const policy = await this.loadPolicy(currentUser.tenantId);
    const notifications = await this.loadRecentNotificationItems(currentUser.tenantId, policy);
    const retryable = eligibleRetryNotifications(notifications, policy);
    const oldestRetryable = retryable
      .map((item) => item.delivered_at)
      .sort((left, right) => Date.parse(left) - Date.parse(right))[0];

    return {
      generated_at: new Date().toISOString(),
      scheduler_enabled: policy.autoRetryEnabled,
      running: this.running,
      last_tick_at: this.lastTickAt?.toISOString() ?? null,
      next_tick_after_seconds: policy.autoRetryEnabled ? Math.ceil(policy.retryIntervalMs / 1000) : null,
      policy: mapPolicy(policy),
      summary: {
        pending_auto_retry_count: retryable.length,
        failed_notification_count: notifications.filter((item) => item.status === 'FAILED').length,
        partial_notification_count: notifications.filter((item) => item.status === 'PARTIAL').length,
        retried_notification_count: notifications.filter((item) => item.retry_count > 0 || item.retried_from_event_id).length,
        oldest_retryable_at: oldestRetryable ?? null,
      },
      last_auto_retry_result: this.lastAutoRetryResult,
    };
  }

  async runAutoRetry(currentUser: AuthenticatedUser): Promise<PlatformUsageAlertNotificationTaskRunResult> {
    const result = await this.runAutoRetryForTenant(currentUser.tenantId, buildRequestId('manual_retry'));
    await this.recordTaskEvent(
      currentUser.tenantId,
      currentUser.id,
      'platform.usage.alert_notification_task.manual_auto_retry',
      result,
      currentUser.requestId ?? null,
      currentUser.traceId ?? null,
    );

    return result;
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
        if (!policy.autoRetryEnabled) continue;
        this.lastAutoRetryResult = await this.runAutoRetryForTenant(tenant.id, buildRequestId('scheduled_retry'));
      }
    } finally {
      this.running = false;
    }
  }

  private async runAutoRetryForTenant(
    tenantId: string,
    requestId: string,
  ): Promise<PlatformUsageAlertNotificationTaskRunResult> {
    const startedAt = new Date();
    const policy = await this.loadPolicy(tenantId);
    if (!policy.autoRetryEnabled) {
      return this.storeAutoRetryResult(buildTaskResult(startedAt, { skipped_count: 1 }));
    }

    const notifications = await this.loadRecentNotificationItems(tenantId, policy);
    const retryable = eligibleRetryNotifications(notifications, policy).slice(0, policy.retryBatchSize);
    if (retryable.length === 0) {
      return this.storeAutoRetryResult(buildTaskResult(startedAt));
    }

    let retriedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let errorMessage: string | null = null;

    for (const notification of retryable) {
      try {
        const result = await this.platformEvents.retryUsageAlertNotificationForTask(
          tenantId,
          notification.notification_event_id,
          requestId,
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
        errorMessage = errorMessage ?? (error instanceof Error ? error.message : '告警通知自动重试失败。');
      }
    }

    const result = buildTaskResult(startedAt, {
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
      'platform.usage.alert_notification_task.auto_retry_finished',
      result,
      requestId,
      null,
    );

    return this.storeAutoRetryResult(result);
  }

  private async loadRecentNotificationItems(tenantId: string, policy: NotificationRetryPolicy) {
    const since = new Date(Date.now() - policy.lookbackHours * 60 * 60 * 1000);
    const overview = await this.platformEvents.listUsageAlertNotifications(
      buildSystemUser(tenantId, buildRequestId('overview')),
      {
        window: policy.lookbackHours > 24 ? '7d' : '24h',
      },
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
      autoRetryEnabled: booleanSetting(values.get('alert_notification_auto_retry_enabled'), ENV_POLICY.autoRetryEnabled),
      retryIntervalMs: clampInteger(values.get('alert_notification_retry_interval_ms'), 10_000, 3_600_000, ENV_POLICY.retryIntervalMs),
      retryBatchSize: clampInteger(values.get('alert_notification_retry_batch_size'), 1, 30, ENV_POLICY.retryBatchSize),
      maxRetryCount: clampInteger(values.get('alert_notification_max_retry_count'), 1, 10, ENV_POLICY.maxRetryCount),
      retryBackoffSeconds: clampInteger(values.get('alert_notification_retry_backoff_seconds'), 1, 3600, ENV_POLICY.retryBackoffSeconds),
      lookbackHours: clampInteger(values.get('alert_notification_lookback_hours'), 1, 720, ENV_POLICY.lookbackHours),
      source: 'SYSTEM_SETTING',
    };
  }

  private storeAutoRetryResult(result: PlatformUsageAlertNotificationTaskRunResult) {
    this.lastAutoRetryResult = result;

    return result;
  }

  private async recordTaskEvent(
    tenantId: string,
    userId: string | null,
    eventType: string,
    result: PlatformUsageAlertNotificationTaskRunResult,
    requestId: string | null,
    traceId: string | null,
  ) {
    await this.platformEvents.recordEvent({
      tenantId,
      userId,
      actorType: userId ? 'USER' : 'SYSTEM',
      resourceType: 'platform_usage_alert_notification_task',
      requestId,
      traceId,
      eventSource: 'platform_usage_alert_notification_task',
      eventType,
      status: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
      severity: result.status === 'FAILED' ? 'WARN' : 'INFO',
      billable: false,
      summary: taskSummary(result),
      payloadJson: result as unknown as Prisma.InputJsonObject,
      sourceSystem: 'platform_usage_alert_notification_task',
      sourceId: result.task.toLowerCase(),
    });
  }
}

function eligibleRetryNotifications(items: PlatformUsageAlertNotificationItem[], policy: NotificationRetryPolicy) {
  const backoffAt = Date.now() - policy.retryBackoffSeconds * 1000;

  return items
    .filter((item) => (item.status === 'FAILED' || item.status === 'PARTIAL'))
    .filter((item) => item.retry_count < policy.maxRetryCount)
    .filter((item) => Date.parse(item.delivered_at) <= backoffAt)
    .sort((left, right) => Date.parse(left.delivered_at) - Date.parse(right.delivered_at));
}

function mapPolicy(policy: NotificationRetryPolicy): PlatformUsageAlertNotificationTaskOverview['policy'] {
  return {
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
  startedAt: Date,
  input: Partial<Omit<PlatformUsageAlertNotificationTaskRunResult, 'task' | 'status' | 'started_at' | 'finished_at'>> = {},
): PlatformUsageAlertNotificationTaskRunResult {
  const failedCount = input.failed_count ?? 0;
  const activityCount = (input.scanned_count ?? 0) + (input.retried_count ?? 0) + (input.skipped_count ?? 0);

  return {
    task: 'AUTO_RETRY',
    status: failedCount > 0 ? 'FAILED' : activityCount > 0 ? 'SUCCESS' : 'SKIPPED',
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    scanned_count: input.scanned_count ?? 0,
    retried_count: input.retried_count ?? 0,
    success_count: input.success_count ?? 0,
    failed_count: failedCount,
    skipped_count: input.skipped_count ?? 0,
    error_message: input.error_message ?? null,
  };
}

function taskSummary(result: PlatformUsageAlertNotificationTaskRunResult) {
  return `告警通知自动重试完成：扫描 ${result.scanned_count} 条，重试 ${result.retried_count} 条，成功 ${result.success_count} 条，失败 ${result.failed_count} 条。`;
}

function buildRequestId(source: string) {
  return `${TASK_REQUEST_ID_PREFIX}_${source}_${Date.now()}`;
}

function buildSystemUser(tenantId: string, requestId: string): AuthenticatedUser {
  return {
    id: 'system-platform-usage-alert-notification-task',
    tenantId,
    email: 'system@aiaget.local',
    roles: ['system'],
    permissions: ['monitor:log:view'],
    requestId,
  };
}
