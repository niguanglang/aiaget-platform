import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

import {
  expandPermissionCodes,
  type AgentStatus,
  type ChannelPublishApprovalInput,
  type ChannelPublishControl,
  type ChannelPublishRolloutInput,
  type ChannelReleaseAutomationDecision,
  type ChannelReleaseAutomationOverview,
  type ChannelReleaseAutomationPolicy,
  type ChannelReleaseAutomationPolicyInput,
  type ChannelReleaseAutomationRunResult,
  type ChannelReleaseBatch,
  type ChannelReleaseBatchInput,
  type ChannelReleaseBatchStatus,
  type ChannelReleaseGateEvaluation,
  type ChannelReleaseGateMetrics,
  type ChannelReleaseGateOverview,
  type ChannelReleaseGatePolicy,
  type ChannelReleaseGatePolicyInput,
  type ChannelReleasePipeline,
  type ChannelReleasePipelineStep,
  type ChannelReleaseSelfHealingDecision,
  type ChannelReleaseSelfHealingEvaluation,
  type ChannelReleaseSelfHealingMetrics,
  type ChannelReleaseSelfHealingOverview,
  type ChannelReleaseSelfHealingPolicy,
  type ChannelReleaseSelfHealingPolicyInput,
  type ChannelReleaseSelfHealingRunResult,
  type ChannelReleaseReport,
  type ChannelReleaseReportMetric,
  type ChannelReleaseReportDiffItem,
  type ChannelReleaseReportRiskItem,
  type ChannelReleaseReportSeverity,
  type ChannelReleaseReportSnapshotCompareResult,
  type ChannelReleaseReportSnapshotDetail,
  type ChannelReleaseReportSnapshotListItem,
  type ChannelReleaseReportSnapshotOverview,
  type ChannelReleaseReportTimelineItem,
  type ChannelSenderPolicy,
  type PlatformEventListItem,
  type PublishChannelHealthStatus,
  type PublishChannelListItem,
  type PublishChannelOverview,
  type PublishChannelStatus,
  type PublishChannelType,
  type UpdateChannelPublishControlInput,
  type UpdateChannelSenderPolicyInput,
  type UpdatePublishChannelInput,
  type UpsertPublishChannelInput,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { DataScopeQueryService, mergeDataScopeWhere } from '../common/services/data-scope-query.service';
import { encryptSecret, maskApiKey } from '../models/model-secrets';
import { ExternalChannelRolloutGateService } from '../external-api/external-channel-rollout-gate.service';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';

const channelInclude = {
  agent: true,
  account: {
    include: {
      provider: true,
    },
  },
  routeRule: {
    include: {
      provider: true,
      account: {
        include: {
          provider: true,
        },
      },
      agent: true,
    },
  },
} satisfies Prisma.AgentPublishChannelInclude;

const runtimeUserInclude = {
  userRoles: {
    where: {
      deletedAt: null,
      role: {
        status: 'ACTIVE',
        deletedAt: null,
      },
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            where: {
              deletedAt: null,
            },
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

type ChannelRecord = Prisma.AgentPublishChannelGetPayload<{ include: typeof channelInclude }>;
type RuntimeUserRecord = Prisma.UserGetPayload<{ include: typeof runtimeUserInclude }>;
type UsageRecord = Prisma.PlatformUsageEventGetPayload<object>;
type EventRecord = Prisma.PlatformEventGetPayload<object>;
type ReleaseAutomationWorkflowContext = {
  workflowBackend?: 'LOCAL' | 'LOCAL_FALLBACK' | 'TEMPORAL' | null;
  workflowId?: string | null;
  workflowRunId?: string | null;
};
type ReleaseSelfHealingWorkflowContext = {
  workflowBackend?: 'LOCAL' | 'LOCAL_FALLBACK' | 'TEMPORAL' | null;
  workflowId?: string | null;
  workflowRunId?: string | null;
};
type ChannelPublishJobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'CANCELED';
type ChannelPublishJobRelationSummary = {
  publishChannelId: string;
  publishChannelName: string | null;
  providerId: string | null;
  providerName: string | null;
  accountId: string | null;
  accountName: string | null;
  templateId: string | null;
  templateName: string | null;
  routeRuleId: string | null;
  routeRuleName: string | null;
};
type ChannelPublishJobWriteInput = {
  jobKey: string;
  jobType: string;
  title: string;
  status: ChannelPublishJobStatus;
  progress?: number;
  requestPayload?: Record<string, unknown> | null;
  resultPayload?: Record<string, unknown> | null;
  errorMessage?: string | null;
  scheduledAt?: Date | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
};

@Injectable()
export class ChannelsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DataScopeQueryService) private readonly dataScopeQuery: DataScopeQueryService,
    @Inject(ExternalChannelRolloutGateService) private readonly rolloutGate: ExternalChannelRolloutGateService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
  ) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<PublishChannelOverview> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const where = await this.buildChannelWhere(currentUser);

    const [channels, usageEvents, recentEvents] = await this.prisma.$transaction([
      this.prisma.agentPublishChannel.findMany({
        where,
        include: channelInclude,
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      this.prisma.platformUsageEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          resourceType: 'CHANNEL',
          occurredAt: {
            gte: since,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 3000,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          resourceType: 'CHANNEL',
          occurredAt: {
            gte: since,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 20,
      }),
    ]);

    const usageByChannel = summarizeUsageByResource(usageEvents);
    const items = channels.map((channel) => this.mapChannel(channel, usageByChannel.get(channel.id)));
    const activeChannels = items.filter((item) => item.status === 'ACTIVE');
    const totalRequests = items.reduce((total, item) => total + item.request_count_24h, 0);
    const weightedSuccess = items.reduce((total, item) => total + (item.request_count_24h * item.success_rate_24h), 0);
    const activeAgentCount = new Set(activeChannels.map((item) => item.agent_id)).size;

    return {
      generated_at: new Date().toISOString(),
      summary: {
        total_channels: items.length,
        active_channels: activeChannels.length,
        error_channels: items.filter((item) => item.status === 'ERROR' || item.health_status === 'UNAVAILABLE').length,
        total_requests_24h: totalRequests,
        success_rate_24h: totalRequests === 0 ? 0 : Number((weightedSuccess / totalRequests).toFixed(1)),
        active_agent_count: activeAgentCount,
      },
      channels: items,
      channel_mix: buildChannelMix(items),
      recent_events: recentEvents.map(mapPlatformEvent),
    };
  }

  async upsert(currentUser: AuthenticatedUser, input: UpsertPublishChannelInput): Promise<PublishChannelListItem> {
    const agent = await this.ensureAgent(currentUser, input.agent_id);
    await this.ensureChannelRelations(currentUser, input);
    const data = this.toChannelData(currentUser, input);
    const channel = await this.prisma.agentPublishChannel.upsert({
      where: {
        tenantId_agentId_channel: {
          tenantId: currentUser.tenantId,
          agentId: agent.id,
          channel: input.channel,
        },
      },
      create: {
        tenantId: currentUser.tenantId,
        agentId: agent.id,
        channel: input.channel,
        ...data,
        lastPublishedAt: input.status === 'ACTIVE' ? new Date() : null,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      update: {
        ...data,
        deletedAt: null,
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordPublishJob(currentUser, channel, {
      jobKey: buildPublishJobKey(channel.id, 'save', input),
      jobType: 'PUBLISH_SAVE',
      title: `保存发布渠道 ${channel.name ?? channel.channel}`,
      status: 'SUCCESS',
      progress: 100,
      requestPayload: summarizeChannelInput(input),
      resultPayload: {
        channel_status: channel.status,
        health_status: channel.healthStatus,
      },
    });
    await this.recordChannelEvent(currentUser, channel, 'channel.publish.saved', 'SUCCESS', `保存发布渠道 ${channel.name ?? channel.channel}`);

    return this.mapChannel(channel);
  }

  async update(currentUser: AuthenticatedUser, channelId: string, input: UpdatePublishChannelInput): Promise<PublishChannelListItem> {
    await this.ensureChannel(currentUser, channelId);
    await this.ensureChannelRelations(currentUser, input);
    const data = this.toChannelData(currentUser, input);
    const channel = await this.prisma.agentPublishChannel.update({
      where: {
        id: channelId,
      },
      data: {
        ...data,
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordPublishJob(currentUser, channel, {
      jobKey: buildPublishJobKey(channel.id, 'update', input),
      jobType: 'PUBLISH_UPDATE',
      title: `更新发布渠道 ${channel.name ?? channel.channel}`,
      status: 'SUCCESS',
      progress: 100,
      requestPayload: summarizeChannelInput(input),
      resultPayload: {
        channel_status: channel.status,
        health_status: channel.healthStatus,
      },
    });
    await this.recordChannelEvent(currentUser, channel, 'channel.publish.updated', 'SUCCESS', `更新发布渠道 ${channel.name ?? channel.channel}`);

    return this.mapChannel(channel);
  }

  async enable(currentUser: AuthenticatedUser, channelId: string): Promise<PublishChannelListItem> {
    const existing = await this.ensureChannel(currentUser, channelId);
    if (existing.agent.status !== 'PUBLISHED') {
      throw new BadRequestException('Only published agents can be enabled on channels');
    }
    const channel = await this.prisma.agentPublishChannel.update({
      where: {
        id: channelId,
      },
      data: {
        status: 'ACTIVE',
        lastPublishedAt: new Date(),
        healthStatus: 'HEALTHY',
        healthMessage: '渠道已启用，等待真实调用流量。',
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordPublishJob(currentUser, channel, {
      jobKey: buildPublishJobKey(channel.id, 'enable'),
      jobType: 'PUBLISH_ENABLE',
      title: `启用发布渠道 ${channel.name ?? channel.channel}`,
      status: 'SUCCESS',
      progress: 100,
      resultPayload: {
        channel_status: channel.status,
        health_status: channel.healthStatus,
      },
    });
    await this.recordChannelEvent(currentUser, channel, 'channel.publish.enabled', 'SUCCESS', `启用发布渠道 ${channel.name ?? channel.channel}`);

    return this.mapChannel(channel);
  }

  async disable(currentUser: AuthenticatedUser, channelId: string): Promise<PublishChannelListItem> {
    await this.ensureChannel(currentUser, channelId);
    const channel = await this.prisma.agentPublishChannel.update({
      where: {
        id: channelId,
      },
      data: {
        status: 'DISABLED',
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordPublishJob(currentUser, channel, {
      jobKey: buildPublishJobKey(channel.id, 'disable'),
      jobType: 'PUBLISH_DISABLE',
      title: `停用发布渠道 ${channel.name ?? channel.channel}`,
      status: 'CANCELED',
      progress: 100,
      resultPayload: {
        channel_status: channel.status,
      },
      errorMessage: '渠道已停用，发布生命周期已取消。',
    });
    await this.recordChannelEvent(currentUser, channel, 'channel.publish.disabled', 'SUCCESS', `停用发布渠道 ${channel.name ?? channel.channel}`);

    return this.mapChannel(channel);
  }

  async check(currentUser: AuthenticatedUser, channelId: string): Promise<PublishChannelListItem> {
    const existing = await this.ensureChannel(currentUser, channelId);
    const health = evaluateHealth(existing);
    const channel = await this.prisma.agentPublishChannel.update({
      where: {
        id: channelId,
      },
      data: {
        healthStatus: health.status,
        healthMessage: health.message,
        lastCheckedAt: new Date(),
        status: health.status === 'UNAVAILABLE' ? 'ERROR' : existing.status,
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordPublishJob(currentUser, channel, {
      jobKey: buildPublishJobKey(channel.id, 'health_check', hourlyJobWindow(channel.lastCheckedAt ?? new Date())),
      jobType: 'PUBLISH_HEALTH_CHECK',
      title: `检查发布渠道 ${channel.name ?? channel.channel}`,
      status: health.status === 'UNAVAILABLE' ? 'FAILED' : 'SUCCESS',
      progress: 100,
      resultPayload: {
        health_status: health.status,
        health_message: health.message,
        channel_status: channel.status,
      },
      errorMessage: health.status === 'UNAVAILABLE' ? health.message : null,
    });
    await this.recordChannelEvent(currentUser, channel, 'channel.publish.health_checked', health.status === 'UNAVAILABLE' ? 'FAILED' : 'SUCCESS', health.message);

    return this.mapChannel(channel);
  }

  async getSenderPolicy(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelSenderPolicy> {
    const channel = await this.ensureChannel(currentUser, channelId);

    return readSenderPolicy(channel.config, channel.updatedAt);
  }

  async updateSenderPolicy(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: UpdateChannelSenderPolicyInput,
  ): Promise<ChannelSenderPolicy> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const config = normalizeJson(channel.config) ?? {};
    const policy = normalizeSenderPolicy({
      ...readSenderPolicy(channel.config, channel.updatedAt),
      ...input,
    });
    const updatedConfig = {
      ...config,
      sender_policy: policy,
    };
    const updated = await this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        config: toJsonInput(updatedConfig),
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordChannelEvent(currentUser, updated, 'channel.sender_policy.updated', 'SUCCESS', `更新渠道投递策略 ${updated.name ?? updated.channel}`);

    return readSenderPolicy(updated.config, updated.updatedAt);
  }

  async getPublishControl(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelPublishControl> {
    const channel = await this.ensureChannel(currentUser, channelId);

    return readPublishControl(channel.config, channel.updatedAt);
  }

  async getRolloutGateOverview(currentUser: AuthenticatedUser, channelId: string) {
    await this.ensureChannel(currentUser, channelId);

    return this.rolloutGate.getOverview(currentUser, channelId);
  }

  async getReleasePipeline(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelReleasePipeline> {
    const channel = await this.ensureChannel(currentUser, channelId);

    return this.buildReleasePipeline(currentUser, channel);
  }

  async getReleaseReport(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelReleaseReport> {
    const channel = await this.ensureChannel(currentUser, channelId);

    return this.buildReleaseReport(currentUser, channel);
  }

  async listReleaseReportSnapshots(
    currentUser: AuthenticatedUser,
    channelId: string,
  ): Promise<ChannelReleaseReportSnapshotOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        resourceType: 'CHANNEL',
        resourceId: channel.id,
        eventType: 'channel.release_report.snapshot_created',
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 30,
    });
    const items = events
      .map((event) => mapReleaseReportSnapshotListItem(event))
      .filter((item): item is ChannelReleaseReportSnapshotListItem => Boolean(item));

    return {
      generated_at: new Date().toISOString(),
      channel_id: channel.id,
      total: items.length,
      items,
    };
  }

  async createReleaseReportSnapshot(
    currentUser: AuthenticatedUser,
    channelId: string,
  ): Promise<ChannelReleaseReportSnapshotDetail> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const report = await this.buildReleaseReport(currentUser, channel);
    const snapshotId = `release_report_${randomUUID().replaceAll('-', '').slice(0, 18)}`;
    const event = await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'CHANNEL',
      resourceId: channel.id,
      agentId: channel.agentId,
      channelId: channel.id,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      eventSource: 'CONTROL_API',
      eventType: 'channel.release_report.snapshot_created',
      status: 'SUCCESS',
      severity: report.summary.incident_level === 'CRITICAL' ? 'WARN' : 'INFO',
      billable: false,
      summary: `归档渠道发布复盘报告：${report.summary.conclusion}`,
      payloadJson: toJsonInput({
        snapshot_id: snapshotId,
        report,
      }) as Prisma.InputJsonValue,
      sourceSystem: 'channel_release_report',
      sourceId: snapshotId,
    });

    return mapReleaseReportSnapshotDetail(event, report);
  }

  async getReleaseReportSnapshot(
    currentUser: AuthenticatedUser,
    channelId: string,
    snapshotId: string,
  ): Promise<ChannelReleaseReportSnapshotDetail> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const event = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        resourceType: 'CHANNEL',
        resourceId: channel.id,
        eventType: 'channel.release_report.snapshot_created',
        sourceId: snapshotId,
      },
    });
    if (!event) {
      throw new NotFoundException('Release report snapshot not found');
    }
    const report = extractReleaseReportFromSnapshotEvent(event);
    if (!report) {
      throw new NotFoundException('Release report snapshot payload not found');
    }

    return mapReleaseReportSnapshotDetail(event, report);
  }

  async compareReleaseReportSnapshots(
    currentUser: AuthenticatedUser,
    channelId: string,
    baseSnapshotId: string,
    targetSnapshotId: string,
  ): Promise<ChannelReleaseReportSnapshotCompareResult> {
    if (baseSnapshotId === targetSnapshotId) {
      throw new BadRequestException('Choose two different release report snapshots');
    }
    const [base, target] = await Promise.all([
      this.getReleaseReportSnapshot(currentUser, channelId, baseSnapshotId),
      this.getReleaseReportSnapshot(currentUser, channelId, targetSnapshotId),
    ]);
    const summaryDiffs = filterChangedDiffItems(buildReleaseReportSummaryDiffs(base.report, target.report));
    const metricDiffs = filterChangedDiffItems(buildReleaseReportMetricDiffs(base.report, target.report));
    const riskDiffs = filterChangedDiffItems(buildReleaseReportRiskDiffs(base.report, target.report));
    const timelineDiffs = filterChangedDiffItems(buildReleaseReportTimelineDiffs(base.report, target.report));
    const allDiffs = [...summaryDiffs, ...metricDiffs, ...riskDiffs, ...timelineDiffs];
    const changed = allDiffs.filter((item) => item.kind === 'CHANGED').length;
    const added = allDiffs.filter((item) => item.kind === 'ADDED').length;
    const removed = allDiffs.filter((item) => item.kind === 'REMOVED').length;
    const critical = allDiffs.filter((item) => item.severity === 'CRITICAL' && item.kind !== 'UNCHANGED').length;

    return {
      generated_at: new Date().toISOString(),
      channel_id: base.channel_id,
      base_snapshot: snapshotDetailToListItem(base),
      target_snapshot: snapshotDetailToListItem(target),
      summary: {
        changed_count: changed,
        added_count: added,
        removed_count: removed,
        critical_change_count: critical,
        conclusion: buildReleaseReportCompareConclusion(changed, added, removed, critical),
      },
      summary_diffs: summaryDiffs,
      metric_diffs: metricDiffs,
      risk_diffs: riskDiffs,
      timeline_diffs: timelineDiffs,
    };
  }

  async getReleaseGate(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelReleaseGateOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);

    return this.buildReleaseGateOverview(currentUser, channel, false);
  }

  async updateReleaseGate(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelReleaseGatePolicyInput,
  ): Promise<ChannelReleaseGateOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const current = readReleaseGatePolicy(channel.config, channel.updatedAt);
    const policy = normalizeReleaseGatePolicy({
      ...current,
      enabled: typeof input.enabled === 'boolean' ? input.enabled : current.enabled,
      min_evaluated_count: input.min_evaluated_count ?? current.min_evaluated_count,
      min_allowed_rate: input.min_allowed_rate ?? current.min_allowed_rate,
      max_blocked_count: input.max_blocked_count ?? current.max_blocked_count,
      auto_promote_enabled: typeof input.auto_promote_enabled === 'boolean' ? input.auto_promote_enabled : current.auto_promote_enabled,
      observation_window_hours: input.observation_window_hours ?? current.observation_window_hours,
      updated_at: new Date().toISOString(),
    });
    const updated = await this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        config: toJsonInput({
          ...(normalizeJson(channel.config) ?? {}),
          release_gate_policy: withoutUpdatedAt(policy),
        }),
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordChannelEvent(
      currentUser,
      updated,
      'channel.release_gate.policy_updated',
      'SUCCESS',
      `更新渠道发布观测门禁 ${updated.name ?? updated.channel}`,
      {
        policy: withoutUpdatedAt(policy),
      },
    );

    return this.buildReleaseGateOverview(currentUser, updated, false);
  }

  async evaluateReleaseGate(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelReleaseGateOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);

    return this.buildReleaseGateOverview(currentUser, channel, true);
  }

  async getReleaseAutomation(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelReleaseAutomationOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);

    return this.buildReleaseAutomationOverview(currentUser, channel);
  }

  async updateReleaseAutomation(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelReleaseAutomationPolicyInput,
  ): Promise<ChannelReleaseAutomationOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const current = readReleaseAutomationPolicy(channel.config, channel.updatedAt);
    const policy = normalizeReleaseAutomationPolicy({
      ...current,
      enabled: typeof input.enabled === 'boolean' ? input.enabled : current.enabled,
      require_auto_promote_policy: typeof input.require_auto_promote_policy === 'boolean'
        ? input.require_auto_promote_policy
        : current.require_auto_promote_policy,
      min_interval_minutes: input.min_interval_minutes ?? current.min_interval_minutes,
      max_runs_per_day: input.max_runs_per_day ?? current.max_runs_per_day,
      dry_run: typeof input.dry_run === 'boolean' ? input.dry_run : current.dry_run,
      updated_at: new Date().toISOString(),
    });
    const updated = await this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        config: toJsonInput({
          ...(normalizeJson(channel.config) ?? {}),
          release_automation_policy: withoutReleaseAutomationUpdatedAt(policy),
        }),
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordChannelEvent(
      currentUser,
      updated,
      'channel.release_automation.policy_updated',
      'SUCCESS',
      `更新渠道自动推进执行器 ${updated.name ?? updated.channel}`,
      {
        policy: withoutReleaseAutomationUpdatedAt(policy),
      },
    );

    return this.buildReleaseAutomationOverview(currentUser, updated);
  }

  async runReleaseAutomation(
    currentUser: AuthenticatedUser,
    channelId: string,
    workflowContext: ReleaseAutomationWorkflowContext = {},
  ): Promise<ChannelReleaseAutomationOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);
    await this.executeReleaseAutomation(currentUser, channel, 'MANUAL', workflowContext);
    const updated = await this.ensureChannel(currentUser, channelId);

    return this.buildReleaseAutomationOverview(currentUser, updated);
  }

  async getReleaseSelfHealing(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelReleaseSelfHealingOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);

    return this.buildReleaseSelfHealingOverview(currentUser, channel);
  }

  async updateReleaseSelfHealing(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelReleaseSelfHealingPolicyInput,
  ): Promise<ChannelReleaseSelfHealingOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const current = readReleaseSelfHealingPolicy(channel.config, channel.updatedAt);
    const policy = normalizeReleaseSelfHealingPolicy({
      ...current,
      enabled: typeof input.enabled === 'boolean' ? input.enabled : current.enabled,
      dry_run: typeof input.dry_run === 'boolean' ? input.dry_run : current.dry_run,
      auto_rollback_enabled: typeof input.auto_rollback_enabled === 'boolean'
        ? input.auto_rollback_enabled
        : current.auto_rollback_enabled,
      max_error_requests: input.max_error_requests ?? current.max_error_requests,
      min_allowed_rate: input.min_allowed_rate ?? current.min_allowed_rate,
      observation_window_hours: input.observation_window_hours ?? current.observation_window_hours,
      cooldown_minutes: input.cooldown_minutes ?? current.cooldown_minutes,
      updated_at: new Date().toISOString(),
    });
    const updated = await this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        config: toJsonInput({
          ...(normalizeJson(channel.config) ?? {}),
          release_self_healing_policy: withoutReleaseSelfHealingUpdatedAt(policy),
        }),
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordChannelEvent(
      currentUser,
      updated,
      'channel.release_self_healing.policy_updated',
      'SUCCESS',
      `更新渠道发布自愈策略 ${updated.name ?? updated.channel}`,
      {
        policy: withoutReleaseSelfHealingUpdatedAt(policy),
      },
    );

    return this.buildReleaseSelfHealingOverview(currentUser, updated);
  }

  async runReleaseSelfHealing(
    currentUser: AuthenticatedUser,
    channelId: string,
    workflowContext: ReleaseSelfHealingWorkflowContext = {},
  ): Promise<ChannelReleaseSelfHealingOverview> {
    const channel = await this.ensureChannel(currentUser, channelId);
    await this.executeReleaseSelfHealing(currentUser, channel, workflowContext);
    const updated = await this.ensureChannel(currentUser, channelId);

    return this.buildReleaseSelfHealingOverview(currentUser, updated);
  }

  async runWorkflowReleaseAutomation(
    channelId: string,
    workflowContext: ReleaseAutomationWorkflowContext = {},
  ): Promise<ChannelReleaseAutomationRunResult | null> {
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        id: channelId,
        deletedAt: null,
      },
      include: channelInclude,
    });
    if (!channel) {
      throw new NotFoundException('Publish channel not found');
    }
    const user = await this.resolveAutomationWorkflowUser(channel);
    const result = await this.executeReleaseAutomation(user, channel, 'SCHEDULED', {
      workflowBackend: workflowContext.workflowBackend ?? 'TEMPORAL',
      workflowId: workflowContext.workflowId ?? null,
      workflowRunId: workflowContext.workflowRunId ?? null,
    });

    return result;
  }

  async runWorkflowReleaseSelfHealing(
    channelId: string,
    workflowContext: ReleaseSelfHealingWorkflowContext = {},
  ): Promise<ChannelReleaseSelfHealingRunResult | null> {
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        id: channelId,
        deletedAt: null,
      },
      include: channelInclude,
    });
    if (!channel) {
      throw new NotFoundException('Publish channel not found');
    }
    const user = await this.resolveAutomationWorkflowUser(channel);
    const result = await this.executeReleaseSelfHealing(user, channel, {
      workflowBackend: workflowContext.workflowBackend ?? 'TEMPORAL',
      workflowId: workflowContext.workflowId ?? null,
      workflowRunId: workflowContext.workflowRunId ?? null,
    });

    return result;
  }

  async recordReleaseSelfHealingDispatchFailure(currentUser: AuthenticatedUser, channelId: string, message: string) {
    const channel = await this.ensureChannel(currentUser, channelId);
    const startedAt = new Date();
    const policy = readReleaseSelfHealingPolicy(channel.config, channel.updatedAt);
    const control = readPublishControl(channel.config, channel.updatedAt);
    const pipeline = readReleasePipeline(channel.config);
    const lastAutomationRun = readReleaseAutomationLastRun(channel.config);
    const metrics = await this.getReleaseSelfHealingMetrics(currentUser, channel.id, policy.observation_window_hours);
    const evaluation = evaluateReleaseSelfHealingPolicy(policy, channel, control, pipeline.current_batch, lastAutomationRun, metrics);
    const result = buildReleaseSelfHealingRunResult(channel.id, 'FAILED', startedAt, {
      batch_id: evaluation.current_batch?.batch_id ?? null,
      dry_run: policy.dry_run,
      reason: '渠道发布自愈工作流派发失败。',
      error_message: message,
      workflow_backend: 'TEMPORAL',
      workflow_id: null,
      workflow_run_id: null,
    });
    const saved = await this.storeReleaseSelfHealingRun(currentUser, channel.id, result);
    await this.recordPublishJob(currentUser, channel, {
      jobKey: buildPublishJobKey(channel.id, 'release_self_healing_dispatch_failed', message),
      jobType: 'RELEASE_SELF_HEALING',
      title: `渠道发布自愈工作流派发失败 ${channel.name ?? channel.channel}`,
      status: 'FAILED',
      progress: 100,
      resultPayload: {
        run: saved,
        evaluation,
      },
      errorMessage: message,
      startedAt,
    }, {
      workflow_backend: 'TEMPORAL',
    });
    await this.recordChannelEvent(
      currentUser,
      channel,
      'channel.release_self_healing.workflow_dispatch_failed',
      'FAILED',
      `渠道发布自愈工作流派发失败：${message}`,
      {
        run: saved,
      },
    );
  }

  async recordReleaseAutomationDispatchFailure(
    currentUser: AuthenticatedUser,
    channelId: string,
    message: string,
  ) {
    const channel = await this.ensureChannel(currentUser, channelId);
    const startedAt = new Date();
    const gatePolicy = readReleaseGatePolicy(channel.config, channel.updatedAt);
    const pipeline = readReleasePipeline(channel.config);
    const metrics = await this.getReleaseGateMetrics(currentUser, channel.id, gatePolicy.observation_window_hours);
    const gate = evaluateReleaseGatePolicy(gatePolicy, pipeline.current_batch, metrics);
    const result = buildReleaseAutomationRunResult(channel.id, 'SCHEDULED', 'FAILED', startedAt, {
      batch_id: gate.current_batch?.batch_id ?? null,
      dry_run: readReleaseAutomationPolicy(channel.config, channel.updatedAt).dry_run,
      gate_decision: gate.decision,
      reason: '渠道自动推进工作流派发失败。',
      error_message: message,
      workflow_backend: 'TEMPORAL',
      workflow_id: null,
      workflow_run_id: null,
    });
    const saved = await this.storeReleaseAutomationRun(currentUser, channel.id, result);
    await this.recordPublishJob(currentUser, channel, {
      jobKey: buildPublishJobKey(channel.id, 'release_automation_dispatch_failed', message),
      jobType: 'RELEASE_AUTOMATION',
      title: `渠道自动推进工作流派发失败 ${channel.name ?? channel.channel}`,
      status: 'FAILED',
      progress: 100,
      resultPayload: {
        run: saved,
        gate,
      },
      errorMessage: message,
      startedAt,
    }, {
      workflow_backend: 'TEMPORAL',
    });
    await this.recordChannelEvent(
      currentUser,
      channel,
      'channel.release_automation.workflow_dispatch_failed',
      'FAILED',
      `渠道自动推进工作流派发失败：${message}`,
      {
        run: saved,
      },
    );
  }

  async startReleaseBatch(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelReleaseBatchInput,
  ): Promise<ChannelReleasePipeline> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const pipeline = readReleasePipeline(channel.config);
    if (pipeline.current_batch && !isReleaseBatchClosed(pipeline.current_batch.status)) {
      throw new BadRequestException('当前渠道已有进行中的发布批次');
    }

    const batch: ChannelReleaseBatch = {
      batch_id: createReleaseBatchId(),
      title: nullableText(input.title) ?? `${channel.name ?? defaultChannelName(channel.channel as PublishChannelType)} 发布批次`,
      status: 'PENDING_APPROVAL',
      target_rollout_percentage: clampInteger(input.target_rollout_percentage, 0, 100, 30),
      started_by: currentUser.id,
      started_at: new Date().toISOString(),
      completed_at: null,
      aborted_at: null,
      rollback_at: null,
      note: nullableText(input.note),
    };
    const updated = await this.updateReleasePipelineConfig(currentUser, channel, {
      current_batch: batch,
      recent_batches: [batch, ...pipeline.recent_batches].slice(0, 8),
    });

    await this.recordPublishJob(currentUser, updated, {
      jobKey: buildPublishJobKey(channel.id, 'release_batch_start', batch.batch_id),
      jobType: 'RELEASE_BATCH_START',
      title: `创建渠道发布批次 ${batch.title}`,
      status: 'PENDING',
      progress: 10,
      requestPayload: {
        batch_id: batch.batch_id,
        target_rollout_percentage: batch.target_rollout_percentage,
        note: batch.note,
      },
      resultPayload: {
        batch_status: batch.status,
      },
      scheduledAt: new Date(batch.started_at),
      startedAt: new Date(batch.started_at),
      finishedAt: null,
    }, {
      batch_id: batch.batch_id,
    });
    await this.recordChannelEvent(
      currentUser,
      updated,
      'channel.release_batch.started',
      'SUCCESS',
      `创建渠道发布批次 ${batch.title}`,
      {
        batch_id: batch.batch_id,
        target_rollout_percentage: batch.target_rollout_percentage,
        note: batch.note,
      },
    );

    return this.buildReleasePipeline(currentUser, updated);
  }

  async markReleaseFull(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelReleaseBatchInput,
  ): Promise<ChannelReleasePipeline> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const pipeline = readReleasePipeline(channel.config);
    if (!pipeline.current_batch || isReleaseBatchClosed(pipeline.current_batch.status)) {
      throw new BadRequestException('当前渠道没有进行中的发布批次');
    }

    const batch: ChannelReleaseBatch = {
      ...pipeline.current_batch,
      status: 'FULL',
      target_rollout_percentage: 100,
      completed_at: new Date().toISOString(),
      note: nullableText(input.note) ?? pipeline.current_batch.note,
    };
    const currentControl = readPublishControl(channel.config, channel.updatedAt);
    const nextControl = normalizePublishControl({
      ...currentControl,
      rollout_enabled: true,
      rollout_percentage: 100,
      rollout_status: 'FULL',
      rollback_available: true,
      last_stable_status: currentControl.last_stable_status ?? channel.status,
      last_stable_config: currentControl.last_stable_config ?? snapshotStableConfig(channel.config),
    });
    const updated = await this.updateReleasePipelineConfig(currentUser, channel, {
      current_batch: batch,
      recent_batches: replaceReleaseBatch(pipeline.recent_batches, batch),
      publish_control: nextControl,
    });

    await this.recordPublishJob(currentUser, updated, {
      jobKey: buildPublishJobKey(channel.id, 'release_batch_full', batch.batch_id),
      jobType: 'RELEASE_BATCH_FULL',
      title: `渠道发布批次全量 ${batch.title}`,
      status: 'SUCCESS',
      progress: 100,
      requestPayload: {
        batch_id: batch.batch_id,
        note: batch.note,
      },
      resultPayload: {
        batch_status: batch.status,
        rollout_percentage: 100,
      },
      startedAt: new Date(batch.started_at),
      finishedAt: batch.completed_at ? new Date(batch.completed_at) : new Date(),
    }, {
      batch_id: batch.batch_id,
    });
    await this.recordChannelEvent(
      currentUser,
      updated,
      'channel.release_batch.full',
      'SUCCESS',
      `渠道发布批次已全量 ${batch.title}`,
      {
        batch_id: batch.batch_id,
        note: batch.note,
      },
    );

    return this.buildReleasePipeline(currentUser, updated);
  }

  async abortReleaseBatch(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelReleaseBatchInput,
  ): Promise<ChannelReleasePipeline> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const pipeline = readReleasePipeline(channel.config);
    if (!pipeline.current_batch || isReleaseBatchClosed(pipeline.current_batch.status)) {
      throw new BadRequestException('当前渠道没有进行中的发布批次');
    }

    const batch: ChannelReleaseBatch = {
      ...pipeline.current_batch,
      status: 'ABORTED',
      aborted_at: new Date().toISOString(),
      note: nullableText(input.note) ?? pipeline.current_batch.note,
    };
    const updated = await this.updateReleasePipelineConfig(currentUser, channel, {
      current_batch: batch,
      recent_batches: replaceReleaseBatch(pipeline.recent_batches, batch),
    });

    await this.recordPublishJob(currentUser, updated, {
      jobKey: buildPublishJobKey(channel.id, 'release_batch_abort', batch.batch_id),
      jobType: 'RELEASE_BATCH_ABORT',
      title: `终止渠道发布批次 ${batch.title}`,
      status: 'CANCELED',
      progress: 100,
      requestPayload: {
        batch_id: batch.batch_id,
        note: batch.note,
      },
      resultPayload: {
        batch_status: batch.status,
      },
      errorMessage: '发布批次已终止。',
      startedAt: new Date(batch.started_at),
      finishedAt: batch.aborted_at ? new Date(batch.aborted_at) : new Date(),
    }, {
      batch_id: batch.batch_id,
    });
    await this.recordChannelEvent(
      currentUser,
      updated,
      'channel.release_batch.aborted',
      'FAILED',
      `终止渠道发布批次 ${batch.title}`,
      {
        batch_id: batch.batch_id,
        note: batch.note,
      },
    );

    return this.buildReleasePipeline(currentUser, updated);
  }

  async updatePublishControl(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: UpdateChannelPublishControlInput,
  ): Promise<ChannelPublishControl> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const current = readPublishControl(channel.config, channel.updatedAt);
    const next = normalizePublishControl({
      ...current,
      approval_required: typeof input.approval_required === 'boolean' ? input.approval_required : current.approval_required,
      approval_note: input.approval_note !== undefined ? nullableText(input.approval_note) : current.approval_note,
      approval_status: input.approval_required === false
        ? 'NOT_REQUIRED'
        : input.approval_required === true && current.approval_status === 'NOT_REQUIRED'
          ? 'PENDING'
          : current.approval_status,
    });
    const updated = await this.updatePublishControlConfig(
      currentUser,
      {
        ...channel,
        config: toJsonValue(updateCurrentReleaseBatch(channel.config, 'PENDING_APPROVAL')),
      },
      next,
    );

    await this.recordPublishJob(currentUser, updated, {
      jobKey: buildPublishJobKey(channel.id, 'publish_control_update', {
        approval_required: next.approval_required,
        approval_status: next.approval_status,
      }),
      jobType: 'PUBLISH_CONTROL_UPDATE',
      title: `更新渠道发布控制 ${updated.name ?? updated.channel}`,
      status: 'SUCCESS',
      progress: 100,
      requestPayload: {
        approval_required: input.approval_required,
        approval_note: input.approval_note,
      },
      resultPayload: {
        approval_required: next.approval_required,
        approval_status: next.approval_status,
      },
    });
    await this.recordChannelEvent(currentUser, updated, 'channel.publish_control.updated', 'SUCCESS', `更新渠道发布控制 ${updated.name ?? updated.channel}`);

    return readPublishControl(updated.config, updated.updatedAt);
  }

  async requestPublishApproval(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelPublishApprovalInput,
  ): Promise<ChannelPublishControl> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const control = readPublishControl(channel.config, channel.updatedAt);
    if (!control.approval_required) {
      throw new BadRequestException('当前渠道未开启发布审批要求');
    }
    const next = normalizePublishControl({
      ...control,
      approval_status: 'PENDING',
      approval_note: nullableText(input.note) ?? control.approval_note,
      requested_by: currentUser.id,
      requested_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
      decision_note: null,
      last_stable_status: channel.status,
      last_stable_config: snapshotStableConfig(channel.config),
      rollback_available: true,
    });
    const updated = await this.updatePublishControlConfig(currentUser, channel, next);

    await this.recordPublishJob(currentUser, updated, {
      jobKey: buildPublishJobKey(channel.id, 'approval_request', next.requested_at ?? new Date().toISOString()),
      jobType: 'PUBLISH_APPROVAL_REQUEST',
      title: `发起渠道发布审批 ${updated.name ?? updated.channel}`,
      status: 'PENDING',
      progress: 25,
      requestPayload: {
        note: input.note,
      },
      resultPayload: {
        approval_status: next.approval_status,
        requested_at: next.requested_at,
        requested_by: next.requested_by,
      },
      scheduledAt: next.requested_at ? new Date(next.requested_at) : new Date(),
      startedAt: next.requested_at ? new Date(next.requested_at) : new Date(),
      finishedAt: null,
    });
    await this.recordChannelEvent(currentUser, updated, 'channel.publish_control.approval_requested', 'SUCCESS', `发起渠道发布审批 ${updated.name ?? updated.channel}`);

    return readPublishControl(updated.config, updated.updatedAt);
  }

  async approvePublish(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelPublishApprovalInput,
  ): Promise<ChannelPublishControl> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const control = readPublishControl(channel.config, channel.updatedAt);
    if (control.approval_required && control.approval_status !== 'PENDING') {
      throw new BadRequestException('只有待审批的渠道发布请求可以通过');
    }
    const next = normalizePublishControl({
      ...control,
      approval_status: 'APPROVED',
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      decision_note: nullableText(input.note),
      rollback_available: true,
      last_stable_status: channel.status,
      last_stable_config: snapshotStableConfig(channel.config),
    });
    const updated = await this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        healthMessage: '发布审批已通过，渠道已进入可发布状态。',
        lastPublishedAt: new Date(),
        config: toJsonInput(withPublishControl(toJsonValue(updateCurrentReleaseBatch(channel.config, 'APPROVED')), next)),
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordPublishJob(currentUser, updated, {
      jobKey: buildPublishJobKey(channel.id, 'approval_approve', next.reviewed_at ?? new Date().toISOString()),
      jobType: 'PUBLISH_APPROVAL_APPROVE',
      title: `通过渠道发布审批 ${updated.name ?? updated.channel}`,
      status: 'SUCCESS',
      progress: 55,
      requestPayload: {
        note: input.note,
      },
      resultPayload: {
        approval_status: next.approval_status,
        reviewed_at: next.reviewed_at,
        reviewed_by: next.reviewed_by,
        channel_status: updated.status,
      },
      startedAt: next.reviewed_at ? new Date(next.reviewed_at) : new Date(),
    });
    await this.recordChannelEvent(currentUser, updated, 'channel.publish_control.approved', 'SUCCESS', `通过渠道发布审批 ${updated.name ?? updated.channel}`);

    return readPublishControl(updated.config, updated.updatedAt);
  }

  async rejectPublish(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelPublishApprovalInput,
  ): Promise<ChannelPublishControl> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const control = readPublishControl(channel.config, channel.updatedAt);
    if (control.approval_required && control.approval_status !== 'PENDING') {
      throw new BadRequestException('只有待审批的渠道发布请求可以拒绝');
    }
    const next = normalizePublishControl({
      ...control,
      approval_status: 'REJECTED',
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      decision_note: nullableText(input.note),
      rollout_enabled: false,
      rollout_percentage: 0,
      rollout_status: 'CLOSED',
    });
    const updated = await this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        status: 'DISABLED',
        healthStatus: 'UNKNOWN',
        healthMessage: '发布审批已拒绝，渠道已停用。',
        config: toJsonInput(withPublishControl(toJsonValue(updateCurrentReleaseBatch(channel.config, 'ABORTED')), next)),
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordPublishJob(currentUser, updated, {
      jobKey: buildPublishJobKey(channel.id, 'approval_reject', next.reviewed_at ?? new Date().toISOString()),
      jobType: 'PUBLISH_APPROVAL_REJECT',
      title: `拒绝渠道发布审批 ${updated.name ?? updated.channel}`,
      status: 'FAILED',
      progress: 100,
      requestPayload: {
        note: input.note,
      },
      resultPayload: {
        approval_status: next.approval_status,
        reviewed_at: next.reviewed_at,
        reviewed_by: next.reviewed_by,
        channel_status: updated.status,
      },
      errorMessage: next.decision_note ?? '发布审批已拒绝。',
      startedAt: next.reviewed_at ? new Date(next.reviewed_at) : new Date(),
    });
    await this.recordChannelEvent(currentUser, updated, 'channel.publish_control.rejected', 'FAILED', `拒绝渠道发布审批 ${updated.name ?? updated.channel}`);

    return readPublishControl(updated.config, updated.updatedAt);
  }

  async updateRollout(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelPublishRolloutInput,
  ): Promise<ChannelPublishControl> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const control = readPublishControl(channel.config, channel.updatedAt);
    if (control.approval_required && control.approval_status !== 'APPROVED') {
      throw new BadRequestException('渠道发布审批通过后才能调整灰度比例');
    }
    const percentage = clampInteger(input.rollout_percentage, 0, 100, control.rollout_percentage);
    const rolloutEnabled = typeof input.rollout_enabled === 'boolean' ? input.rollout_enabled : percentage > 0;
    const next = normalizePublishControl({
      ...control,
      rollout_enabled: rolloutEnabled,
      rollout_percentage: rolloutEnabled ? percentage : 0,
      rollout_status: rolloutEnabled ? percentage >= 100 ? 'FULL' : percentage > 0 ? 'GRAY' : 'CLOSED' : 'CLOSED',
      rollback_available: true,
      last_stable_status: control.last_stable_status ?? channel.status,
      last_stable_config: control.last_stable_config ?? snapshotStableConfig(channel.config),
    });
    const updated = await this.updatePublishControlConfig(
      currentUser,
      {
        ...channel,
        config: toJsonValue(updateCurrentReleaseBatch(channel.config, next.rollout_status === 'FULL' ? 'FULL' : next.rollout_status === 'GRAY' ? 'GRAY' : undefined)),
      },
      next,
    );

    await this.recordPublishJob(currentUser, updated, {
      jobKey: buildPublishJobKey(channel.id, 'rollout_update', {
        percentage: next.rollout_percentage,
        enabled: next.rollout_enabled,
        status: next.rollout_status,
      }),
      jobType: 'PUBLISH_ROLLOUT_UPDATE',
      title: `更新渠道灰度比例 ${next.rollout_percentage}%`,
      status: next.rollout_enabled ? (next.rollout_status === 'FULL' ? 'SUCCESS' : 'RUNNING') : 'SKIPPED',
      progress: next.rollout_enabled ? Math.max(next.rollout_percentage, 60) : 100,
      requestPayload: {
        rollout_enabled: input.rollout_enabled,
        rollout_percentage: input.rollout_percentage,
      },
      resultPayload: {
        rollout_enabled: next.rollout_enabled,
        rollout_percentage: next.rollout_percentage,
        rollout_status: next.rollout_status,
      },
      finishedAt: next.rollout_status === 'GRAY' ? null : new Date(),
    });
    await this.recordChannelEvent(currentUser, updated, 'channel.publish_control.rollout_updated', 'SUCCESS', `更新渠道灰度比例 ${next.rollout_percentage}%`);

    return readPublishControl(updated.config, updated.updatedAt);
  }

  async rollbackPublish(
    currentUser: AuthenticatedUser,
    channelId: string,
    input: ChannelPublishApprovalInput,
  ): Promise<ChannelPublishControl> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const control = readPublishControl(channel.config, channel.updatedAt);
    if (!control.rollback_available) {
      throw new BadRequestException('当前渠道没有可回滚的稳定版本');
    }
    const stableConfig = control.last_stable_config ?? normalizeJson(channel.config) ?? {};
    const next = normalizePublishControl({
      ...control,
      approval_status: control.approval_required ? 'APPROVED' : 'NOT_REQUIRED',
      decision_note: nullableText(input.note) ?? control.decision_note,
      rollout_enabled: false,
      rollout_percentage: 0,
      rollout_status: 'CLOSED',
      last_rollback_at: new Date().toISOString(),
      last_rollback_by: currentUser.id,
      rollback_available: false,
    });
    const updated = await this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        status: control.last_stable_status ?? 'DISABLED',
        config: toJsonInput({
          ...stableConfig,
          ...withReleasePipeline(toJsonValue(updateCurrentReleaseBatch(channel.config, 'ROLLED_BACK'))),
          publish_control: next,
        }),
        healthStatus: 'UNKNOWN',
        healthMessage: '已回滚到最近稳定发布配置，请重新执行健康检查。',
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });

    await this.recordPublishJob(currentUser, updated, {
      jobKey: buildPublishJobKey(channel.id, 'rollback', next.last_rollback_at ?? new Date().toISOString()),
      jobType: 'PUBLISH_ROLLBACK',
      title: `回滚渠道发布 ${updated.name ?? updated.channel}`,
      status: 'SUCCESS',
      progress: 100,
      requestPayload: {
        note: input.note,
      },
      resultPayload: {
        rollback_at: next.last_rollback_at,
        rollback_by: next.last_rollback_by,
        channel_status: updated.status,
        rollout_status: next.rollout_status,
      },
      startedAt: next.last_rollback_at ? new Date(next.last_rollback_at) : new Date(),
    });
    await this.recordChannelEvent(currentUser, updated, 'channel.publish_control.rollback', 'SUCCESS', `回滚渠道发布 ${updated.name ?? updated.channel}`);

    return readPublishControl(updated.config, updated.updatedAt);
  }

  private async buildChannelWhere(currentUser: AuthenticatedUser): Promise<Prisma.AgentPublishChannelWhereInput> {
    const where: Prisma.AgentPublishChannelWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    const agentScope = await this.dataScopeQuery.buildWhere<Prisma.AgentWhereInput>(currentUser, 'AGENT');
    const agentWhere: Prisma.AgentWhereInput = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };
    mergeDataScopeWhere(agentWhere, agentScope.where);
    where.agent = agentWhere;

    return where;
  }

  private async ensureAgent(currentUser: AuthenticatedUser, agentId: string) {
    const where: Prisma.AgentWhereInput = {
      tenantId: currentUser.tenantId,
      id: agentId,
      deletedAt: null,
    };
    const agentScope = await this.dataScopeQuery.buildWhere<Prisma.AgentWhereInput>(currentUser, 'AGENT');
    mergeDataScopeWhere(where, agentScope.where);
    const agent = await this.prisma.agent.findFirst({ where });
    if (!agent) throw new NotFoundException('Agent not found');
    if (agent.status !== 'PUBLISHED') {
      throw new BadRequestException('Publish the agent before binding external channels');
    }

    return agent;
  }

  private async ensureChannel(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelRecord> {
    const where = await this.buildChannelWhere(currentUser);
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        ...where,
        id: channelId,
      },
      include: channelInclude,
    });
    if (!channel) throw new NotFoundException('Publish channel not found');

    return channel;
  }

  private async ensureChannelRelations(currentUser: AuthenticatedUser, input: UpdatePublishChannelInput | UpsertPublishChannelInput) {
    if (input.account_id) {
      const account = await this.prisma.channelAccount.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          id: input.account_id,
          deletedAt: null,
        },
      });
      if (!account) throw new NotFoundException('Channel account not found');
    }

    if (input.route_rule_id) {
      const routeRule = await this.prisma.channelRouteRule.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          id: input.route_rule_id,
          deletedAt: null,
        },
      });
      if (!routeRule) throw new NotFoundException('Channel route rule not found');
    }
  }

  private toChannelData(currentUser: AuthenticatedUser, input: UpdatePublishChannelInput | UpsertPublishChannelInput) {
    const secret = input.secret?.trim();

    return {
      ...(input.account_id !== undefined ? { accountId: input.account_id || null } : {}),
      ...(input.route_rule_id !== undefined ? { routeRuleId: input.route_rule_id || null } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.endpoint_url !== undefined ? { endpointUrl: input.endpoint_url?.trim() || null } : {}),
      ...(input.callback_url !== undefined ? { callbackUrl: input.callback_url?.trim() || null } : {}),
      ...(input.config !== undefined ? { config: toJsonInput(input.config) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(secret
        ? {
            secretEncrypted: encryptSecret(secret),
            secretMasked: maskApiKey(secret),
          }
        : {}),
      healthStatus: input.status === 'ACTIVE' ? 'HEALTHY' : undefined,
      healthMessage: input.status === 'ACTIVE' ? '渠道配置已保存并启用。' : undefined,
      lastPublishedAt: input.status === 'ACTIVE' ? new Date() : undefined,
      updatedBy: currentUser.id,
    } satisfies Prisma.AgentPublishChannelUpdateInput;
  }

  private mapChannel(channel: ChannelRecord, usage?: ChannelUsageSummary): PublishChannelListItem {
    const requestCount = usage?.requests ?? 0;
    const successRate = requestCount === 0 ? 0 : Number(((usage?.successes ?? 0) / requestCount * 100).toFixed(1));

    return {
      id: channel.id,
      tenant_id: channel.tenantId,
      agent_id: channel.agentId,
      agent: channel.agent
        ? {
            id: channel.agent.id,
            name: channel.agent.name,
            code: channel.agent.code,
            status: channel.agent.status as AgentStatus,
            version: channel.agent.version,
          }
        : null,
      channel: channel.channel as PublishChannelType,
      name: channel.name ?? defaultChannelName(channel.channel as PublishChannelType),
      description: channel.description,
      status: channel.status as PublishChannelStatus,
      endpoint_url: channel.endpointUrl,
      callback_url: channel.callbackUrl,
      secret_masked: channel.secretMasked,
      config: normalizeJson(channel.config),
      last_published_at: channel.lastPublishedAt?.toISOString() ?? null,
      last_checked_at: channel.lastCheckedAt?.toISOString() ?? null,
      health_status: channel.healthStatus as PublishChannelHealthStatus,
      health_message: channel.healthMessage,
      request_count_24h: requestCount,
      success_rate_24h: successRate,
      last_request_at: usage?.lastRequestAt?.toISOString() ?? null,
      created_at: channel.createdAt.toISOString(),
      updated_at: channel.updatedAt.toISOString(),
    };
  }

  private async updatePublishControlConfig(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
    control: Omit<ChannelPublishControl, 'updated_at'>,
  ): Promise<ChannelRecord> {
    return this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        config: toJsonInput(withPublishControl(channel.config, control)),
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });
  }

  private async updateReleasePipelineConfig(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
    patch: {
      current_batch?: ChannelReleaseBatch | null;
      recent_batches?: ChannelReleaseBatch[];
      publish_control?: Omit<ChannelPublishControl, 'updated_at'>;
    },
  ): Promise<ChannelRecord> {
    const config = normalizeJson(channel.config) ?? {};
    const current = readReleasePipeline(channel.config);
    const nextPipeline = normalizeReleasePipeline({
      current_batch: patch.current_batch !== undefined ? patch.current_batch : current.current_batch,
      recent_batches: patch.recent_batches ?? current.recent_batches,
    });

    return this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        config: toJsonInput({
          ...config,
          release_pipeline: nextPipeline,
          ...(patch.publish_control ? { publish_control: patch.publish_control } : {}),
        }),
        updatedBy: currentUser.id,
      },
      include: channelInclude,
    });
  }

  private async buildReleasePipeline(currentUser: AuthenticatedUser, channel: ChannelRecord): Promise<ChannelReleasePipeline> {
    const pipeline = readReleasePipeline(channel.config);
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        resourceType: 'CHANNEL',
        resourceId: channel.id,
        OR: [
          {
            eventType: {
              startsWith: 'channel.release_batch.',
            },
          },
          {
            eventType: {
              startsWith: 'channel.publish_control.',
            },
          },
        ],
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 12,
    });

    return {
      generated_at: new Date().toISOString(),
      channel_id: channel.id,
      current_batch: pipeline.current_batch,
      steps: buildReleaseSteps(channel, pipeline.current_batch, events),
      recent_batches: pipeline.recent_batches,
      recent_events: events.map(mapPlatformEvent),
      updated_at: channel.updatedAt.toISOString(),
    };
  }

  private async buildReleaseGateOverview(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
    recordEvent: boolean,
  ): Promise<ChannelReleaseGateOverview> {
    const policy = readReleaseGatePolicy(channel.config, channel.updatedAt);
    const pipeline = readReleasePipeline(channel.config);
    const [metrics, recentEvents] = await Promise.all([
      this.getReleaseGateMetrics(currentUser, channel.id, policy.observation_window_hours),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          resourceType: 'CHANNEL',
          resourceId: channel.id,
          eventType: {
            startsWith: 'channel.release_gate.',
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 8,
      }),
    ]);
    const evaluation = evaluateReleaseGatePolicy(policy, pipeline.current_batch, metrics);

    if (recordEvent) {
      await this.recordChannelEvent(
        currentUser,
        channel,
        'channel.release_gate.evaluated',
        evaluation.decision === 'BLOCKED' ? 'FAILED' : 'SUCCESS',
        `评估渠道发布观测门禁：${releaseGateDecisionLabel(evaluation.decision)}`,
        {
          decision: evaluation.decision,
          reason: evaluation.reason,
          eligible_for_full_release: evaluation.eligible_for_full_release,
          metrics,
          policy: withoutUpdatedAt(policy),
          batch_id: evaluation.current_batch?.batch_id ?? null,
        },
      );
    }

    return {
      generated_at: new Date().toISOString(),
      channel_id: channel.id,
      policy,
      evaluation,
      recent_events: recentEvents.map(mapPlatformEvent),
    };
  }

  private async buildReleaseAutomationOverview(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
  ): Promise<ChannelReleaseAutomationOverview> {
    const policy = readReleaseAutomationPolicy(channel.config, channel.updatedAt);
    const gatePolicy = readReleaseGatePolicy(channel.config, channel.updatedAt);
    const pipeline = readReleasePipeline(channel.config);
    const [metrics, recentEvents] = await Promise.all([
      this.getReleaseGateMetrics(currentUser, channel.id, gatePolicy.observation_window_hours),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          resourceType: 'CHANNEL',
          resourceId: channel.id,
          eventType: {
            startsWith: 'channel.release_automation.',
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 8,
      }),
    ]);
    const gate = evaluateReleaseGatePolicy(gatePolicy, pipeline.current_batch, metrics);
    const lastRun = readReleaseAutomationLastRun(channel.config);
    const todayRunCount = await this.countReleaseAutomationRunsToday(currentUser, channel.id);

    return {
      generated_at: new Date().toISOString(),
      channel_id: channel.id,
      policy,
      gate,
      current_batch: pipeline.current_batch,
      running: false,
      last_run: lastRun,
      today_run_count: todayRunCount,
      next_allowed_at: nextAutomationAllowedAt(lastRun, policy),
      recent_events: recentEvents.map(mapPlatformEvent),
    };
  }

  private async buildReleaseSelfHealingOverview(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
  ): Promise<ChannelReleaseSelfHealingOverview> {
    const policy = readReleaseSelfHealingPolicy(channel.config, channel.updatedAt);
    const [metrics, recentEvents] = await Promise.all([
      this.getReleaseSelfHealingMetrics(currentUser, channel.id, policy.observation_window_hours),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          resourceType: 'CHANNEL',
          resourceId: channel.id,
          eventType: {
            startsWith: 'channel.release_self_healing.',
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 8,
      }),
    ]);
    const control = readPublishControl(channel.config, channel.updatedAt);
    const pipeline = readReleasePipeline(channel.config);
    const lastAutomationRun = readReleaseAutomationLastRun(channel.config);
    const evaluation = evaluateReleaseSelfHealingPolicy(
      policy,
      channel,
      control,
      pipeline.current_batch,
      lastAutomationRun,
      metrics,
    );
    const lastRun = readReleaseSelfHealingLastRun(channel.config);

    return {
      generated_at: new Date().toISOString(),
      channel_id: channel.id,
      policy,
      evaluation,
      last_run: lastRun,
      next_allowed_at: nextSelfHealingAllowedAt(lastRun, policy),
      recent_events: recentEvents.map(mapPlatformEvent),
    };
  }

  private async buildReleaseReport(currentUser: AuthenticatedUser, channel: ChannelRecord): Promise<ChannelReleaseReport> {
    const windowHours = 72;
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const pipeline = readReleasePipeline(channel.config);
    const control = readPublishControl(channel.config, channel.updatedAt);
    const automationRun = readReleaseAutomationLastRun(channel.config);
    const selfHealingRun = readReleaseSelfHealingLastRun(channel.config);
    const [events, usageEvents] = await Promise.all([
      this.prisma.platformEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          resourceType: 'CHANNEL',
          resourceId: channel.id,
          occurredAt: {
            gte: since,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 80,
      }),
      this.prisma.platformUsageEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          resourceType: 'CHANNEL',
          resourceId: channel.id,
          occurredAt: {
            gte: since,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 10000,
      }),
    ]);
    const metrics = buildReleaseReportMetrics(channel, control, pipeline.current_batch, automationRun, selfHealingRun, events, usageEvents);
    const risks = buildReleaseReportRisks(channel, control, pipeline.current_batch, automationRun, selfHealingRun, events, usageEvents);
    const incidentLevel = risks.some((risk) => risk.severity === 'CRITICAL')
      ? 'CRITICAL'
      : risks.some((risk) => risk.severity === 'WARN')
        ? 'WARN'
        : 'INFO';
    const conclusion = buildReleaseReportConclusion(channel, incidentLevel, automationRun, selfHealingRun, events);
    const timeline = events.slice(0, 24).map(mapReleaseReportTimelineItem);
    const report: ChannelReleaseReport = {
      generated_at: new Date().toISOString(),
      channel_id: channel.id,
      channel_name: channel.name ?? defaultChannelName(channel.channel as PublishChannelType),
      channel_type: channel.channel as PublishChannelType,
      report_window_hours: windowHours,
      summary: {
        conclusion,
        incident_level: incidentLevel,
        health_status: channel.healthStatus as PublishChannelHealthStatus,
        publish_status: channel.status as PublishChannelStatus,
        rollback_available: control.rollback_available,
        approval_status: control.approval_status,
        rollout_status: control.rollout_status,
        current_batch_title: pipeline.current_batch?.title ?? null,
        last_automation_decision: automationRun?.decision ?? null,
        last_self_healing_decision: selfHealingRun?.decision ?? null,
      },
      metrics,
      risks,
      timeline,
      recent_events: events.slice(0, 20).map(mapPlatformEvent),
      markdown: '',
    };

    return {
      ...report,
      markdown: buildReleaseReportMarkdown(report),
    };
  }

  private async executeReleaseSelfHealing(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
    workflowContext: ReleaseSelfHealingWorkflowContext = {},
  ): Promise<ChannelReleaseSelfHealingRunResult> {
    const startedAt = new Date();
    const policy = readReleaseSelfHealingPolicy(channel.config, channel.updatedAt);
    const control = readPublishControl(channel.config, channel.updatedAt);
    const pipeline = readReleasePipeline(channel.config);
    const lastAutomationRun = readReleaseAutomationLastRun(channel.config);
    const metrics = await this.getReleaseSelfHealingMetrics(currentUser, channel.id, policy.observation_window_hours);
    const evaluation = evaluateReleaseSelfHealingPolicy(policy, channel, control, pipeline.current_batch, lastAutomationRun, metrics);
    const lastRun = readReleaseSelfHealingLastRun(channel.config);
    const cooldownReadyAt = nextSelfHealingAllowedAt(lastRun, policy);
    const cooldownBlocked = Boolean(cooldownReadyAt && new Date(cooldownReadyAt).getTime() > Date.now());
    let result = buildReleaseSelfHealingRunResult(channel.id, 'SKIPPED', startedAt, {
      batch_id: evaluation.current_batch?.batch_id ?? null,
      dry_run: policy.dry_run,
      reason: evaluation.reason,
      workflow_backend: workflowContext.workflowBackend ?? null,
      workflow_id: workflowContext.workflowId ?? null,
      workflow_run_id: workflowContext.workflowRunId ?? null,
    });

    if (!policy.enabled) {
      result = {
        ...result,
        decision: 'DISABLED',
        reason: '发布自愈策略未启用。',
      };
    } else if (cooldownBlocked) {
      result = {
        ...result,
        decision: 'SKIPPED',
        reason: `距离上次自愈不足 ${policy.cooldown_minutes} 分钟。`,
      };
    } else if (!evaluation.rollback_recommended) {
      result = {
        ...result,
        decision: evaluation.decision === 'HEALTHY' ? 'HEALTHY' : 'OBSERVE',
        reason: evaluation.reason,
      };
    } else if (!evaluation.rollback_available) {
      result = {
        ...result,
        decision: 'FAILED',
        reason: '建议回滚，但当前没有可用稳定配置。',
        error_message: 'rollback_not_available',
      };
    } else if (!policy.auto_rollback_enabled) {
      result = {
        ...result,
        decision: 'ROLLBACK_RECOMMENDED',
        reason: '已建议回滚，但策略未允许自动回滚。',
      };
    } else if (policy.dry_run) {
      result = {
        ...result,
        decision: 'ROLLBACK_RECOMMENDED',
        reason: '演练模式：已命中回滚条件，但未执行真实回滚。',
      };
    } else {
      await this.rollbackPublish(currentUser, channel.id, {
        note: '发布自愈工作流检测到异常，自动回滚到最近稳定配置。',
      });
      result = {
        ...result,
        decision: 'ROLLED_BACK',
        rolled_back: true,
        reason: '已按发布自愈策略自动回滚到最近稳定配置。',
      };
    }

    const saved = await this.storeReleaseSelfHealingRun(currentUser, channel.id, result);
    const eventStatus = saved.decision === 'FAILED' ? 'FAILED' : 'SUCCESS';
    await this.recordPublishJob(currentUser, channel, {
      jobKey: buildPublishJobKey(channel.id, 'release_self_healing_run', saved.run_id),
      jobType: 'RELEASE_SELF_HEALING',
      title: `执行渠道发布自愈 ${channel.name ?? channel.channel}`,
      status: saved.decision === 'FAILED' ? 'FAILED' : saved.decision === 'SKIPPED' || saved.decision === 'DISABLED' || saved.decision === 'HEALTHY' || saved.decision === 'OBSERVE' || saved.decision === 'ROLLBACK_RECOMMENDED' ? 'SKIPPED' : 'SUCCESS',
      progress: 100,
      requestPayload: {
        policy: withoutReleaseSelfHealingUpdatedAt(policy),
        workflow_backend: workflowContext.workflowBackend ?? null,
        workflow_id: workflowContext.workflowId ?? null,
        workflow_run_id: workflowContext.workflowRunId ?? null,
      },
      resultPayload: {
        run: saved,
        evaluation: {
          decision: evaluation.decision,
          reason: evaluation.reason,
          rollback_recommended: evaluation.rollback_recommended,
          rollback_available: evaluation.rollback_available,
          metrics: evaluation.metrics,
        },
      },
      errorMessage: saved.error_message ?? null,
      startedAt,
      finishedAt: saved.finished_at ? new Date(saved.finished_at) : new Date(),
    }, {
      batch_id: saved.batch_id ?? null,
    });
    await this.recordChannelEvent(
      currentUser,
      channel,
      releaseSelfHealingEventType(saved.decision),
      eventStatus,
      releaseSelfHealingSummary(saved),
      {
        run: saved,
        policy: withoutReleaseSelfHealingUpdatedAt(policy),
        evaluation: {
          decision: evaluation.decision,
          reason: evaluation.reason,
          rollback_recommended: evaluation.rollback_recommended,
          rollback_available: evaluation.rollback_available,
          metrics: evaluation.metrics,
        },
      },
    );

    return saved;
  }

  private async executeReleaseAutomation(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
    mode: ChannelReleaseAutomationRunResult['mode'],
    workflowContext: ReleaseAutomationWorkflowContext = {},
  ): Promise<ChannelReleaseAutomationRunResult> {
    const startedAt = new Date();
    const policy = readReleaseAutomationPolicy(channel.config, channel.updatedAt);
    const gatePolicy = readReleaseGatePolicy(channel.config, channel.updatedAt);
    const pipeline = readReleasePipeline(channel.config);
    const metrics = await this.getReleaseGateMetrics(currentUser, channel.id, gatePolicy.observation_window_hours);
    const gate = evaluateReleaseGatePolicy(gatePolicy, pipeline.current_batch, metrics);
    const todayRunCount = await this.countReleaseAutomationRunsToday(currentUser, channel.id);
    const lastRun = readReleaseAutomationLastRun(channel.config);
    const intervalReadyAt = nextAutomationAllowedAt(lastRun, policy);
    const intervalBlocked = Boolean(intervalReadyAt && new Date(intervalReadyAt).getTime() > Date.now());
    const batch = gate.current_batch;

    let result = buildReleaseAutomationRunResult(channel.id, mode, 'SKIPPED', startedAt, {
      batch_id: batch?.batch_id ?? null,
      dry_run: policy.dry_run,
      gate_decision: gate.decision,
      reason: '自动推进条件未满足。',
      workflow_backend: workflowContext.workflowBackend ?? null,
      workflow_id: workflowContext.workflowId ?? null,
      workflow_run_id: workflowContext.workflowRunId ?? null,
    });

    if (!policy.enabled) {
      result = {
        ...result,
        decision: 'DISABLED',
        reason: '自动推进执行器未启用。',
      };
    } else if (policy.require_auto_promote_policy && !gatePolicy.auto_promote_enabled) {
      result = {
        ...result,
        decision: 'BLOCKED',
        reason: '观测门禁未开启后续自动推进策略。',
      };
    } else if (todayRunCount >= policy.max_runs_per_day) {
      result = {
        ...result,
        decision: 'BLOCKED',
        reason: `今日执行次数已达到上限 ${policy.max_runs_per_day} 次。`,
      };
    } else if (intervalBlocked) {
      result = {
        ...result,
        decision: 'BLOCKED',
        reason: `距离上次执行不足 ${policy.min_interval_minutes} 分钟。`,
      };
    } else if (gate.decision !== 'PROMOTE_READY' || !gate.eligible_for_full_release || !batch) {
      result = {
        ...result,
        decision: gate.decision === 'BLOCKED' ? 'BLOCKED' : 'SKIPPED',
        reason: gate.reason,
      };
    } else if (policy.dry_run) {
      result = {
        ...result,
        decision: 'SKIPPED',
        reason: '当前为演练模式，满足条件但未执行全量推进。',
      };
    } else {
      await this.promoteReleaseBatch(currentUser, channel, batch, '自动推进执行器基于观测门禁完成全量发布。');
      result = {
        ...result,
        decision: 'PROMOTED',
        promoted: true,
        reason: '观测门禁满足条件，已自动推进到全量发布。',
      };
    }

    const saved = await this.storeReleaseAutomationRun(currentUser, channel.id, result);
    const eventStatus = saved.decision === 'PROMOTED' || saved.decision === 'SKIPPED' || saved.decision === 'DISABLED' ? 'SUCCESS' : 'FAILED';
    await this.recordPublishJob(currentUser, channel, {
      jobKey: buildPublishJobKey(channel.id, 'release_automation_run', saved.run_id),
      jobType: 'RELEASE_AUTOMATION',
      title: `执行渠道自动推进 ${channel.name ?? channel.channel}`,
      status: eventStatus === 'FAILED' ? 'FAILED' : saved.decision === 'PROMOTED' ? 'SUCCESS' : 'SKIPPED',
      progress: 100,
      requestPayload: {
        mode,
        policy: withoutReleaseAutomationUpdatedAt(policy),
        workflow_backend: workflowContext.workflowBackend ?? null,
        workflow_id: workflowContext.workflowId ?? null,
        workflow_run_id: workflowContext.workflowRunId ?? null,
      },
      resultPayload: {
        run: saved,
        gate: {
          decision: gate.decision,
          reason: gate.reason,
          eligible_for_full_release: gate.eligible_for_full_release,
          metrics: gate.metrics,
        },
      },
      errorMessage: saved.error_message ?? (eventStatus === 'FAILED' ? saved.reason : null),
      startedAt,
      finishedAt: saved.finished_at ? new Date(saved.finished_at) : new Date(),
    }, {
      batch_id: saved.batch_id ?? null,
    });
    await this.recordChannelEvent(
      currentUser,
      {
        ...channel,
        status: saved.promoted ? 'ACTIVE' : channel.status,
      },
      releaseAutomationEventType(saved.decision),
      eventStatus,
      releaseAutomationSummary(saved),
      {
        run: saved,
        policy: withoutReleaseAutomationUpdatedAt(policy),
        gate: {
          decision: gate.decision,
          reason: gate.reason,
          eligible_for_full_release: gate.eligible_for_full_release,
          metrics: gate.metrics,
        },
      },
    );

    return saved;
  }

  private async promoteReleaseBatch(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
    batch: ChannelReleaseBatch,
    note: string,
  ) {
    const nextBatch: ChannelReleaseBatch = {
      ...batch,
      status: 'FULL',
      target_rollout_percentage: 100,
      completed_at: new Date().toISOString(),
      note,
    };
    const pipeline = readReleasePipeline(channel.config);
    const currentControl = readPublishControl(channel.config, channel.updatedAt);
    const nextControl = normalizePublishControl({
      ...currentControl,
      rollout_enabled: true,
      rollout_percentage: 100,
      rollout_status: 'FULL',
      rollback_available: true,
      last_stable_status: currentControl.last_stable_status ?? channel.status,
      last_stable_config: currentControl.last_stable_config ?? snapshotStableConfig(channel.config),
    });

    return this.updateReleasePipelineConfig(currentUser, channel, {
      current_batch: nextBatch,
      recent_batches: replaceReleaseBatch(pipeline.recent_batches, nextBatch),
      publish_control: nextControl,
    });
  }

  private async storeReleaseAutomationRun(
    currentUser: AuthenticatedUser,
    channelId: string,
    result: ChannelReleaseAutomationRunResult,
  ): Promise<ChannelReleaseAutomationRunResult> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const config = normalizeJson(channel.config) ?? {};
    const runs = readReleaseAutomationRuns(channel.config);
    const saved = {
      ...result,
      finished_at: new Date().toISOString(),
    };
    await this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        config: toJsonInput({
          ...config,
          release_automation_last_run: saved,
          release_automation_runs: [saved, ...runs.filter((item) => item.run_id !== saved.run_id)].slice(0, 8),
        }),
        updatedBy: currentUser.id,
      },
    });

    return saved;
  }

  private async countReleaseAutomationRunsToday(currentUser: AuthenticatedUser, channelId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.platformEvent.count({
      where: {
        tenantId: currentUser.tenantId,
        resourceType: 'CHANNEL',
        resourceId: channelId,
        eventType: {
          in: releaseAutomationRunEventTypes(),
        },
        occurredAt: {
          gte: today,
        },
      },
    });
  }

  private async resolveAutomationWorkflowUser(channel: ChannelRecord): Promise<AuthenticatedUser> {
    const userId = channel.updatedBy ?? channel.createdBy;
    const user = userId
      ? await this.prisma.user.findFirst({
          where: {
            id: userId,
            tenantId: channel.tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          include: runtimeUserInclude,
        })
      : null;
    const fallbackUser = user ?? await this.prisma.user.findFirst({
      where: {
        tenantId: channel.tenantId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: runtimeUserInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });
    if (!fallbackUser) {
      throw new NotFoundException('Runtime channel automation user not found');
    }

    return mapRuntimeUser(fallbackUser);
  }

  private async getReleaseGateMetrics(
    currentUser: AuthenticatedUser,
    channelId: string,
    windowHours: number,
  ): Promise<ChannelReleaseGateMetrics> {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const usageEvents = await this.prisma.platformUsageEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        resourceType: 'CHANNEL',
        resourceId: channelId,
        metricType: {
          in: [
            'channel_rollout_gate_evaluated',
            'channel_rollout_gate_allowed',
            'channel_rollout_gate_blocked',
            'channel_rollout_gate_bypass',
          ],
        },
        occurredAt: {
          gte: since,
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 10000,
    });
    const totals = new Map<string, number>();
    for (const event of usageEvents) {
      totals.set(event.metricType, (totals.get(event.metricType) ?? 0) + event.quantity.toNumber());
    }
    const evaluated = totals.get('channel_rollout_gate_evaluated') ?? 0;
    const allowed = totals.get('channel_rollout_gate_allowed') ?? 0;

    return {
      evaluated_count: evaluated,
      allowed_count: allowed,
      blocked_count: totals.get('channel_rollout_gate_blocked') ?? 0,
      bypass_count: totals.get('channel_rollout_gate_bypass') ?? 0,
      allowed_rate: evaluated === 0 ? 0 : Number((allowed / evaluated * 100).toFixed(1)),
    };
  }

  private async getReleaseSelfHealingMetrics(
    currentUser: AuthenticatedUser,
    channelId: string,
    windowHours: number,
  ): Promise<ChannelReleaseSelfHealingMetrics> {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const usageEvents = await this.prisma.platformUsageEvent.findMany({
      where: {
        tenantId: currentUser.tenantId,
        resourceType: 'CHANNEL',
        resourceId: channelId,
        occurredAt: {
          gte: since,
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 10000,
    });
    const totals = new Map<string, number>();
    for (const event of usageEvents) {
      totals.set(event.metricType, (totals.get(event.metricType) ?? 0) + event.quantity.toNumber());
    }
    const evaluated = totals.get('channel_rollout_gate_evaluated') ?? 0;
    const allowed = totals.get('channel_rollout_gate_allowed') ?? 0;
    const errorRequests = usageEvents
      .filter((event) => event.costSource === 'FAILED' || event.metricType.includes('failed') || event.metricType.includes('error'))
      .reduce((total, event) => total + event.quantity.toNumber(), 0);

    return {
      evaluated_count: evaluated,
      allowed_count: allowed,
      blocked_count: totals.get('channel_rollout_gate_blocked') ?? 0,
      bypass_count: totals.get('channel_rollout_gate_bypass') ?? 0,
      allowed_rate: evaluated === 0 ? 0 : Number((allowed / evaluated * 100).toFixed(1)),
      error_request_count: errorRequests,
    };
  }

  private async storeReleaseSelfHealingRun(
    currentUser: AuthenticatedUser,
    channelId: string,
    result: ChannelReleaseSelfHealingRunResult,
  ): Promise<ChannelReleaseSelfHealingRunResult> {
    const channel = await this.ensureChannel(currentUser, channelId);
    const config = normalizeJson(channel.config) ?? {};
    const runs = readReleaseSelfHealingRuns(channel.config);
    const saved = {
      ...result,
      finished_at: new Date().toISOString(),
    };
    await this.prisma.agentPublishChannel.update({
      where: {
        id: channel.id,
      },
      data: {
        config: toJsonInput({
          ...config,
          release_self_healing_last_run: saved,
          release_self_healing_runs: [saved, ...runs.filter((item) => item.run_id !== saved.run_id)].slice(0, 8),
        }),
        updatedBy: currentUser.id,
      },
    });

    return saved;
  }

  private async recordChannelEvent(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
    eventType: string,
    status: string,
    summary: string,
    payload: Record<string, unknown> = {},
  ) {
    await this.platformEvents.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      actorType: 'USER',
      resourceType: 'CHANNEL',
      resourceId: channel.id,
      agentId: channel.agentId,
      channelId: channel.id,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      eventSource: 'CONTROL_API',
      eventType,
      status,
      severity: status === 'FAILED' ? 'WARN' : 'INFO',
      billable: false,
      summary,
      payloadJson: {
        channel: channel.channel,
        status: channel.status,
        health_status: channel.healthStatus,
        ...payload,
      },
      sourceSystem: 'agent_publish_channel',
      sourceId: channel.id,
    });
  }

  private async recordPublishJob(
    currentUser: AuthenticatedUser,
    channel: ChannelRecord,
    input: ChannelPublishJobWriteInput,
    context: Record<string, unknown> = {},
  ) {
    const relation = this.buildPublishJobRelation(channel);
    const now = new Date();
    const startedAt = input.startedAt ?? (input.status === 'RUNNING' ? now : now);
    const finishedAt = input.finishedAt ?? (input.status === 'RUNNING' ? null : now);
    const normalizedProgress = typeof input.progress === 'number' ? clampInteger(input.progress, 0, 100, input.progress) : null;
    const payload = {
      title: input.title,
      progress: normalizedProgress,
      progress_percent: normalizedProgress,
      requestPayload: input.requestPayload ?? null,
      request_payload: input.requestPayload ?? null,
      completed_count: normalizedProgress === null ? null : normalizedProgress,
      total_count: normalizedProgress === null ? null : 100,
      context,
      relations: relation,
    };
    const result = {
      title: input.title,
      progress: normalizedProgress,
      progress_percent: normalizedProgress,
      resultPayload: input.resultPayload ?? null,
      response_result: input.resultPayload ?? null,
      context,
      relations: relation,
    };

    await this.prisma.channelPublishJob.upsert({
      where: {
        tenantId_jobKey: {
          tenantId: currentUser.tenantId,
          jobKey: input.jobKey,
        },
      },
      create: {
        tenantId: currentUser.tenantId,
        agentId: channel.agentId,
        publishChannelId: relation.publishChannelId,
        providerId: relation.providerId,
        accountId: relation.accountId,
        templateId: relation.templateId,
        jobKey: input.jobKey,
        jobType: input.jobType,
        status: input.status,
        payload: toJsonInput(payload),
        result: toJsonInput(result),
        errorMessage: input.errorMessage ?? null,
        scheduledAt: input.scheduledAt ?? null,
        startedAt,
        finishedAt,
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
      },
      update: {
        agentId: channel.agentId,
        publishChannelId: relation.publishChannelId,
        providerId: relation.providerId,
        accountId: relation.accountId,
        templateId: relation.templateId,
        jobType: input.jobType,
        status: input.status,
        payload: toJsonInput(payload),
        result: toJsonInput(result),
        errorMessage: input.errorMessage ?? null,
        scheduledAt: input.scheduledAt ?? null,
        startedAt,
        finishedAt,
        deletedAt: null,
        updatedBy: currentUser.id,
      },
    });
  }

  private buildPublishJobRelation(channel: ChannelRecord): ChannelPublishJobRelationSummary {
    const provider = channel.routeRule?.provider ?? channel.account?.provider ?? channel.account?.provider ?? null;
    const account = channel.account ?? channel.routeRule?.account ?? null;
    const routeRule = channel.routeRule ?? null;

    return {
      publishChannelId: channel.id,
      publishChannelName: channel.name ?? defaultChannelName(channel.channel as PublishChannelType),
      providerId: provider?.id ?? null,
      providerName: provider?.name ?? null,
      accountId: account?.id ?? null,
      accountName: account?.name ?? null,
      templateId: null,
      templateName: null,
      routeRuleId: routeRule?.id ?? null,
      routeRuleName: routeRule?.name ?? null,
    };
  }
}

