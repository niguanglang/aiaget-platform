import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import type {
  ChannelReleaseSchedulerChannelResult,
  ChannelReleaseSchedulerOverview,
  ChannelReleaseSchedulerRunResult,
  ChannelReleaseSchedulerStatus,
  ChannelReleaseSchedulerTask,
} from '@aiaget/shared-types';

import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelReleaseAutomationWorkflowService } from './channel-release-automation-workflow.service';
import { ChannelReleaseSelfHealingWorkflowService } from './channel-release-self-healing-workflow.service';

const TASK_INTERVAL_MS = Math.max(Number(process.env.CHANNEL_RELEASE_SCHEDULER_INTERVAL_MS ?? 120_000), 30_000);
const TASK_BATCH_SIZE = Math.min(Math.max(Number(process.env.CHANNEL_RELEASE_SCHEDULER_BATCH_SIZE ?? 10), 1), 50);
const DEFAULT_REQUEST_ID_PREFIX = 'channel_release_scheduler';

const channelInclude = {
  agent: true,
} satisfies Prisma.AgentPublishChannelInclude;

type ChannelRecord = Prisma.AgentPublishChannelGetPayload<{ include: typeof channelInclude }>;

@Injectable()
export class ChannelReleaseSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChannelReleaseSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastTickAt: Date | null = null;
  private lastRun: ChannelReleaseSchedulerRunResult | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
    @Inject(ChannelReleaseAutomationWorkflowService)
    private readonly releaseAutomationWorkflow: ChannelReleaseAutomationWorkflowService,
    @Inject(ChannelReleaseSelfHealingWorkflowService)
    private readonly releaseSelfHealingWorkflow: ChannelReleaseSelfHealingWorkflowService,
  ) {}

  onModuleInit() {
    if (!isSchedulerEnabled()) return;

    this.timer = setInterval(() => {
      void this.runScheduledTick().catch((error) => {
        const message = error instanceof Error ? error.message : '渠道发布巡检调度任务失败。';
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

  async getOverview(tenantId: string): Promise<ChannelReleaseSchedulerOverview> {
    const channels = await this.findTenantChannels(tenantId);
    const summary = summarizeChannels(channels);

    return {
      generated_at: new Date().toISOString(),
      scheduler_enabled: isSchedulerEnabled(),
      running: this.running,
      last_tick_at: this.lastTickAt?.toISOString() ?? null,
      next_tick_after_seconds: isSchedulerEnabled() ? Math.ceil(TASK_INTERVAL_MS / 1000) : null,
      workflow_modes: {
        automation: this.releaseAutomationWorkflow.getWorkflowMode(),
        self_healing: this.releaseSelfHealingWorkflow.getWorkflowMode(),
      },
      summary,
      last_run: this.lastRun,
    };
  }

  async runOnce(tenantId: string, actorUserId: string | null = null): Promise<ChannelReleaseSchedulerRunResult> {
    return this.runForTenant(tenantId, buildRequestId(actorUserId ? 'manual' : 'scheduled'), actorUserId);
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
        this.lastRun = await this.runForTenant(tenant.id, buildRequestId('scheduled'), null);
      }
    } finally {
      this.running = false;
    }
  }

  private async runForTenant(
    tenantId: string,
    requestId: string,
    actorUserId: string | null,
  ): Promise<ChannelReleaseSchedulerRunResult> {
    const startedAt = new Date();
    const channels = await this.findTenantChannels(tenantId);
    const automationCandidates = channels.filter(isAutomationCandidate).slice(0, TASK_BATCH_SIZE);
    const selfHealingCandidates = channels.filter(isSelfHealingCandidate).slice(0, TASK_BATCH_SIZE);
    const results: ChannelReleaseSchedulerChannelResult[] = [];
    let errorMessage: string | null = null;

    for (const channel of automationCandidates) {
      const result = await this.dispatchChannel(tenantId, channel, 'AUTOMATION');
      results.push(result);
      errorMessage = errorMessage ?? result.error_message;
    }

    for (const channel of selfHealingCandidates) {
      const result = await this.dispatchChannel(tenantId, channel, 'SELF_HEALING');
      results.push(result);
      errorMessage = errorMessage ?? result.error_message;
    }

    const failedCount = results.filter((item) => item.status === 'FAILED').length;
    const skippedCount = results.filter((item) => item.status === 'SKIPPED').length;
    const successCount = results.length - failedCount - skippedCount;
    const status: ChannelReleaseSchedulerStatus = results.length === 0
      ? 'SKIPPED'
      : failedCount === results.length
        ? 'FAILED'
        : failedCount > 0
          ? 'PARTIAL'
          : 'SUCCESS';

    const result: ChannelReleaseSchedulerRunResult = {
      run_id: `release_sched_${randomUUID().replaceAll('-', '').slice(0, 16)}`,
      task: 'POLL',
      status,
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      scanned_channel_count: channels.length,
      automation_candidate_count: automationCandidates.length,
      self_healing_candidate_count: selfHealingCandidates.length,
      dispatched_count: results.length,
      success_count: successCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      error_message: errorMessage,
      results,
    };

    this.lastRun = result;
    await this.recordSchedulerEvent(tenantId, actorUserId, requestId, result);

    return result;
  }

  private async dispatchChannel(
    tenantId: string,
    channel: ChannelRecord,
    task: ChannelReleaseSchedulerTask,
  ): Promise<ChannelReleaseSchedulerChannelResult> {
    try {
      if (task === 'AUTOMATION') {
        const overview = await this.releaseAutomationWorkflow.dispatch(buildSchedulerUser(tenantId), channel.id);
        const lastRun = overview.last_run;

        return {
          channel_id: channel.id,
          channel_name: channel.name ?? String(channel.channel),
          task,
          status: lastRun?.decision === 'FAILED' || lastRun?.decision === 'BLOCKED' ? 'FAILED' : 'SUCCESS',
          decision: lastRun?.decision ?? null,
          workflow_backend: overview.workflow_backend ?? lastRun?.workflow_backend ?? null,
          error_message: lastRun?.error_message ?? null,
        };
      }

      const overview = await this.releaseSelfHealingWorkflow.dispatch(buildSchedulerUser(tenantId), channel.id);
      const lastRun = overview.last_run;

      return {
        channel_id: channel.id,
        channel_name: channel.name ?? String(channel.channel),
        task,
        status: lastRun?.decision === 'FAILED' ? 'FAILED' : 'SUCCESS',
        decision: lastRun?.decision ?? null,
        workflow_backend: overview.workflow_backend ?? lastRun?.workflow_backend ?? null,
        error_message: lastRun?.error_message ?? null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '渠道发布巡检派发失败。';
      this.logger.warn(`Channel release scheduler ${task} failed for ${channel.id}: ${message}`);

      return {
        channel_id: channel.id,
        channel_name: channel.name ?? String(channel.channel),
        task,
        status: 'FAILED',
        decision: null,
        workflow_backend: null,
        error_message: message,
      };
    }
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

  private async recordSchedulerEvent(
    tenantId: string,
    userId: string | null,
    requestId: string,
    result: ChannelReleaseSchedulerRunResult,
  ) {
    await this.platformEvents.recordEvent({
      tenantId,
      userId,
      actorType: userId ? 'USER' : 'SYSTEM',
      resourceType: 'CHANNEL',
      requestId,
      eventSource: 'CHANNEL_RELEASE_SCHEDULER',
      eventType: userId ? 'channel.release_scheduler.manual_run_finished' : 'channel.release_scheduler.scheduled_run_finished',
      status: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
      severity: result.status === 'FAILED' || result.status === 'PARTIAL' ? 'WARN' : 'INFO',
      billable: false,
      summary: schedulerSummary(result),
      payloadJson: result as unknown as Prisma.InputJsonObject,
      sourceSystem: 'channel_release_scheduler',
      sourceId: result.run_id,
    });
  }
}

function isSchedulerEnabled() {
  return process.env.CHANNEL_RELEASE_SCHEDULER_ENABLED === 'true';
}

function buildRequestId(type: string) {
  return `${DEFAULT_REQUEST_ID_PREFIX}_${type}_${Date.now()}`;
}

function buildSchedulerUser(tenantId: string) {
  return {
    id: 'system-channel-release-scheduler',
    tenantId,
    departmentId: null,
    email: 'system@aiaget.local',
    roles: ['system'],
    roleIds: [],
    permissions: ['*'],
    requestId: buildRequestId('workflow'),
    traceId: undefined,
    spanId: undefined,
    parentSpanId: null,
    traceparent: undefined,
  };
}

function summarizeChannels(channels: ChannelRecord[]): ChannelReleaseSchedulerOverview['summary'] {
  return {
    total_channels: channels.length,
    automation_enabled_channel_count: channels.filter(isAutomationCandidate).length,
    self_healing_enabled_channel_count: channels.filter(isSelfHealingCandidate).length,
    active_batch_channel_count: channels.filter(hasCurrentBatch).length,
    rollback_ready_channel_count: channels.filter(hasRollbackPoint).length,
  };
}

function isAutomationCandidate(channel: ChannelRecord) {
  const config = normalizeConfig(channel.config);
  const policy = asRecord(config.release_automation_policy);

  return channel.status === 'ACTIVE' && policy.enabled === true;
}

function isSelfHealingCandidate(channel: ChannelRecord) {
  const config = normalizeConfig(channel.config);
  const policy = asRecord(config.release_self_healing_policy);

  return channel.status === 'ACTIVE' && policy.enabled === true;
}

function hasCurrentBatch(channel: ChannelRecord) {
  const config = normalizeConfig(channel.config);
  const pipeline = asRecord(config.release_pipeline);
  const batch = asRecord(pipeline.current_batch);

  return typeof batch.batch_id === 'string' && batch.batch_id.length > 0;
}

function hasRollbackPoint(channel: ChannelRecord) {
  const config = normalizeConfig(channel.config);
  const control = asRecord(config.publish_control);

  return control.rollback_available === true;
}

function normalizeConfig(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return value as Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return value as Record<string, unknown>;
}

function schedulerSummary(result: ChannelReleaseSchedulerRunResult) {
  return `渠道发布巡检完成：扫描 ${result.scanned_channel_count} 个渠道，派发 ${result.dispatched_count} 个任务，成功 ${result.success_count}，失败 ${result.failed_count}。`;
}
