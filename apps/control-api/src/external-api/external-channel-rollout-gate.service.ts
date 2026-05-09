import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import type {
  ChannelRolloutGateDecision,
  ChannelRolloutGateDecisionReason,
  ChannelRolloutGateOverview,
  ChannelRolloutGateStatus,
  PublishChannelType,
} from '@aiaget/shared-types';

import type { AuthenticatedUser, RequestWithContext } from '../common/types/request-context';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ExternalApiPrincipal } from './external-api-key.service';

const GATE_METRICS = [
  'channel_rollout_gate_evaluated',
  'channel_rollout_gate_allowed',
  'channel_rollout_gate_blocked',
  'channel_rollout_gate_bypass',
];

const channelInclude = {
  agent: true,
} satisfies Prisma.AgentPublishChannelInclude;

type ChannelRecord = Prisma.AgentPublishChannelGetPayload<{ include: typeof channelInclude }>;
type GateChannel = Pick<ChannelRecord, 'id' | 'tenantId' | 'agentId' | 'status' | 'channel' | 'config'> & {
  name?: string | null;
};

export interface ChannelRolloutGateEvaluationOptions {
  source: string;
  stableKey?: string | null;
  requestId?: string | null;
  traceId?: string | null;
  apiKeyId?: string | null;
  apiKeyPrefix?: string | null;
  conversationId?: string | null;
  streaming?: boolean;
  conversationContinuation?: boolean;
}

interface GateControl {
  approval_required: boolean;
  approval_status: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  rollout_enabled: boolean;
  rollout_percentage: number;
  rollout_status: 'CLOSED' | 'GRAY' | 'FULL';
}