interface ChannelUsageSummary {
  requests: number;
  successes: number;
  amount: number;
  lastRequestAt: Date | null;
}

function summarizeUsageByResource(events: UsageRecord[]) {
  const output = new Map<string, ChannelUsageSummary>();
  for (const event of events) {
    const key = event.resourceId;
    if (!key) continue;
    const current = output.get(key) ?? {
      requests: 0,
      successes: 0,
      amount: 0,
      lastRequestAt: null,
    };
    const quantity = Number(event.quantity || 1);
    current.requests += quantity;
    current.successes += event.costSource === 'FAILED' ? 0 : quantity;
    current.amount += Number(event.amount || 0);
    if (!current.lastRequestAt || event.occurredAt > current.lastRequestAt) {
      current.lastRequestAt = event.occurredAt;
    }
    output.set(key, current);
  }

  return output;
}

function buildChannelMix(items: PublishChannelListItem[]): PublishChannelOverview['channel_mix'] {
  const grouped = new Map<PublishChannelType, PublishChannelOverview['channel_mix'][number]>();
  for (const item of items) {
    const current = grouped.get(item.channel) ?? {
      channel: item.channel,
      total: 0,
      active: 0,
      requests_24h: 0,
    };
    current.total += 1;
    current.active += item.status === 'ACTIVE' ? 1 : 0;
    current.requests_24h += item.request_count_24h;
    grouped.set(item.channel, current);
  }

  return Array.from(grouped.values()).sort((left, right) => right.requests_24h - left.requests_24h);
}

