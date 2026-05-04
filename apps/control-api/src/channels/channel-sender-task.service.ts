import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ChannelSenderPolicy,
  ChannelSenderTaskOverview,
  ChannelSenderTaskRunResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { ExternalChannelSenderService } from '../external-api/external-channel-sender.service';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';

const TASK_INTERVAL_MS = Number(process.env.CHANNEL_SENDER_TASK_INTERVAL_MS ?? 60_000);
const TASK_BATCH_SIZE = Math.min(Math.max(Number(process.env.CHANNEL_SENDER_TASK_BATCH_SIZE ?? 10), 1), 50);
const TASK_REQUEST_ID_PREFIX = 'channel_sender_task';

const channelInclude = {
  agent: true,
} satisfies Prisma.AgentPublishChannelInclude;

type ChannelRecord = Prisma.AgentPublishChannelGetPayload<{ include: typeof channelInclude }>;
type DeliveryRecord = Prisma.ChannelSenderDeliveryGetPayload<{ include: { channel: { include: { agent: true } }; agent: true } }>;

@Injectable()
export class ChannelSenderTaskService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChannelSenderTaskService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastTickAt: Date | null = null;
  private lastAutoRetryResult: ChannelSenderTaskRunResult | null = null;
  private lastCleanupResult: ChannelSenderTaskRunResult | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ExternalChannelSenderService) private readonly channelSender: ExternalChannelSenderService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
  ) {}

  onModuleInit() {
    if (!isSchedulerEnabled()) return;

    this.timer = setInterval(() => {
      void this.runScheduledTick().catch((error) => {
        const message = error instanceof Error ? error.message : '渠道投递自动任务失败。';
        this.logger.warn(message);
      });
    }, TASK_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async getOverview(currentUser: AuthenticatedUser): Promise<ChannelSenderTaskOverview> {
    const channels = await this.findTenantChannels(currentUser.tenantId);
    const eligibleChannelIds = channels
      .filter((channel) => readSenderPolicy(channel.config).auto_retry_enabled)
      .map((channel) => channel.id);
    const pendingAutoRetryWhere = buildPendingAutoRetryWhere(currentUser.tenantId, channels);
    const expiredWhere = buildExpiredWhere(currentUser.tenantId, channels);
    const [pendingAutoRetryCount, expiredDeliveryCount, failedDeliveryCount, oldestFailed] = await Promise.all([
      pendingAutoRetryWhere
        ? this.prisma.channelSenderDelivery.count({ where: pendingAutoRetryWhere })
        : Promise.resolve(0),
      expiredWhere
        ? this.prisma.channelSenderDelivery.count({ where: expiredWhere })
        : Promise.resolve(0),
      this.prisma.channelSenderDelivery.count({
        where: {
          tenantId: currentUser.tenantId,
          status: 'FAILED',
        },
      }),
      this.prisma.channelSenderDelivery.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          status: 'FAILED',
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    return {
      generated_at: new Date().toISOString(),
      scheduler_enabled: isSchedulerEnabled(),
      running: this.running,
      last_tick_at: this.lastTickAt?.toISOString() ?? null,
      next_tick_after_seconds: isSchedulerEnabled() ? Math.ceil(TASK_INTERVAL_MS / 1000) : null,
      summary: {
        pending_auto_retry_count: pendingAutoRetryCount,
        expired_delivery_count: expiredDeliveryCount,
        auto_retry_enabled_channel_count: eligibleChannelIds.length,
        failed_delivery_count: failedDeliveryCount,
        oldest_failed_at: oldestFailed?.createdAt.toISOString() ?? null,
      },
      last_auto_retry_result: this.lastAutoRetryResult,
      last_cleanup_result: this.lastCleanupResult,
    };
  }

  async runAutoRetry(currentUser: AuthenticatedUser): Promise<ChannelSenderTaskRunResult> {
    const result = await this.runAutoRetryForTenant(currentUser.tenantId, buildRequestId('manual_retry'));
    await this.recordTaskEvent(currentUser.tenantId, currentUser.id, 'channel.sender_task.manual_auto_retry', result, currentUser.requestId ?? null, currentUser.traceId ?? null);

    return result;
  }

  async runCleanup(currentUser: AuthenticatedUser): Promise<ChannelSenderTaskRunResult> {
    const result = await this.runCleanupForTenant(currentUser.tenantId, buildRequestId('manual_cleanup'));
    await this.recordTaskEvent(currentUser.tenantId, currentUser.id, 'channel.sender_task.manual_cleanup', result, currentUser.requestId ?? null, currentUser.traceId ?? null);

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
        this.lastAutoRetryResult = await this.runAutoRetryForTenant(tenant.id, buildRequestId('scheduled_retry'));
        this.lastCleanupResult = await this.runCleanupForTenant(tenant.id, buildRequestId('scheduled_cleanup'));
      }
    } finally {
      this.running = false;
    }
  }

  private async runAutoRetryForTenant(tenantId: string, requestId: string): Promise<ChannelSenderTaskRunResult> {
    const startedAt = new Date();
    const channels = await this.findTenantChannels(tenantId);
    const where = buildPendingAutoRetryWhere(tenantId, channels);
    if (!where) {
      return this.storeAutoRetryResult(buildTaskResult('AUTO_RETRY', startedAt, { skipped_count: 1 }));
    }

    const deliveries = await this.prisma.channelSenderDelivery.findMany({
      where,
      include: {
        channel: {
          include: {
            agent: true,
          },
        },
        agent: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: TASK_BATCH_SIZE,
    });
    if (deliveries.length === 0) {
      return this.storeAutoRetryResult(buildTaskResult('AUTO_RETRY', startedAt));
    }

    let retriedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let errorMessage: string | null = null;

    for (const delivery of deliveries) {
      try {
        const result = await this.channelSender.retryDeliveryForTask(delivery, requestId);
        retriedCount += result.retried_count;
        successCount += result.success_count;
        failedCount += result.failed_count;
        skippedCount += result.skipped_count;
        errorMessage = errorMessage ?? result.error_message;
      } catch (error) {
        failedCount += 1;
        errorMessage = errorMessage ?? (error instanceof Error ? error.message : '渠道投递自动重试失败。');
      }
    }

    const result = buildTaskResult('AUTO_RETRY', startedAt, {
      scanned_count: deliveries.length,
      retried_count: retriedCount,
      success_count: successCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      error_message: errorMessage,
    });
    await this.recordTaskEvent(tenantId, null, 'channel.sender_task.auto_retry_finished', result, requestId, null);

    return this.storeAutoRetryResult(result);
  }

  private async runCleanupForTenant(tenantId: string, requestId: string): Promise<ChannelSenderTaskRunResult> {
    const startedAt = new Date();
    const channels = await this.findTenantChannels(tenantId);
    const where = buildExpiredWhere(tenantId, channels);
    if (!where) {
      return this.storeCleanupResult(buildTaskResult('CLEANUP', startedAt, { skipped_count: 1 }));
    }

    const expired = await this.prisma.channelSenderDelivery.findMany({
      where,
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: TASK_BATCH_SIZE * 5,
    });
    if (expired.length === 0) {
      return this.storeCleanupResult(buildTaskResult('CLEANUP', startedAt));
    }

    const deleted = await this.prisma.channelSenderDelivery.deleteMany({
      where: {
        id: {
          in: expired.map((item) => item.id),
        },
      },
    });
    const result = buildTaskResult('CLEANUP', startedAt, {
      scanned_count: expired.length,
      deleted_count: deleted.count,
    });
    await this.recordTaskEvent(tenantId, null, 'channel.sender_task.cleanup_finished', result, requestId, null);

    return this.storeCleanupResult(result);
  }

  private async findTenantChannels(tenantId: string): Promise<ChannelRecord[]> {
    return this.prisma.agentPublishChannel.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: channelInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  private storeAutoRetryResult(result: ChannelSenderTaskRunResult) {
    this.lastAutoRetryResult = result;

    return result;
  }

  private storeCleanupResult(result: ChannelSenderTaskRunResult) {
    this.lastCleanupResult = result;

    return result;
  }

  private async recordTaskEvent(
    tenantId: string,
    userId: string | null,
    eventType: string,
    result: ChannelSenderTaskRunResult,
    requestId: string | null,
    traceId: string | null,
  ) {
    await this.platformEvents.recordEvent({
      tenantId,
      userId,
      actorType: userId ? 'USER' : 'SYSTEM',
      resourceType: 'CHANNEL',
      requestId,
      traceId,
      eventSource: 'CHANNEL_SENDER_TASK',
      eventType,
      status: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
      severity: result.status === 'FAILED' ? 'WARN' : 'INFO',
      billable: false,
      summary: taskSummary(result),
      payloadJson: result as unknown as Prisma.InputJsonObject,
      sourceSystem: 'channel_sender_task',
      sourceId: result.task.toLowerCase(),
    });
  }
}

function isSchedulerEnabled() {
  return process.env.CHANNEL_SENDER_TASK_ENABLED !== 'false';
}

function buildPendingAutoRetryWhere(tenantId: string, channels: ChannelRecord[]): Prisma.ChannelSenderDeliveryWhereInput | null {
  const or: Prisma.ChannelSenderDeliveryWhereInput[] = [];
  for (const channel of channels) {
    const policy = readSenderPolicy(channel.config);
    if (!policy.auto_retry_enabled || policy.max_retry_count <= 0) continue;

    const item: Prisma.ChannelSenderDeliveryWhereInput = {
      channelId: channel.id,
      retryCount: {
        lt: policy.max_retry_count,
      },
      createdAt: {
        lte: new Date(Date.now() - policy.retry_backoff_seconds * 1000),
      },
    };
    if (policy.retry_on_statuses.length > 0) {
      item.OR = [
        { responseStatus: null },
        { responseStatus: { in: policy.retry_on_statuses } },
      ];
    }
    or.push(item);
  }

  if (or.length === 0) return null;

  return {
    tenantId,
    status: 'FAILED',
    requestUrl: {
      not: null,
    },
    OR: or,
  };
}

function buildExpiredWhere(tenantId: string, channels: ChannelRecord[]): Prisma.ChannelSenderDeliveryWhereInput | null {
  const or = channels
    .map((channel) => {
      const policy = readSenderPolicy(channel.config);

      return {
        channelId: channel.id,
        createdAt: {
          lt: new Date(Date.now() - policy.retention_days * 24 * 60 * 60 * 1000),
        },
      } satisfies Prisma.ChannelSenderDeliveryWhereInput;
    });

  if (or.length === 0) return null;

  return {
    tenantId,
    OR: or,
  };
}

function readSenderPolicy(config: Prisma.JsonValue | null): Omit<ChannelSenderPolicy, 'updated_at'> {
  const configObject = asRecord(config);
  const policy = asRecord(configObject.sender_policy);

  return {
    auto_retry_enabled: typeof policy.auto_retry_enabled === 'boolean' ? policy.auto_retry_enabled : false,
    manual_retry_enabled: typeof policy.manual_retry_enabled === 'boolean' ? policy.manual_retry_enabled : true,
    max_retry_count: clampInteger(policy.max_retry_count, 0, 10, 3),
    retry_backoff_seconds: clampInteger(policy.retry_backoff_seconds, 1, 3600, 60),
    retry_on_statuses: normalizeStatusCodes(policy.retry_on_statuses),
    alert_on_failure: typeof policy.alert_on_failure === 'boolean' ? policy.alert_on_failure : true,
    retention_days: clampInteger(policy.retention_days, 1, 365, 30),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return value as Record<string, unknown>;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) return fallback;

  return Math.min(Math.max(numberValue, min), max);
}

function normalizeStatusCodes(value: unknown) {
  if (!Array.isArray(value)) return [408, 429, 500, 502, 503, 504];

  return Array.from(new Set(
    value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item >= 400 && item <= 599),
  )).slice(0, 20);
}

function buildTaskResult(
  task: ChannelSenderTaskRunResult['task'],
  startedAt: Date,
  input: Partial<Omit<ChannelSenderTaskRunResult, 'task' | 'status' | 'started_at' | 'finished_at'>> = {},
): ChannelSenderTaskRunResult {
  const failedCount = input.failed_count ?? 0;
  const activityCount = (input.scanned_count ?? 0)
    + (input.retried_count ?? 0)
    + (input.skipped_count ?? 0)
    + (input.deleted_count ?? 0);

  return {
    task,
    status: failedCount > 0 ? 'FAILED' : activityCount > 0 ? 'SUCCESS' : 'SKIPPED',
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    scanned_count: input.scanned_count ?? 0,
    retried_count: input.retried_count ?? 0,
    success_count: input.success_count ?? 0,
    failed_count: failedCount,
    skipped_count: input.skipped_count ?? 0,
    deleted_count: input.deleted_count ?? 0,
    error_message: input.error_message ?? null,
  };
}

function taskSummary(result: ChannelSenderTaskRunResult) {
  if (result.task === 'AUTO_RETRY') {
    return `渠道自动重试完成：扫描 ${result.scanned_count} 条，重试 ${result.retried_count} 条，成功 ${result.success_count} 条，失败 ${result.failed_count} 条。`;
  }

  return `渠道投递清理完成：扫描 ${result.scanned_count} 条，删除 ${result.deleted_count} 条。`;
}

function buildRequestId(source: string) {
  return `${TASK_REQUEST_ID_PREFIX}_${source}_${Date.now()}`;
}