@Injectable()
export class ExternalChannelRolloutGateService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlatformEventsService) private readonly platformEvents: PlatformEventsService,
  ) {}

  async getOverview(currentUser: AuthenticatedUser, channelId: string): Promise<ChannelRolloutGateOverview> {
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: channelId,
        deletedAt: null,
      },
      include: channelInclude,
    });
    if (!channel) throw new NotFoundException('Publish channel not found');

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [usageEvents, lastEvent] = await this.prisma.$transaction([
      this.prisma.platformUsageEvent.findMany({
        where: {
          tenantId: currentUser.tenantId,
          resourceType: 'CHANNEL',
          resourceId: channelId,
          metricType: {
            in: GATE_METRICS,
          },
          occurredAt: {
            gte: since,
          },
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 5000,
      }),
      this.prisma.platformEvent.findFirst({
        where: {
          tenantId: currentUser.tenantId,
          resourceType: 'CHANNEL',
          resourceId: channelId,
          sourceSystem: 'channel_rollout_gate',
        },
        orderBy: {
          occurredAt: 'desc',
        },
      }),
    ]);

    const metricTotals = summarizeGateMetrics(usageEvents);
    const evaluated = metricTotals.get('channel_rollout_gate_evaluated') ?? 0;
    const allowed = metricTotals.get('channel_rollout_gate_allowed') ?? 0;
    const blocked = metricTotals.get('channel_rollout_gate_blocked') ?? 0;
    const bypass = metricTotals.get('channel_rollout_gate_bypass') ?? 0;
    const control = readGateControl(channel.config);

    return {
      generated_at: new Date().toISOString(),
      channel_id: channel.id,
      channel_type: channel.channel as PublishChannelType,
      status: gateStatus(channel, control),
      rollout_enabled: control.rollout_enabled,
      rollout_percentage: control.rollout_percentage,
      rollout_status: control.rollout_status,
      evaluated_count_24h: evaluated,
      allowed_count_24h: allowed,
      blocked_count_24h: blocked,
      bypass_count_24h: bypass,
      allowed_rate_24h: evaluated === 0 ? 0 : Number((allowed / evaluated * 100).toFixed(1)),
      last_decision: lastEvent ? mapGateDecisionEvent(lastEvent) : null,
    };
  }

  async evaluateForApiPrincipal(
    principal: ExternalApiPrincipal,
    channelId: string,
    options: ChannelRolloutGateEvaluationOptions,
  ): Promise<ChannelRolloutGateDecision> {
    const channel = await this.prisma.agentPublishChannel.findFirst({
      where: {
        id: channelId,
        deletedAt: null,
      },
      include: channelInclude,
    });
    if (!channel) throw new NotFoundException('Publish channel not found');
    if (channel.tenantId !== principal.user.tenantId) {
      throw new ForbiddenException('Publish channel tenant mismatch');
    }

    const decision = await this.evaluateAndRecord(channel, principal.user, {
      ...options,
      apiKeyId: options.apiKeyId ?? principal.key.id,
      apiKeyPrefix: options.apiKeyPrefix ?? principal.key.keyPrefix,
      requestId: options.requestId ?? principal.user.requestId,
      traceId: options.traceId ?? principal.user.traceId,
    }, {
      subjectType: 'API_KEY',
      subjectId: principal.key.id,
      actorType: 'API_KEY',
    });
    if (!decision.allowed) {
      throw new ForbiddenException(gateDecisionMessage(decision));
    }

    return decision;
  }

  async evaluateForCallback(
    request: RequestWithContext,
    operator: AuthenticatedUser,
    channel: GateChannel,
    options: ChannelRolloutGateEvaluationOptions,
  ): Promise<ChannelRolloutGateDecision> {
    return this.evaluateAndRecord(channel, operator, {
      ...options,
      requestId: options.requestId ?? request.requestId,
      traceId: options.traceId ?? request.traceId,
    }, {
      subjectType: 'CHANNEL',
      subjectId: channel.id,
      actorType: 'CHANNEL',
    });
  }

  private async evaluateAndRecord(
    channel: GateChannel,
    user: AuthenticatedUser,
    options: ChannelRolloutGateEvaluationOptions,
    subject: {
      subjectType: string;
      subjectId: string;
      actorType: string;
    },
  ): Promise<ChannelRolloutGateDecision> {
    const control = readGateControl(channel.config);
    const decision = evaluateGate(channel, control, options);
    const event = await this.platformEvents.recordEvent({
      tenantId: user.tenantId,
      departmentId: user.departmentId ?? null,
      userId: user.id,
      actorType: subject.actorType,
      resourceType: 'CHANNEL',
      resourceId: channel.id,
      agentId: channel.agentId,
      channelId: channel.id,
      conversationId: options.conversationId ?? null,
      requestId: options.requestId ?? user.requestId ?? null,
      traceId: options.traceId ?? user.traceId ?? null,
      eventSource: 'CHANNEL_ROLLOUT_GATE',
      eventType: decision.allowed ? 'channel.rollout_gate.allowed' : 'channel.rollout_gate.blocked',
      status: decision.allowed ? 'SUCCESS' : 'FAILED',
      severity: decision.allowed ? 'INFO' : 'WARN',
      billable: false,
      summary: decision.allowed ? `渠道灰度门控放行：${gateReasonLabel(decision.reason)}` : `渠道灰度门控拦截：${gateReasonLabel(decision.reason)}`,
      payloadJson: toJsonInput({
        allowed: decision.allowed,
        reason: decision.reason,
        bucket: decision.bucket,
        rollout_percentage: decision.rollout_percentage,
        rollout_enabled: control.rollout_enabled,
        rollout_status: control.rollout_status,
        approval_required: control.approval_required,
        approval_status: control.approval_status,
        source: decision.source,
        streaming: options.streaming ?? false,
        conversation_continuation: options.conversationContinuation ?? false,
        stable_key_hash: options.stableKey ? shortHash(options.stableKey) : null,
        api_key_id: options.apiKeyId ?? null,
        api_key_prefix: options.apiKeyPrefix ?? null,
      }),
      sourceSystem: 'channel_rollout_gate',
      sourceId: channel.id,
    });

    await this.recordGateUsage(user, channel, subject, decision, event.id, 'channel_rollout_gate_evaluated');
    await this.recordGateUsage(
      user,
      channel,
      subject,
      decision,
      event.id,
      decision.allowed ? 'channel_rollout_gate_allowed' : 'channel_rollout_gate_blocked',
    );
    if (decision.allowed && decision.reason === 'rollout_closed') {
      await this.recordGateUsage(user, channel, subject, decision, event.id, 'channel_rollout_gate_bypass');
    }

    return decision;
  }

  private async recordGateUsage(
    user: AuthenticatedUser,
    channel: GateChannel,
    subject: {
      subjectType: string;
      subjectId: string;
    },
    decision: ChannelRolloutGateDecision,
    eventId: string,
    metricType: string,
  ) {
    await this.platformEvents.recordUsage({
      tenantId: user.tenantId,
      departmentId: user.departmentId ?? null,
      userId: user.id,
      subjectType: subject.subjectType,
      subjectId: subject.subjectId,
      resourceType: 'CHANNEL',
      resourceId: channel.id,
      metricType,
      unit: 'request',
      quantity: 1,
      billable: false,
      costSource: decision.allowed ? 'CHANNEL_ROLLOUT_GATE' : 'FAILED',
      traceId: decision.trace_id,
      requestId: decision.request_id,
      eventId,
      sourceSystem: 'channel_rollout_gate',
      sourceId: channel.id,
    });
  }
}

function evaluateGate(
  channel: GateChannel,
  control: GateControl,
  options: ChannelRolloutGateEvaluationOptions,
): ChannelRolloutGateDecision {
  if (channel.status !== 'ACTIVE') {
    return buildDecision(false, 'channel_unavailable', null, control, options);
  }
  if (control.approval_required && control.approval_status !== 'APPROVED') {
    return buildDecision(false, 'approval_pending', null, control, options);
  }
  if (!control.rollout_enabled || control.rollout_percentage <= 0) {
    return buildDecision(true, 'rollout_closed', null, control, options);
  }
  if (control.rollout_percentage >= 100) {
    return buildDecision(true, 'rollout_full', null, control, options);
  }

  const bucket = rolloutBucket(channel.id, options.stableKey ?? options.requestId ?? options.traceId ?? channel.id);
  return buildDecision(bucket < control.rollout_percentage, bucket < control.rollout_percentage ? 'rollout_bucket_allowed' : 'rollout_bucket_blocked', bucket, control, options);
}