function evaluateHealth(channel: ChannelRecord): { status: PublishChannelHealthStatus; message: string } {
  if (channel.status !== 'ACTIVE') {
    return { status: 'UNKNOWN', message: '渠道未启用，健康状态不可用。' };
  }
  if (!channel.endpointUrl && !channel.callbackUrl) {
    return { status: 'DEGRADED', message: '渠道缺少入口地址或回调地址，只能进行配置级检查。' };
  }
  if (channel.agent.status !== 'PUBLISHED') {
    return { status: 'UNAVAILABLE', message: '关联 Agent 未发布，渠道不可用。' };
  }

  return { status: 'HEALTHY', message: '配置检查通过，真实连通性将在渠道回调接入后更新。' };
}

function mapPlatformEvent(event: EventRecord): PlatformEventListItem {
  return {
    id: event.id,
    tenant_id: event.tenantId,
    department_id: event.departmentId,
    user_id: event.userId,
    actor_type: event.actorType,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    agent_id: event.agentId,
    team_id: event.teamId,
    plugin_id: event.pluginId,
    channel_id: event.channelId,
    conversation_id: event.conversationId,
    run_id: event.runId,
    task_id: event.taskId,
    request_id: event.requestId,
    trace_id: event.traceId,
    parent_trace_id: event.parentTraceId,
    event_source: event.eventSource,
    event_type: event.eventType,
    status: event.status,
    severity: event.severity,
    security_level: event.securityLevel,
    billable: event.billable,
    summary: event.summary,
    occurred_at: event.occurredAt.toISOString(),
    created_at: event.createdAt.toISOString(),
    updated_at: event.updatedAt.toISOString(),
    source_system: event.sourceSystem,
    source_id: event.sourceId,
    dedupe_key: event.dedupeKey,
    linked_usage_count: 0,
    linked_quantity_total: 0,
    linked_amount_total: 0,
  };
}

function mapReleaseReportTimelineItem(event: EventRecord): ChannelReleaseReportTimelineItem {
  return {
    id: event.id,
    occurred_at: event.occurredAt.toISOString(),
    event_type: event.eventType,
    title: releaseReportEventTitle(event.eventType),
    status: event.status,
    severity: event.severity,
    summary: event.summary,
    trace_id: event.traceId,
  };
}

function mapReleaseReportSnapshotListItem(event: EventRecord): ChannelReleaseReportSnapshotListItem | null {
  const report = extractReleaseReportFromSnapshotEvent(event);
  const snapshotId = nullableText(asRecord(event.payloadJson).snapshot_id) ?? event.sourceId;
  if (!report || !snapshotId) return null;

  return {
    snapshot_id: snapshotId,
    channel_id: report.channel_id,
    channel_name: report.channel_name,
    incident_level: report.summary.incident_level,
    conclusion: report.summary.conclusion,
    created_at: event.occurredAt.toISOString(),
    created_by: event.userId,
    event_id: event.id,
    trace_id: event.traceId,
  };
}

function mapReleaseReportSnapshotDetail(
  event: EventRecord,
  report: ChannelReleaseReport,
): ChannelReleaseReportSnapshotDetail {
  const item = mapReleaseReportSnapshotListItem(event);
  if (!item) {
    throw new NotFoundException('Release report snapshot payload not found');
  }

  return {
    ...item,
    report,
    source_event: mapPlatformEvent(event),
  };
}