function buildDecision(
  allowed: boolean,
  reason: ChannelRolloutGateDecisionReason,
  bucket: number | null,
  control: GateControl,
  options: ChannelRolloutGateEvaluationOptions,
): ChannelRolloutGateDecision {
  return {
    allowed,
    reason,
    bucket,
    rollout_percentage: control.rollout_percentage,
    source: options.source,
    evaluated_at: new Date().toISOString(),
    request_id: options.requestId ?? null,
    trace_id: options.traceId ?? null,
  };
}

function gateStatus(channel: GateChannel, control: GateControl): ChannelRolloutGateStatus {
  if (channel.status !== 'ACTIVE') return 'BLOCKING';
  if (control.approval_required && control.approval_status !== 'APPROVED') return 'BLOCKING';
  if (!control.rollout_enabled || control.rollout_percentage <= 0) return 'CLOSED';
  if (control.rollout_percentage >= 100) return 'FULL';

  return 'GRAY';
}

function readGateControl(config: Prisma.JsonValue | null): GateControl {
  const configObject = normalizeJson(config);
  const record = asRecord(configObject?.publish_control);
  const approvalRequired = typeof record.approval_required === 'boolean' ? record.approval_required : false;
  const approvalStatus = normalizeApprovalStatus(record.approval_status, approvalRequired);
  const rolloutPercentage = clampInteger(record.rollout_percentage, 0, 100, 0);
  const rolloutEnabled = typeof record.rollout_enabled === 'boolean' ? record.rollout_enabled : rolloutPercentage > 0;

  return {
    approval_required: approvalRequired,
    approval_status: approvalStatus,
    rollout_enabled: rolloutEnabled,
    rollout_percentage: rolloutEnabled ? rolloutPercentage : 0,
    rollout_status: normalizeRolloutStatus(record.rollout_status, rolloutEnabled, rolloutPercentage),
  };
}

function normalizeApprovalStatus(value: unknown, approvalRequired: boolean): GateControl['approval_status'] {
  if (!approvalRequired) return 'NOT_REQUIRED';
  if (value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED') return value;

  return 'PENDING';
}

function normalizeRolloutStatus(value: unknown, rolloutEnabled: boolean, rolloutPercentage: number): GateControl['rollout_status'] {
  if (!rolloutEnabled || rolloutPercentage <= 0) return 'CLOSED';
  if (rolloutPercentage >= 100) return 'FULL';
  if (value === 'GRAY' || value === 'FULL') return value;

  return 'GRAY';
}

function rolloutBucket(channelId: string, stableKey: string) {
  const digest = createHash('sha256').update(`${channelId}:${stableKey}`).digest();

  return digest.readUInt32BE(0) % 100;
}

function gateDecisionMessage(decision: ChannelRolloutGateDecision) {
  if (decision.reason === 'approval_pending') return '渠道发布审批未通过，当前请求已被灰度门控拦截';
  if (decision.reason === 'channel_unavailable') return '发布渠道不可用，当前请求已被拦截';

  return `当前请求未命中 ${decision.rollout_percentage}% 灰度范围，已被渠道门控拦截`;
}

function gateReasonLabel(reason: ChannelRolloutGateDecisionReason) {
  const labels: Record<ChannelRolloutGateDecisionReason, string> = {
    rollout_closed: '灰度关闭',
    rollout_full: '全量发布',
    rollout_bucket_allowed: '命中灰度',
    rollout_bucket_blocked: '未命中灰度',
    approval_pending: '审批未通过',
    channel_unavailable: '渠道不可用',
  };

  return labels[reason] ?? reason;
}

function mapGateDecisionEvent(event: Prisma.PlatformEventGetPayload<object>): ChannelRolloutGateDecision {
  const payload = asRecord(normalizeJson(event.payloadJson));
  const reason = normalizeDecisionReason(payload.reason);

  return {
    allowed: typeof payload.allowed === 'boolean' ? payload.allowed : event.status !== 'FAILED',
    reason,
    bucket: typeof payload.bucket === 'number' ? payload.bucket : null,
    rollout_percentage: typeof payload.rollout_percentage === 'number' ? payload.rollout_percentage : 0,
    source: typeof payload.source === 'string' ? payload.source : event.eventSource,
    evaluated_at: event.occurredAt.toISOString(),
    request_id: event.requestId,
    trace_id: event.traceId,
  };
}

function normalizeDecisionReason(value: unknown): ChannelRolloutGateDecisionReason {
  if (
    value === 'rollout_closed'
    || value === 'rollout_full'
    || value === 'rollout_bucket_allowed'
    || value === 'rollout_bucket_blocked'
    || value === 'approval_pending'
    || value === 'channel_unavailable'
  ) {
    return value;
  }

  return 'rollout_closed';
}

function summarizeGateMetrics(events: Array<Prisma.PlatformUsageEventGetPayload<object>>) {
  const totals = new Map<string, number>();
  for (const event of events) {
    totals.set(event.metricType, (totals.get(event.metricType) ?? 0) + event.quantity.toNumber());
  }

  return totals;
}

function normalizeJson(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
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

function shortHash(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