function extractReleaseReportFromSnapshotEvent(event: EventRecord): ChannelReleaseReport | null {
  const payload = asRecord(event.payloadJson);
  const report = asRecord(payload.report);
  if (!report.channel_id || !report.summary || !report.markdown) return null;

  return report as unknown as ChannelReleaseReport;
}

function snapshotDetailToListItem(detail: ChannelReleaseReportSnapshotDetail): ChannelReleaseReportSnapshotListItem {
  const { report: _report, source_event: _sourceEvent, ...item } = detail;

  return item;
}

function buildReleaseReportSummaryDiffs(
  base: ChannelReleaseReport,
  target: ChannelReleaseReport,
): ChannelReleaseReportDiffItem[] {
  return [
    buildDiffItem('summary.incident_level', '风险等级', base.summary.incident_level, target.summary.incident_level, target.summary.incident_level),
    buildDiffItem('summary.health_status', '健康状态', base.summary.health_status, target.summary.health_status, severityFromHealth(target.summary.health_status)),
    buildDiffItem('summary.publish_status', '发布状态', base.summary.publish_status, target.summary.publish_status, target.summary.publish_status === 'ERROR' ? 'CRITICAL' : 'INFO'),
    buildDiffItem('summary.approval_status', '审批状态', base.summary.approval_status, target.summary.approval_status, target.summary.approval_status === 'REJECTED' ? 'WARN' : 'INFO'),
    buildDiffItem('summary.rollout_status', '灰度状态', base.summary.rollout_status, target.summary.rollout_status, 'INFO'),
    buildDiffItem('summary.rollback_available', '回滚点', base.summary.rollback_available ? '可回滚' : '不可用', target.summary.rollback_available ? '可回滚' : '不可用', target.summary.rollback_available ? 'INFO' : 'WARN'),
    buildDiffItem('summary.conclusion', '复盘结论', base.summary.conclusion, target.summary.conclusion, target.summary.incident_level),
  ];
}

function buildReleaseReportMetricDiffs(
  base: ChannelReleaseReport,
  target: ChannelReleaseReport,
): ChannelReleaseReportDiffItem[] {
  const labels = new Set([...base.metrics.map((item) => item.label), ...target.metrics.map((item) => item.label)]);

  return Array.from(labels).map((label) => {
    const before = base.metrics.find((item) => item.label === label);
    const after = target.metrics.find((item) => item.label === label);
    return buildPresenceDiffItem(
      `metric.${label}`,
      label,
      before ? `${before.value}｜${before.helper}` : null,
      after ? `${after.value}｜${after.helper}` : null,
      after?.severity ?? before?.severity ?? 'INFO',
    );
  });
}

function buildReleaseReportRiskDiffs(
  base: ChannelReleaseReport,
  target: ChannelReleaseReport,
): ChannelReleaseReportDiffItem[] {
  const titles = new Set([...base.risks.map((item) => item.title), ...target.risks.map((item) => item.title)]);

  return Array.from(titles).map((title) => {
    const before = base.risks.find((item) => item.title === title);
    const after = target.risks.find((item) => item.title === title);
    return buildPresenceDiffItem(
      `risk.${title}`,
      title,
      before ? `${before.severity}｜${before.description}` : null,
      after ? `${after.severity}｜${after.description}` : null,
      after?.severity ?? before?.severity ?? 'INFO',
    );
  });
}

function buildReleaseReportTimelineDiffs(
  base: ChannelReleaseReport,
  target: ChannelReleaseReport,
): ChannelReleaseReportDiffItem[] {
  const baseKeys = new Set(base.timeline.map(timelineKey));
  const targetKeys = new Set(target.timeline.map(timelineKey));
  const added = target.timeline
    .filter((item) => !baseKeys.has(timelineKey(item)))
    .slice(0, 8)
    .map((item) => buildPresenceDiffItem(`timeline.${item.id}`, item.title, null, timelineValue(item), item.status === 'FAILED' ? 'WARN' : 'INFO'));
  const removed = base.timeline
    .filter((item) => !targetKeys.has(timelineKey(item)))
    .slice(0, 8)
    .map((item) => buildPresenceDiffItem(`timeline.${item.id}`, item.title, timelineValue(item), null, item.status === 'FAILED' ? 'WARN' : 'INFO'));

  return [...added, ...removed];
}

function buildDiffItem(
  field: string,
  label: string,
  before: string | null,
  after: string | null,
  severity: ChannelReleaseReportSeverity,
): ChannelReleaseReportDiffItem {
  return {
    field,
    label,
    kind: before === after ? 'UNCHANGED' : 'CHANGED',
    before,
    after,
    severity,
  };
}

function buildPresenceDiffItem(
  field: string,
  label: string,
  before: string | null,
  after: string | null,
  severity: ChannelReleaseReportSeverity,
): ChannelReleaseReportDiffItem {
  return {
    field,
    label,
    kind: before === after ? 'UNCHANGED' : before === null ? 'ADDED' : after === null ? 'REMOVED' : 'CHANGED',
    before,
    after,
    severity,
  };
}

function filterChangedDiffItems(items: ChannelReleaseReportDiffItem[]) {
  return items.filter((item) => item.kind !== 'UNCHANGED');
}

function severityFromHealth(status: PublishChannelHealthStatus): ChannelReleaseReportSeverity {
  if (status === 'UNAVAILABLE') return 'CRITICAL';
  if (status === 'DEGRADED') return 'WARN';

  return 'INFO';
}

function timelineKey(item: ChannelReleaseReportTimelineItem) {
  return `${item.event_type}:${item.occurred_at}:${item.summary ?? ''}`;
}

function timelineValue(item: ChannelReleaseReportTimelineItem) {
  return `${item.occurred_at}｜${item.status}｜${item.summary ?? item.event_type}`;
}

function buildReleaseReportCompareConclusion(changed: number, added: number, removed: number, critical: number) {
  if (critical > 0) {
    return `两个报告快照之间存在 ${critical} 个严重差异，需要优先复核风险和时间线。`;
  }
  if (changed + added + removed === 0) {
    return '两个报告快照没有发现可见差异。';
  }

  return `两个报告快照存在 ${changed} 个变更、${added} 个新增、${removed} 个移除项。`;
}

function buildReleaseReportMetrics(
  channel: ChannelRecord,
  control: ChannelPublishControl,
  batch: ChannelReleaseBatch | null,
  automationRun: ChannelReleaseAutomationRunResult | null,
  selfHealingRun: ChannelReleaseSelfHealingRunResult | null,
  events: EventRecord[],
  usageEvents: UsageRecord[],
): ChannelReleaseReportMetric[] {
  const failedEvents = events.filter((event) => event.status === 'FAILED').length;
  const requests = usageEvents.reduce((total, event) => total + event.quantity.toNumber(), 0);
  const failedUsage = usageEvents
    .filter((event) => event.costSource === 'FAILED' || event.metricType.includes('failed') || event.metricType.includes('error'))
    .reduce((total, event) => total + event.quantity.toNumber(), 0);
  const successRate = requests === 0 ? 0 : Number(((requests - failedUsage) / requests * 100).toFixed(1));

  return [
    {
      label: '渠道健康',
      value: channel.healthStatus,
      helper: channel.healthMessage ?? '暂无健康说明',
      severity: channel.healthStatus === 'UNAVAILABLE' ? 'CRITICAL' : channel.healthStatus === 'DEGRADED' ? 'WARN' : 'INFO',
    },
    {
      label: '发布阶段',
      value: batch?.status ?? control.rollout_status,
      helper: batch ? batch.title : '当前没有进行中的发布批次',
      severity: batch?.status === 'ABORTED' || batch?.status === 'ROLLED_BACK' ? 'WARN' : 'INFO',
    },
    {
      label: '窗口成功率',
      value: `${successRate}%`,
      helper: `近 72 小时请求 ${requests}，失败 ${failedUsage}`,
      severity: successRate < 90 && requests > 0 ? 'WARN' : 'INFO',
    },
    {
      label: '失败事件',
      value: `${failedEvents}`,
      helper: '近 72 小时渠道相关失败事件',
      severity: failedEvents > 0 ? 'WARN' : 'INFO',
    },
    {
      label: '自动推进',
      value: automationRun?.decision ?? '暂无',
      helper: automationRun?.reason ?? '尚未执行自动推进',
      severity: automationRun?.decision === 'FAILED' || automationRun?.decision === 'BLOCKED' ? 'WARN' : 'INFO',
    },
    {
      label: '发布自愈',
      value: selfHealingRun?.decision ?? '暂无',
      helper: selfHealingRun?.reason ?? '尚未执行发布自愈',
      severity: selfHealingRun?.decision === 'FAILED' ? 'CRITICAL' : selfHealingRun?.decision === 'ROLLBACK_RECOMMENDED' ? 'WARN' : 'INFO',
    },
  ];
}

function buildReleaseReportRisks(
  channel: ChannelRecord,
  control: ChannelPublishControl,
  batch: ChannelReleaseBatch | null,
  automationRun: ChannelReleaseAutomationRunResult | null,
  selfHealingRun: ChannelReleaseSelfHealingRunResult | null,
  events: EventRecord[],
  usageEvents: UsageRecord[],
): ChannelReleaseReportRiskItem[] {
  const risks: ChannelReleaseReportRiskItem[] = [];
  const failedEvents = events.filter((event) => event.status === 'FAILED');
  const failedUsage = usageEvents
    .filter((event) => event.costSource === 'FAILED' || event.metricType.includes('failed') || event.metricType.includes('error'))
    .reduce((total, event) => total + event.quantity.toNumber(), 0);

  if (channel.status === 'ERROR' || channel.healthStatus === 'UNAVAILABLE') {
    risks.push({
      title: '渠道不可用',
      severity: 'CRITICAL',
      description: channel.healthMessage ?? '渠道健康检查不可用。',
      recommendation: '优先检查关联 Agent 发布状态、渠道地址和密钥配置，恢复后重新执行健康检查。',
    });
  }
  if (selfHealingRun?.decision === 'ROLLBACK_RECOMMENDED') {
    risks.push({
      title: '自愈建议回滚',
      severity: 'WARN',
      description: selfHealingRun.reason,
      recommendation: control.rollback_available ? '确认影响范围后执行回滚或开启自动回滚策略。' : '当前没有可用回滚点，先恢复稳定配置再重新发布。',
    });
  }
  if (selfHealingRun?.decision === 'FAILED') {
    risks.push({
      title: '自愈失败',
      severity: 'CRITICAL',
      description: selfHealingRun.error_message ?? selfHealingRun.reason,
      recommendation: '查看自愈事件和 workflow backend，必要时手动回滚并补充回滚点。',
    });
  }
  if (automationRun?.decision === 'FAILED' || automationRun?.decision === 'BLOCKED') {
    risks.push({
      title: '自动推进未完成',
      severity: 'WARN',
      description: automationRun.reason,
      recommendation: '检查观测门禁阈值、灰度样本和执行器冷却时间。',
    });
  }
  if (control.approval_status === 'REJECTED') {
    risks.push({
      title: '发布审批被拒绝',
      severity: 'WARN',
      description: control.decision_note ?? '审批流拒绝了当前发布。',
      recommendation: '根据审批意见调整配置，重新创建发布批次。',
    });
  }
  if (batch?.status === 'ABORTED' || batch?.status === 'ROLLED_BACK') {
    risks.push({
      title: batch.status === 'ABORTED' ? '发布批次已终止' : '发布批次已回滚',
      severity: 'WARN',
      description: batch.note ?? '发布批次未以全量完成收尾。',
      recommendation: '复核终止或回滚原因，确认稳定版本后再发起新批次。',
    });
  }
  if (failedUsage > 0 || failedEvents.length > 0) {
    risks.push({
      title: '窗口内存在失败信号',
      severity: 'WARN',
      description: `近 72 小时记录到 ${failedEvents.length} 个失败事件、${failedUsage} 个失败用量信号。`,
      recommendation: '查看事件时间线和 Trace，确认失败是否集中在发布变更后。',
    });
  }

  if (risks.length === 0) {
    risks.push({
      title: '未发现高风险项',
      severity: 'INFO',
      description: '近 72 小时没有发现阻断发布的失败信号。',
      recommendation: '继续保持观测，发布全量前确认业务侧指标稳定。',
    });
  }

  return risks.slice(0, 8);
}

function buildReleaseReportConclusion(
  channel: ChannelRecord,
  incidentLevel: ChannelReleaseReportSeverity,
  automationRun: ChannelReleaseAutomationRunResult | null,
  selfHealingRun: ChannelReleaseSelfHealingRunResult | null,
  events: EventRecord[],
) {
  const failedCount = events.filter((event) => event.status === 'FAILED').length;
  if (incidentLevel === 'CRITICAL') {
    return `渠道 ${channel.name ?? channel.channel} 存在严重发布风险，需要优先处理不可用、自愈失败或回滚缺口。`;
  }
  if (incidentLevel === 'WARN') {
    return `渠道 ${channel.name ?? channel.channel} 存在 ${failedCount} 个失败信号，建议复核自动推进、自愈和审批记录。`;
  }
  if (automationRun?.decision === 'PROMOTED' && selfHealingRun?.decision === 'HEALTHY') {
    return `渠道 ${channel.name ?? channel.channel} 已完成自动推进且自愈观测健康。`;
  }

  return `渠道 ${channel.name ?? channel.channel} 当前未发现重大异常，可继续按发布流程观测。`;
}

function buildReleaseReportMarkdown(report: ChannelReleaseReport) {
  const lines = [
    `# 渠道发布复盘报告：${report.channel_name}`,
    '',
    `生成时间：${report.generated_at}`,
    `复盘窗口：近 ${report.report_window_hours} 小时`,
    `结论：${report.summary.conclusion}`,
    '',
    '## 核心指标',
    ...report.metrics.map((metric) => `- ${metric.label}：${metric.value}。${metric.helper}`),
    '',
    '## 风险与建议',
    ...report.risks.map((risk) => `- [${risk.severity}] ${risk.title}：${risk.description} 建议：${risk.recommendation}`),
    '',
    '## 关键时间线',
    ...report.timeline.slice(0, 12).map((item) => `- ${item.occurred_at} ${item.title} ${item.status}${item.summary ? `：${item.summary}` : ''}`),
  ];

  return lines.join('\n');
}

function releaseReportEventTitle(eventType: string) {
  if (eventType.startsWith('channel.release_batch.')) return '发布批次';
  if (eventType.startsWith('channel.publish_control.')) return '发布控制';
  if (eventType.startsWith('channel.release_gate.')) return '观测门禁';
  if (eventType.startsWith('channel.release_automation.')) return '自动推进';
  if (eventType.startsWith('channel.release_self_healing.')) return '发布自愈';
  if (eventType.startsWith('channel.release_scheduler.')) return '发布巡检';
  if (eventType.startsWith('channel.rollout_gate.')) return '灰度门禁';
  if (eventType.startsWith('channel.publish.')) return '渠道发布';

  return eventType;
}

function mapRuntimeUser(user: RuntimeUserRecord): AuthenticatedUser {
  const activeRoles = user.userRoles.filter((userRole) => userRole.role);
  const permissions = expandPermissionCodes(
    Array.from(
      new Set(
        activeRoles.flatMap((userRole) =>
          userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.code),
        ),
      ),
    ),
  );

  return {
    id: user.id,
    tenantId: user.tenantId,
    departmentId: user.departmentId,
    email: user.email,
    roles: activeRoles.map((userRole) => userRole.role.code),
    roleIds: activeRoles.map((userRole) => userRole.role.id),
    permissions,
    requestId: `channel_release_workflow_${Date.now()}`,
    traceId: undefined,
    spanId: undefined,
    parentSpanId: null,
    traceparent: undefined,
  };
}

function defaultChannelName(channel: PublishChannelType) {
  const names: Record<PublishChannelType, string> = {
    WEB_WIDGET: 'Web 组件',
    OPEN_API: '开放 API',
    WECHAT_WORK: '企业微信',
    DINGTALK: '钉钉',
    FEISHU: '飞书',
    SLACK: 'Slack',
    CUSTOM_WEBHOOK: '自定义 Webhook',
  };

  return names[channel] ?? channel;
}

function normalizeJson(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function readSenderPolicy(config: Prisma.JsonValue | null, updatedAt: Date | null): ChannelSenderPolicy {
  const configObject = normalizeJson(config);
  const policy = normalizeSenderPolicy(asRecord(configObject?.sender_policy));

  return {
    ...policy,
    updated_at: updatedAt?.toISOString() ?? null,
  };
}

function normalizeSenderPolicy(value: unknown): Omit<ChannelSenderPolicy, 'updated_at'> {
  const record = asRecord(value);

  return {
    auto_retry_enabled: typeof record.auto_retry_enabled === 'boolean' ? record.auto_retry_enabled : false,
    manual_retry_enabled: typeof record.manual_retry_enabled === 'boolean' ? record.manual_retry_enabled : true,
    max_retry_count: clampInteger(record.max_retry_count, 0, 10, 3),
    retry_backoff_seconds: clampInteger(record.retry_backoff_seconds, 1, 3600, 60),
    retry_on_statuses: normalizeStatusCodes(record.retry_on_statuses),
    alert_on_failure: typeof record.alert_on_failure === 'boolean' ? record.alert_on_failure : true,
    retention_days: clampInteger(record.retention_days, 1, 365, 30),
  };
}

function readPublishControl(config: Prisma.JsonValue | null, updatedAt: Date | null): ChannelPublishControl {
  const configObject = normalizeJson(config);
  const control = normalizePublishControl(asRecord(configObject?.publish_control));

  return {
    ...control,
    updated_at: updatedAt?.toISOString() ?? null,
  };
}

function readReleasePipeline(config: Prisma.JsonValue | null) {
  const configObject = normalizeJson(config);

  return normalizeReleasePipeline(configObject?.release_pipeline);
}

function readReleaseGatePolicy(config: Prisma.JsonValue | null, updatedAt: Date | null): ChannelReleaseGatePolicy {
  const configObject = normalizeJson(config);
  const policy = normalizeReleaseGatePolicy(asRecord(configObject?.release_gate_policy));

  return {
    ...policy,
    updated_at: nullableText(asRecord(configObject?.release_gate_policy).updated_at) ?? updatedAt?.toISOString() ?? null,
  };
}

function normalizeReleaseGatePolicy(value: unknown): ChannelReleaseGatePolicy {
  const record = asRecord(value);

  return {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : true,
    min_evaluated_count: clampInteger(record.min_evaluated_count, 1, 100000, 50),
    min_allowed_rate: clampInteger(record.min_allowed_rate, 0, 100, 80),
    max_blocked_count: clampInteger(record.max_blocked_count, 0, 100000, 20),
    auto_promote_enabled: typeof record.auto_promote_enabled === 'boolean' ? record.auto_promote_enabled : false,
    observation_window_hours: clampInteger(record.observation_window_hours, 1, 168, 24),
    updated_at: nullableText(record.updated_at),
  };
}

function readReleaseAutomationPolicy(config: Prisma.JsonValue | null, updatedAt: Date | null): ChannelReleaseAutomationPolicy {
  const configObject = normalizeJson(config);
  const policy = normalizeReleaseAutomationPolicy(asRecord(configObject?.release_automation_policy));

  return {
    ...policy,
    updated_at: nullableText(asRecord(configObject?.release_automation_policy).updated_at) ?? updatedAt?.toISOString() ?? null,
  };
}

function normalizeReleaseAutomationPolicy(value: unknown): ChannelReleaseAutomationPolicy {
  const record = asRecord(value);

  return {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : false,
    require_auto_promote_policy: typeof record.require_auto_promote_policy === 'boolean' ? record.require_auto_promote_policy : true,
    min_interval_minutes: clampInteger(record.min_interval_minutes, 1, 1440, 30),
    max_runs_per_day: clampInteger(record.max_runs_per_day, 1, 100, 5),
    dry_run: typeof record.dry_run === 'boolean' ? record.dry_run : true,
    updated_at: nullableText(record.updated_at),
  };
}

function readReleaseSelfHealingPolicy(config: Prisma.JsonValue | null, updatedAt: Date | null): ChannelReleaseSelfHealingPolicy {
  const configObject = normalizeJson(config);
  const policy = normalizeReleaseSelfHealingPolicy(asRecord(configObject?.release_self_healing_policy));

  return {
    ...policy,
    updated_at: nullableText(asRecord(configObject?.release_self_healing_policy).updated_at) ?? updatedAt?.toISOString() ?? null,
  };
}

function normalizeReleaseSelfHealingPolicy(value: unknown): ChannelReleaseSelfHealingPolicy {
  const record = asRecord(value);

  return {
    enabled: typeof record.enabled === 'boolean' ? record.enabled : false,
    dry_run: typeof record.dry_run === 'boolean' ? record.dry_run : true,
    auto_rollback_enabled: typeof record.auto_rollback_enabled === 'boolean' ? record.auto_rollback_enabled : false,
    max_error_requests: clampInteger(record.max_error_requests, 0, 100000, 10),
    min_allowed_rate: clampInteger(record.min_allowed_rate, 0, 100, 90),
    observation_window_hours: clampInteger(record.observation_window_hours, 1, 168, 24),
    cooldown_minutes: clampInteger(record.cooldown_minutes, 1, 1440, 30),
    updated_at: nullableText(record.updated_at),
  };
}

function readReleaseSelfHealingLastRun(config: Prisma.JsonValue | null): ChannelReleaseSelfHealingRunResult | null {
  const configObject = normalizeJson(config);

  return normalizeReleaseSelfHealingRun(configObject?.release_self_healing_last_run);
}

function readReleaseSelfHealingRuns(config: Prisma.JsonValue | null): ChannelReleaseSelfHealingRunResult[] {
  const configObject = normalizeJson(config);
  if (!Array.isArray(configObject?.release_self_healing_runs)) return [];

  return configObject.release_self_healing_runs
    .map(normalizeReleaseSelfHealingRun)
    .filter((item): item is ChannelReleaseSelfHealingRunResult => Boolean(item))
    .slice(0, 8);
}

function normalizeReleaseSelfHealingRun(value: unknown): ChannelReleaseSelfHealingRunResult | null {
  const record = asRecord(value);
  const runId = nullableText(record.run_id);
  const channelId = nullableText(record.channel_id);
  const startedAt = nullableText(record.started_at);
  const finishedAt = nullableText(record.finished_at);
  if (!runId || !channelId || !startedAt || !finishedAt) return null;

  return {
    run_id: runId,
    channel_id: channelId,
    batch_id: nullableText(record.batch_id),
    decision: normalizeReleaseSelfHealingDecision(record.decision),
    rolled_back: record.rolled_back === true,
    dry_run: record.dry_run === true,
    reason: nullableText(record.reason) ?? '无自愈说明。',
    started_at: startedAt,
    finished_at: finishedAt,
    error_message: nullableText(record.error_message),
    workflow_id: nullableText(record.workflow_id),
    workflow_run_id: nullableText(record.workflow_run_id),
    workflow_backend: normalizeReleaseWorkflowBackend(record.workflow_backend),
  };
}

function normalizeReleaseSelfHealingDecision(value: unknown): ChannelReleaseSelfHealingDecision {
  if (
    value === 'HEALTHY'
    || value === 'OBSERVE'
    || value === 'ROLLBACK_RECOMMENDED'
    || value === 'ROLLED_BACK'
    || value === 'SKIPPED'
    || value === 'DISABLED'
    || value === 'FAILED'
  ) {
    return value;
  }

  return 'OBSERVE';
}

function readReleaseAutomationLastRun(config: Prisma.JsonValue | null): ChannelReleaseAutomationRunResult | null {
  const configObject = normalizeJson(config);

  return normalizeReleaseAutomationRun(configObject?.release_automation_last_run);
}

function readReleaseAutomationRuns(config: Prisma.JsonValue | null): ChannelReleaseAutomationRunResult[] {
  const configObject = normalizeJson(config);
  if (!Array.isArray(configObject?.release_automation_runs)) return [];

  return configObject.release_automation_runs
    .map(normalizeReleaseAutomationRun)
    .filter((item): item is ChannelReleaseAutomationRunResult => Boolean(item))
    .slice(0, 8);
}

function normalizeReleaseAutomationRun(value: unknown): ChannelReleaseAutomationRunResult | null {
  const record = asRecord(value);
  const runId = nullableText(record.run_id);
  const channelId = nullableText(record.channel_id);
  const startedAt = nullableText(record.started_at);
  const finishedAt = nullableText(record.finished_at);
  if (!runId || !channelId || !startedAt || !finishedAt) return null;

  return {
    run_id: runId,
    channel_id: channelId,
    batch_id: nullableText(record.batch_id),
    mode: record.mode === 'SCHEDULED' ? 'SCHEDULED' : 'MANUAL',
    decision: normalizeReleaseAutomationDecision(record.decision),
    promoted: record.promoted === true,
    dry_run: record.dry_run === true,
    reason: nullableText(record.reason) ?? '无执行说明。',
    gate_decision: normalizeReleaseGateDecision(record.gate_decision),
    started_at: startedAt,
    finished_at: finishedAt,
    error_message: nullableText(record.error_message),
    workflow_id: nullableText(record.workflow_id),
    workflow_run_id: nullableText(record.workflow_run_id),
    workflow_backend: normalizeReleaseAutomationWorkflowBackend(record.workflow_backend),
  };
}

function normalizeReleaseAutomationDecision(value: unknown): ChannelReleaseAutomationDecision {
  if (value === 'PROMOTED' || value === 'SKIPPED' || value === 'BLOCKED' || value === 'DISABLED' || value === 'FAILED') return value;

  return 'SKIPPED';
}

function normalizeReleaseGateDecision(value: unknown): ChannelReleaseGateEvaluation['decision'] {
  if (value === 'PROMOTE_READY' || value === 'OBSERVE' || value === 'BLOCKED' || value === 'DISABLED' || value === 'NO_BATCH') return value;

  return 'NO_BATCH';
}

function normalizeReleaseAutomationWorkflowBackend(value: unknown): ChannelReleaseAutomationRunResult['workflow_backend'] {
  return normalizeReleaseWorkflowBackend(value);
}

function normalizeReleaseWorkflowBackend(value: unknown): 'LOCAL' | 'LOCAL_FALLBACK' | 'TEMPORAL' | null {
  if (value === 'LOCAL' || value === 'LOCAL_FALLBACK' || value === 'TEMPORAL') return value;

  return null;
}

function evaluateReleaseGatePolicy(
  policy: ChannelReleaseGatePolicy,
  batch: ChannelReleaseBatch | null,
  metrics: ChannelReleaseGateMetrics,
): ChannelReleaseGateEvaluation {
  const evaluatedAt = new Date().toISOString();
  if (!policy.enabled) {
    return buildReleaseGateEvaluation('DISABLED', '观测门禁未启用。', false, batch, policy, metrics, evaluatedAt);
  }
  if (!batch || isReleaseBatchClosed(batch.status)) {
    return buildReleaseGateEvaluation('NO_BATCH', '当前没有进行中的发布批次。', false, batch, policy, metrics, evaluatedAt);
  }
  if (metrics.evaluated_count < policy.min_evaluated_count) {
    return buildReleaseGateEvaluation('OBSERVE', `样本量不足，至少需要 ${policy.min_evaluated_count} 次评估。`, false, batch, policy, metrics, evaluatedAt);
  }
  if (metrics.blocked_count > policy.max_blocked_count) {
    return buildReleaseGateEvaluation('BLOCKED', `拦截数 ${metrics.blocked_count} 超过阈值 ${policy.max_blocked_count}。`, false, batch, policy, metrics, evaluatedAt);
  }
  if (metrics.allowed_rate < policy.min_allowed_rate) {
    return buildReleaseGateEvaluation('OBSERVE', `放行率 ${metrics.allowed_rate}% 低于阈值 ${policy.min_allowed_rate}%。`, false, batch, policy, metrics, evaluatedAt);
  }

  return buildReleaseGateEvaluation('PROMOTE_READY', '观测指标满足全量发布门禁。', true, batch, policy, metrics, evaluatedAt);
}

function evaluateReleaseSelfHealingPolicy(
  policy: ChannelReleaseSelfHealingPolicy,
  channel: ChannelRecord,
  control: ChannelPublishControl,
  batch: ChannelReleaseBatch | null,
  lastAutomationRun: ChannelReleaseAutomationRunResult | null,
  metrics: ChannelReleaseSelfHealingMetrics,
): ChannelReleaseSelfHealingEvaluation {
  const evaluatedAt = new Date().toISOString();
  if (!policy.enabled) {
    return buildReleaseSelfHealingEvaluation('DISABLED', '发布自愈策略未启用。', false, control.rollback_available, policy, metrics, batch, lastAutomationRun, evaluatedAt);
  }
  if (!lastAutomationRun || !lastAutomationRun.promoted) {
    return buildReleaseSelfHealingEvaluation('OBSERVE', '最近没有成功自动推进全量的运行结果。', false, control.rollback_available, policy, metrics, batch, lastAutomationRun, evaluatedAt);
  }
  if (channel.status === 'ERROR' || channel.healthStatus === 'UNAVAILABLE') {
    return buildReleaseSelfHealingEvaluation('ROLLBACK_RECOMMENDED', '渠道状态异常，建议回滚到稳定配置。', true, control.rollback_available, policy, metrics, batch, lastAutomationRun, evaluatedAt);
  }
  if (metrics.error_request_count > policy.max_error_requests) {
    return buildReleaseSelfHealingEvaluation('ROLLBACK_RECOMMENDED', `错误请求 ${metrics.error_request_count} 超过阈值 ${policy.max_error_requests}。`, true, control.rollback_available, policy, metrics, batch, lastAutomationRun, evaluatedAt);
  }
  if (metrics.evaluated_count > 0 && metrics.allowed_rate < policy.min_allowed_rate) {
    return buildReleaseSelfHealingEvaluation('ROLLBACK_RECOMMENDED', `放行率 ${metrics.allowed_rate}% 低于自愈阈值 ${policy.min_allowed_rate}%。`, true, control.rollback_available, policy, metrics, batch, lastAutomationRun, evaluatedAt);
  }
  if (metrics.evaluated_count === 0) {
    return buildReleaseSelfHealingEvaluation('OBSERVE', '观测窗口内暂无可用于自愈判断的渠道请求。', false, control.rollback_available, policy, metrics, batch, lastAutomationRun, evaluatedAt);
  }

  return buildReleaseSelfHealingEvaluation('HEALTHY', '当前渠道全量发布观测正常。', false, control.rollback_available, policy, metrics, batch, lastAutomationRun, evaluatedAt);
}

function buildReleaseSelfHealingEvaluation(
  decision: ChannelReleaseSelfHealingDecision,
  reason: string,
  rollbackRecommended: boolean,
  rollbackAvailable: boolean,
  policy: ChannelReleaseSelfHealingPolicy,
  metrics: ChannelReleaseSelfHealingMetrics,
  batch: ChannelReleaseBatch | null,
  lastAutomationRun: ChannelReleaseAutomationRunResult | null,
  evaluatedAt: string,
): ChannelReleaseSelfHealingEvaluation {
  return {
    decision,
    reason,
    rollback_recommended: rollbackRecommended,
    rollback_available: rollbackAvailable,
    policy,
    metrics,
    current_batch: batch,
    last_automation_run: lastAutomationRun,
    evaluated_at: evaluatedAt,
  };
}

function buildReleaseGateEvaluation(
  decision: ChannelReleaseGateEvaluation['decision'],
  reason: string,
  eligible: boolean,
  batch: ChannelReleaseBatch | null,
  policy: ChannelReleaseGatePolicy,
  metrics: ChannelReleaseGateMetrics,
  evaluatedAt: string,
): ChannelReleaseGateEvaluation {
  return {
    decision,
    reason,
    eligible_for_full_release: eligible,
    current_batch: batch,
    policy,
    metrics,
    evaluated_at: evaluatedAt,
  };
}

function releaseGateDecisionLabel(decision: ChannelReleaseGateEvaluation['decision']) {
  const labels: Record<ChannelReleaseGateEvaluation['decision'], string> = {
    PROMOTE_READY: '可推进全量',
    OBSERVE: '继续观察',
    BLOCKED: '建议阻断',
    DISABLED: '门禁关闭',
    NO_BATCH: '无批次',
  };

  return labels[decision] ?? decision;
}

function withoutUpdatedAt(policy: ChannelReleaseGatePolicy) {
  const { updated_at: _updatedAt, ...rest } = policy;

  return rest;
}

function withoutReleaseAutomationUpdatedAt(policy: ChannelReleaseAutomationPolicy) {
  const { updated_at: _updatedAt, ...rest } = policy;

  return rest;
}

function withoutReleaseSelfHealingUpdatedAt(policy: ChannelReleaseSelfHealingPolicy) {
  const { updated_at: _updatedAt, ...rest } = policy;

  return rest;
}

function nextAutomationAllowedAt(
  lastRun: ChannelReleaseAutomationRunResult | null,
  policy: ChannelReleaseAutomationPolicy,
) {
  if (!lastRun) return null;
  const next = new Date(new Date(lastRun.finished_at).getTime() + policy.min_interval_minutes * 60 * 1000);

  return next.getTime() > Date.now() ? next.toISOString() : null;
}

function nextSelfHealingAllowedAt(
  lastRun: ChannelReleaseSelfHealingRunResult | null,
  policy: ChannelReleaseSelfHealingPolicy,
) {
  if (!lastRun) return null;
  const next = new Date(new Date(lastRun.finished_at).getTime() + policy.cooldown_minutes * 60 * 1000);

  return next.getTime() > Date.now() ? next.toISOString() : null;
}

function buildReleaseAutomationRunResult(
  channelId: string,
  mode: ChannelReleaseAutomationRunResult['mode'],
  decision: ChannelReleaseAutomationDecision,
  startedAt: Date,
  input: {
    batch_id: string | null;
    dry_run: boolean;
    gate_decision: ChannelReleaseGateEvaluation['decision'];
    reason: string;
    promoted?: boolean;
    error_message?: string | null;
    workflow_backend?: ChannelReleaseAutomationRunResult['workflow_backend'];
    workflow_id?: string | null;
    workflow_run_id?: string | null;
  },
): ChannelReleaseAutomationRunResult {
  return {
    run_id: `auto_${randomUUID().replaceAll('-', '').slice(0, 18)}`,
    channel_id: channelId,
    batch_id: input.batch_id,
    mode,
    decision,
    promoted: input.promoted ?? false,
    dry_run: input.dry_run,
    reason: input.reason,
    gate_decision: input.gate_decision,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    error_message: input.error_message ?? null,
    workflow_id: input.workflow_id ?? null,
    workflow_run_id: input.workflow_run_id ?? null,
    workflow_backend: input.workflow_backend ?? null,
  };
}

function buildReleaseSelfHealingRunResult(
  channelId: string,
  decision: ChannelReleaseSelfHealingDecision,
  startedAt: Date,
  input: {
    batch_id: string | null;
    dry_run: boolean;
    reason: string;
    rolled_back?: boolean;
    error_message?: string | null;
    workflow_backend?: ChannelReleaseSelfHealingRunResult['workflow_backend'];
    workflow_id?: string | null;
    workflow_run_id?: string | null;
  },
): ChannelReleaseSelfHealingRunResult {
  return {
    run_id: `heal_${randomUUID().replaceAll('-', '').slice(0, 18)}`,
    channel_id: channelId,
    batch_id: input.batch_id,
    decision,
    rolled_back: input.rolled_back ?? false,
    dry_run: input.dry_run,
    reason: input.reason,
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    error_message: input.error_message ?? null,
    workflow_id: input.workflow_id ?? null,
    workflow_run_id: input.workflow_run_id ?? null,
    workflow_backend: input.workflow_backend ?? null,
  };
}

function releaseAutomationSummary(result: ChannelReleaseAutomationRunResult) {
  const labels: Record<ChannelReleaseAutomationDecision, string> = {
    PROMOTED: '已自动推进全量',
    SKIPPED: '已跳过自动推进',
    BLOCKED: '已阻断自动推进',
    DISABLED: '执行器未启用',
    FAILED: '自动推进失败',
  };

  return `渠道自动推进执行器：${labels[result.decision]}，${result.reason}`;
}

function releaseSelfHealingSummary(result: ChannelReleaseSelfHealingRunResult) {
  const labels: Record<ChannelReleaseSelfHealingDecision, string> = {
    HEALTHY: '渠道健康',
    OBSERVE: '继续观察',
    ROLLBACK_RECOMMENDED: '建议回滚',
    ROLLED_BACK: '已回滚',
    SKIPPED: '已跳过',
    DISABLED: '自愈关闭',
    FAILED: '自愈失败',
  };

  return `渠道发布自愈：${labels[result.decision]}，${result.reason}`;
}

function releaseAutomationEventType(decision: ChannelReleaseAutomationDecision) {
  const eventTypes: Record<ChannelReleaseAutomationDecision, string> = {
    PROMOTED: 'channel.release_automation.promoted',
    SKIPPED: 'channel.release_automation.skipped',
    BLOCKED: 'channel.release_automation.blocked',
    DISABLED: 'channel.release_automation.disabled',
    FAILED: 'channel.release_automation.failed',
  };

  return eventTypes[decision];
}

function releaseSelfHealingEventType(decision: ChannelReleaseSelfHealingDecision) {
  const eventTypes: Record<ChannelReleaseSelfHealingDecision, string> = {
    HEALTHY: 'channel.release_self_healing.healthy',
    OBSERVE: 'channel.release_self_healing.observe',
    ROLLBACK_RECOMMENDED: 'channel.release_self_healing.rollback_recommended',
    ROLLED_BACK: 'channel.release_self_healing.rolled_back',
    SKIPPED: 'channel.release_self_healing.skipped',
    DISABLED: 'channel.release_self_healing.disabled',
    FAILED: 'channel.release_self_healing.failed',
  };

  return eventTypes[decision];
}

function releaseAutomationRunEventTypes() {
  return [
    'channel.release_automation.promoted',
    'channel.release_automation.skipped',
    'channel.release_automation.blocked',
    'channel.release_automation.disabled',
    'channel.release_automation.failed',
  ];
}

function normalizeReleasePipeline(value: unknown): {
  current_batch: ChannelReleaseBatch | null;
  recent_batches: ChannelReleaseBatch[];
} {
  const record = asRecord(value);
  const currentBatch = normalizeReleaseBatch(record.current_batch);
  const recentBatches = Array.isArray(record.recent_batches)
    ? record.recent_batches.map(normalizeReleaseBatch).filter((item): item is ChannelReleaseBatch => Boolean(item)).slice(0, 8)
    : [];

  return {
    current_batch: currentBatch,
    recent_batches: currentBatch
      ? replaceReleaseBatch(recentBatches.length > 0 ? recentBatches : [currentBatch], currentBatch).slice(0, 8)
      : recentBatches,
  };
}

function normalizeReleaseBatch(value: unknown): ChannelReleaseBatch | null {
  const record = asRecord(value);
  const batchId = nullableText(record.batch_id);
  const startedAt = nullableText(record.started_at);
  if (!batchId || !startedAt) return null;

  return {
    batch_id: batchId,
    title: nullableText(record.title) ?? '渠道发布批次',
    status: normalizeReleaseBatchStatus(record.status),
    target_rollout_percentage: clampInteger(record.target_rollout_percentage, 0, 100, 30),
    started_by: nullableText(record.started_by),
    started_at: startedAt,
    completed_at: nullableText(record.completed_at),
    aborted_at: nullableText(record.aborted_at),
    rollback_at: nullableText(record.rollback_at),
    note: nullableText(record.note),
  };
}

function normalizeReleaseBatchStatus(value: unknown): ChannelReleaseBatchStatus {
  if (
    value === 'IDLE'
    || value === 'PENDING_APPROVAL'
    || value === 'APPROVED'
    || value === 'GRAY'
    || value === 'FULL'
    || value === 'ROLLED_BACK'
    || value === 'ABORTED'
  ) {
    return value;
  }

  return 'PENDING_APPROVAL';
}

function createReleaseBatchId() {
  return `rel_${randomUUID().replaceAll('-', '').slice(0, 18)}`;
}

function buildPublishJobKey(channelId: string, action: string, discriminator?: unknown) {
  const suffix = discriminator === undefined ? 'default' : createHash('sha256').update(JSON.stringify(discriminator)).digest('hex').slice(0, 16);

  return `${channelId}:${action}:${suffix}`.slice(0, 160);
}

function summarizeChannelInput(input: UpdatePublishChannelInput | UpsertPublishChannelInput) {
  return {
    agent_id: 'agent_id' in input ? input.agent_id : undefined,
    account_id: input.account_id ?? null,
    route_rule_id: input.route_rule_id ?? null,
    channel: 'channel' in input ? input.channel : undefined,
    name: input.name,
    description: input.description,
    endpoint_url: input.endpoint_url,
    callback_url: input.callback_url,
    status: input.status,
    config: input.config ?? null,
    secret_provided: Boolean(input.secret?.trim()),
  };
}

function hourlyJobWindow(date: Date) {
  return date.toISOString().slice(0, 13);
}

function isReleaseBatchClosed(status: ChannelReleaseBatchStatus) {
  return status === 'FULL' || status === 'ROLLED_BACK' || status === 'ABORTED';
}

function replaceReleaseBatch(items: ChannelReleaseBatch[], batch: ChannelReleaseBatch) {
  return [batch, ...items.filter((item) => item.batch_id !== batch.batch_id)].slice(0, 8);
}

function updateCurrentReleaseBatch(config: Prisma.JsonValue | null, status?: ChannelReleaseBatchStatus) {
  if (!status) return config;
  const base = normalizeJson(config) ?? {};
  const pipeline = readReleasePipeline(config);
  if (!pipeline.current_batch || isReleaseBatchClosed(pipeline.current_batch.status)) return config;

  const now = new Date().toISOString();
  const nextBatch: ChannelReleaseBatch = {
    ...pipeline.current_batch,
    status,
    completed_at: status === 'FULL' ? now : pipeline.current_batch.completed_at,
    aborted_at: status === 'ABORTED' ? now : pipeline.current_batch.aborted_at,
    rollback_at: status === 'ROLLED_BACK' ? now : pipeline.current_batch.rollback_at,
  };

  return {
    ...base,
    release_pipeline: normalizeReleasePipeline({
      current_batch: nextBatch,
      recent_batches: replaceReleaseBatch(pipeline.recent_batches, nextBatch),
    }),
  };
}

function withReleasePipeline(config: Prisma.JsonValue | null) {
  const record = normalizeJson(config) ?? {};
  const pipeline = readReleasePipeline(config);

  return {
    ...record,
    release_pipeline: pipeline,
  };
}

function buildReleaseSteps(
  channel: ChannelRecord,
  batch: ChannelReleaseBatch | null,
  events: EventRecord[],
): ChannelReleasePipelineStep[] {
  const eventByType = new Map(events.map((event) => [event.eventType, event]));
  const control = readPublishControl(channel.config, channel.updatedAt);

  return [
    {
      key: 'CREATE_BATCH',
      name: '创建批次',
      status: batch ? 'DONE' : 'CURRENT',
      description: batch ? `发布批次 ${batch.title} 已创建。` : '创建发布批次后开始追踪审批、灰度和回滚。',
      occurred_at: batch?.started_at ?? null,
      event_type: batch ? 'channel.release_batch.started' : null,
    },
    {
      key: 'REQUEST_APPROVAL',
      name: '发起审批',
      status: batch
        ? control.approval_required && control.approval_status === 'PENDING'
          ? 'CURRENT'
          : control.approval_required || eventByType.has('channel.publish_control.approval_requested')
            ? 'DONE'
            : 'WAITING'
        : 'WAITING',
      description: control.approval_required ? '发布审批已开启，批次需要审批通过后进入灰度。' : '当前渠道未强制审批。',
      occurred_at: control.requested_at,
      event_type: control.requested_at ? 'channel.publish_control.approval_requested' : null,
    },
    {
      key: 'APPROVE',
      name: '审批通过',
      status: control.approval_status === 'APPROVED'
        ? 'DONE'
        : control.approval_status === 'REJECTED'
          ? 'FAILED'
          : batch
            ? 'WAITING'
            : 'SKIPPED',
      description: control.approval_status === 'REJECTED' ? '审批已拒绝，发布批次需要终止或重新发起。' : '审批通过后允许调整灰度比例。',
      occurred_at: control.reviewed_at,
      event_type: control.reviewed_at ? `channel.publish_control.${control.approval_status === 'REJECTED' ? 'rejected' : 'approved'}` : null,
    },
    {
      key: 'GRAY_ROLLOUT',
      name: '灰度发布',
      status: control.rollout_status === 'GRAY'
        ? 'CURRENT'
        : control.rollout_status === 'FULL'
          ? 'DONE'
          : batch && control.approval_status === 'APPROVED'
            ? 'WAITING'
            : 'SKIPPED',
      description: control.rollout_status === 'GRAY' ? `当前灰度比例 ${control.rollout_percentage}%。` : '审批通过后可逐步提高灰度比例。',
      occurred_at: eventByType.get('channel.publish_control.rollout_updated')?.occurredAt.toISOString() ?? null,
      event_type: eventByType.has('channel.publish_control.rollout_updated') ? 'channel.publish_control.rollout_updated' : null,
    },
    {
      key: 'FULL_RELEASE',
      name: '全量发布',
      status: batch?.status === 'FULL' || control.rollout_status === 'FULL'
        ? 'DONE'
        : batch && control.rollout_status === 'GRAY'
          ? 'WAITING'
          : 'SKIPPED',
      description: '灰度稳定后标记全量发布，渠道流量全部放行。',
      occurred_at: batch?.completed_at ?? eventByType.get('channel.release_batch.full')?.occurredAt.toISOString() ?? null,
      event_type: batch?.completed_at ? 'channel.release_batch.full' : null,
    },
    {
      key: 'ROLLBACK_OR_ABORT',
      name: '回滚或终止',
      status: batch?.status === 'ROLLED_BACK' || batch?.status === 'ABORTED'
        ? batch.status === 'ABORTED' ? 'FAILED' : 'DONE'
        : batch && !isReleaseBatchClosed(batch.status)
          ? 'WAITING'
          : 'SKIPPED',
      description: '发布异常时可回滚到稳定配置，或终止当前发布批次。',
      occurred_at: batch?.rollback_at ?? batch?.aborted_at ?? eventByType.get('channel.publish_control.rollback')?.occurredAt.toISOString() ?? null,
      event_type: batch?.aborted_at ? 'channel.release_batch.aborted' : batch?.rollback_at ? 'channel.publish_control.rollback' : null,
    },
  ];
}

function normalizePublishControl(value: unknown): Omit<ChannelPublishControl, 'updated_at'> {
  const record = asRecord(value);
  const approvalRequired = typeof record.approval_required === 'boolean' ? record.approval_required : false;
  const rolloutPercentage = clampInteger(record.rollout_percentage, 0, 100, 0);
  const rolloutEnabled = typeof record.rollout_enabled === 'boolean' ? record.rollout_enabled : rolloutPercentage > 0;

  return {
    approval_required: approvalRequired,
    approval_status: normalizeApprovalStatus(record.approval_status, approvalRequired),
    approval_note: nullableText(record.approval_note),
    requested_by: nullableText(record.requested_by),
    requested_at: nullableText(record.requested_at),
    reviewed_by: nullableText(record.reviewed_by),
    reviewed_at: nullableText(record.reviewed_at),
    decision_note: nullableText(record.decision_note),
    rollout_enabled: rolloutEnabled,
    rollout_percentage: rolloutEnabled ? rolloutPercentage : 0,
    rollout_status: normalizeRolloutStatus(record.rollout_status, rolloutEnabled, rolloutPercentage),
    rollback_available: typeof record.rollback_available === 'boolean' ? record.rollback_available : false,
    last_stable_status: normalizePublishChannelStatus(record.last_stable_status),
    last_stable_config: asNullableRecord(record.last_stable_config),
    last_rollback_at: nullableText(record.last_rollback_at),
    last_rollback_by: nullableText(record.last_rollback_by),
  };
}

function normalizeApprovalStatus(value: unknown, approvalRequired: boolean): ChannelPublishControl['approval_status'] {
  if (!approvalRequired) return 'NOT_REQUIRED';
  if (value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED') return value;

  return 'PENDING';
}

function normalizeRolloutStatus(value: unknown, rolloutEnabled: boolean, rolloutPercentage: number): ChannelPublishControl['rollout_status'] {
  if (!rolloutEnabled || rolloutPercentage <= 0) return 'CLOSED';
  if (rolloutPercentage >= 100) return 'FULL';
  if (value === 'GRAY' || value === 'FULL') return value;

  return 'GRAY';
}

function normalizePublishChannelStatus(value: unknown): PublishChannelStatus | null {
  if (value === 'DRAFT' || value === 'ACTIVE' || value === 'DISABLED' || value === 'ERROR' || value === 'ARCHIVED') return value;

  return null;
}

function withPublishControl(config: Prisma.JsonValue | null, control: Omit<ChannelPublishControl, 'updated_at'>) {
  return {
    ...(normalizeJson(config) ?? {}),
    publish_control: control,
  };
}

function snapshotStableConfig(config: Prisma.JsonValue | null) {
  const record = normalizeJson(config) ?? {};
  const { publish_control: _publishControl, ...stableConfig } = record;

  return stableConfig;
}

function asNullableRecord(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);

  return Object.keys(record).length === 0 ? null : record;
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
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

function toJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === undefined || value === null || value === Prisma.JsonNull) return Prisma.JsonNull;

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toJsonValue(value: unknown): Prisma.JsonValue | null {
  if (value === undefined || value === null || value === Prisma.JsonNull) return null;

  return JSON.parse(JSON.stringify(value)) as Prisma.JsonValue;
}
