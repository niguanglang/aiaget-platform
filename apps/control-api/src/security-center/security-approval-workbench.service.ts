import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ApprovalAuditEventItem,
  PaginatedResult,
  SecurityApprovalWorkbenchDetail,
  SecurityApprovalWorkbenchItem,
  SecurityApprovalWorkbenchOverview,
  SecurityApprovalWorkbenchRiskDomain,
  SecurityApprovalWorkbenchRiskLevel,
  SecurityApprovalWorkbenchStatus,
  SecurityApprovalWorkbenchTimelineItem,
  SecurityApprovalWorkbenchType,
  ToolMethod,
} from '@aiaget/shared-types';

import { AgentTeamsService } from '../agent-teams/agent-teams.service';
import { ApprovalsService } from '../approvals/approvals.service';
import type { AuthenticatedUser } from '../common/types/request-context';
import { PlatformEventsService } from '../platform-events/platform-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import type { ListSecurityApprovalWorkbenchDto } from './dto/list-security-approval-workbench.dto';
import type { ReviewSecurityApprovalWorkbenchDto } from './dto/review-security-approval-workbench.dto';
import { SecurityCenterService } from './security-center.service';
import { SecurityOperationAlertSlaService } from './security-operation-alert-sla.service';

const approvalInclude = {
  tool: true,
  agent: true,
  conversation: true,
  requester: true,
  reviewer: true,
  toolCallLog: true,
} satisfies Prisma.ToolApprovalRequestInclude;

const snapshotInclude = {
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.SystemSettingSnapshotInclude;

const approvalAuditInclude = {
  actor: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ApprovalAuditEventInclude;

const platformEventInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.PlatformEventInclude;

type ToolApprovalRecord = Prisma.ToolApprovalRequestGetPayload<{ include: typeof approvalInclude }>;
type SystemSettingSnapshotRecord = Prisma.SystemSettingSnapshotGetPayload<{ include: typeof snapshotInclude }>;
type ApprovalAuditEventRecord = Prisma.ApprovalAuditEventGetPayload<{ include: typeof approvalAuditInclude }>;
type PlatformEventRecord = Prisma.PlatformEventGetPayload<{ include: typeof platformEventInclude }>;

type WorkbenchSourceRecord = SecurityApprovalWorkbenchItem & {
  metadata: Record<string, unknown>;
  timeline: SecurityApprovalWorkbenchTimelineItem[];
};

const NOTIFICATION_SETTING_KEYS = [
  'alert_notification_auto_notify_enabled',
  'alert_notification_auto_notify_interval_ms',
  'alert_notification_auto_notify_batch_size',
  'alert_notification_auto_retry_enabled',
  'alert_notification_retry_interval_ms',
  'alert_notification_retry_batch_size',
  'alert_notification_max_retry_count',
  'alert_notification_retry_backoff_seconds',
  'alert_notification_lookback_hours',
  'operation_alert_sla_enabled',
  'operation_alert_sla_scan_interval_ms',
  'operation_alert_sla_due_minutes',
  'operation_alert_sla_warning_minutes',
  'operation_alert_sla_auto_escalate_enabled',
  'operation_alert_sla_lookback_hours',
  'operation_alert_sla_subscription_policy',
  'operation_alert_sla_notification_auto_retry_enabled',
  'operation_alert_sla_notification_retry_interval_ms',
  'operation_alert_sla_notification_retry_batch_size',
  'operation_alert_sla_notification_max_retry_count',
  'operation_alert_sla_notification_retry_backoff_seconds',
  'operation_alert_sla_notification_lookback_hours',
] as const;

const AGENT_TEAM_RUN_REPORT_ARCHIVE_PREFIX = 'agent-team-run-reports';

@Injectable()
export class SecurityApprovalWorkbenchService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ApprovalsService) private readonly approvalsService: ApprovalsService,
    @Inject(AgentTeamsService) private readonly agentTeamsService: AgentTeamsService,
    @Inject(SystemSettingsService) private readonly systemSettingsService: SystemSettingsService,
    @Inject(SecurityCenterService) private readonly securityCenterService: SecurityCenterService,
    @Inject(SecurityOperationAlertSlaService) private readonly operationAlertSlaService: SecurityOperationAlertSlaService,
    @Inject(PlatformEventsService) private readonly platformEventsService: PlatformEventsService,
  ) {}

  async overview(currentUser: AuthenticatedUser): Promise<SecurityApprovalWorkbenchOverview> {
    const items = await this.loadAll(currentUser.tenantId);
    const pending = items.filter((item) => item.status === 'PENDING');

    return {
      generated_at: new Date().toISOString(),
      summary: {
        total_count: items.length,
        pending_count: pending.length,
        approved_count: items.filter((item) => item.status === 'APPROVED').length,
        rejected_count: items.filter((item) => item.status === 'REJECTED').length,
        applied_count: items.filter((item) => item.status === 'APPLIED').length,
        high_risk_pending_count: pending.filter((item) => item.risk_level === 'HIGH' || item.risk_level === 'CRITICAL').length,
        archive_delete_pending_count: pending.filter((item) => item.risk_domain === 'AUDIT_ARCHIVE').length,
        oldest_pending_at: oldestDate(pending.map((item) => item.requested_at)),
      },
      by_type: buildTypeStats(items),
      by_risk_domain: buildRiskDomainStats(items),
      recent_pending: pending.slice(0, 8).map(stripDetail),
    };
  }

  async list(
    currentUser: AuthenticatedUser,
    query: ListSecurityApprovalWorkbenchDto,
  ): Promise<PaginatedResult<SecurityApprovalWorkbenchItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const items = filterItems(await this.loadAll(currentUser.tenantId), query);

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize).map(stripDetail),
      page,
      page_size: pageSize,
      total: items.length,
    };
  }

  async exportCsv(currentUser: AuthenticatedUser, query: ListSecurityApprovalWorkbenchDto): Promise<string> {
    const items = filterItems(await this.loadAll(currentUser.tenantId), query).slice(0, 5000);

    await this.platformEventsService.recordEvent({
      tenantId: currentUser.tenantId,
      departmentId: currentUser.departmentId ?? null,
      userId: currentUser.id,
      resourceType: 'SECURITY_APPROVAL_WORKBENCH',
      resourceId: 'approval-workbench',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      eventSource: 'security_center',
      eventType: 'platform.security.approval_workbench.exported',
      status: 'SUCCESS',
      severity: 'INFO',
      summary: `统一安全审批工作台已导出 ${items.length} 条记录。`,
      payloadJson: toJsonInput({
        exported_count: items.length,
        filter: approvalWorkbenchExportFilter(query),
      }),
      sourceSystem: 'security_center',
      sourceId: 'approval-workbench',
      dedupeKey: null,
    });

    return buildApprovalWorkbenchCsv(items.map(stripDetail));
  }

  async get(currentUser: AuthenticatedUser, id: string): Promise<SecurityApprovalWorkbenchDetail> {
    const item = (await this.loadAll(currentUser.tenantId)).find((approval) => approval.id === id);
    if (!item) {
      throw new NotFoundException('安全审批记录不存在。');
    }

    return {
      ...stripDetail(item),
      metadata: item.metadata,
      timeline: item.timeline,
    };
  }

  async review(
    currentUser: AuthenticatedUser,
    id: string,
    input: ReviewSecurityApprovalWorkbenchDto,
  ): Promise<SecurityApprovalWorkbenchDetail> {
    const item = await this.get(currentUser, id);
    if (item.status !== 'PENDING') {
      throw new BadRequestException('只有待审批记录可以处理。');
    }

    const payload = { decision_note: input.decision_note ?? null };
    if (item.type === 'TOOL_CALL') {
      if (input.decision === 'APPROVE') await this.approvalsService.approve(currentUser, item.source_id, payload);
      else await this.approvalsService.reject(currentUser, item.source_id, payload);
    } else if (item.type === 'NOTIFICATION_POLICY') {
      if (input.decision === 'APPROVE') {
        await this.systemSettingsService.approveNotificationPolicyApproval(currentUser, item.source_id, payload);
      } else {
        await this.systemSettingsService.rejectNotificationPolicyApproval(currentUser, item.source_id, payload);
      }
    } else if (item.type === 'APPROVAL_AUDIT_ARCHIVE_DELETE') {
      if (input.decision === 'APPROVE') await this.approvalsService.approveArchiveDeleteApproval(currentUser, item.source_id, payload);
      else await this.approvalsService.rejectArchiveDeleteApproval(currentUser, item.source_id, payload);
    } else if (item.type === 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE') {
      if (input.decision === 'APPROVE') {
        await this.agentTeamsService.approveRunReportArchiveDeleteApproval(currentUser, item.source_id, payload);
      } else {
        await this.agentTeamsService.rejectRunReportArchiveDeleteApproval(currentUser, item.source_id, payload);
      }
    } else if (item.type === 'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE') {
      if (input.decision === 'APPROVE') {
        await this.securityCenterService.approveOperationAlertNotificationArchiveApproval(currentUser, item.source_id, payload);
      } else {
        await this.securityCenterService.rejectOperationAlertNotificationArchiveApproval(currentUser, item.source_id, payload);
      }
    } else if (item.type === 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE') {
      if (input.decision === 'APPROVE') {
        await this.operationAlertSlaService.approveDeadLetterAuditArchiveApproval(currentUser, item.source_id, payload);
      } else {
        await this.operationAlertSlaService.rejectDeadLetterAuditArchiveApproval(currentUser, item.source_id, payload);
      }
    } else if (item.type === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE') {
      if (input.decision === 'APPROVE') {
        await this.securityCenterService.approveNotificationTaskRecoveryAuditArchiveApproval(currentUser, item.source_id, payload);
      } else {
        await this.securityCenterService.rejectNotificationTaskRecoveryAuditArchiveApproval(currentUser, item.source_id, payload);
      }
    }

    return this.get(currentUser, id);
  }

  private async loadAll(tenantId: string): Promise<WorkbenchSourceRecord[]> {
    const [
      toolApprovals,
      notificationApprovals,
      approvalAuditEvents,
      agentTeamReportArchiveEvents,
      operationNotificationEvents,
      slaEvents,
      recoveryEvents,
    ] =
      await Promise.all([
        this.loadToolApprovals(tenantId),
        this.loadNotificationApprovals(tenantId),
        this.loadApprovalAuditArchiveEvents(tenantId),
        this.loadAgentTeamRunReportArchiveEvents(tenantId),
        this.loadPlatformArchiveEvents(tenantId, [
          'platform.security.approval_operation_alert_notification.archive.delete_requested',
          'platform.security.approval_operation_alert_notification.archive.delete_approved',
          'platform.security.approval_operation_alert_notification.archive.delete_rejected',
          'platform.security.approval_operation_alert_notification.archive.delete_applied',
        ]),
        this.loadPlatformArchiveEvents(tenantId, [
          'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_requested',
          'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_approved',
          'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_rejected',
          'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_applied',
        ]),
        this.loadPlatformArchiveEvents(tenantId, [
          'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested',
          'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_approved',
          'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_rejected',
          'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_applied',
        ]),
      ]);

    return [
      ...toolApprovals.map(mapToolApproval),
      ...notificationApprovals.map(mapNotificationApproval),
      ...buildApprovalAuditArchiveDeleteItems(approvalAuditEvents),
      ...buildAgentTeamRunReportArchiveDeleteItems(agentTeamReportArchiveEvents),
      ...buildPlatformArchiveDeleteItems(operationNotificationEvents, {
        type: 'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE',
        sourceModule: '运营告警通知归档',
        title: '运营告警通知审计归档删除',
        description: '删除来源型运营告警通知投递审计归档，需要安全审批后生效。',
        riskDomain: 'OPERATION_ALERT',
      }),
      ...buildPlatformArchiveDeleteItems(slaEvents, {
        type: 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE',
        sourceModule: 'SLA 死信审计归档',
        title: 'SLA 死信审计归档删除',
        description: '删除 SLA 死信处置审计归档，需要安全审批后生效。',
        riskDomain: 'AUDIT_ARCHIVE',
      }),
      ...buildPlatformArchiveDeleteItems(recoveryEvents, {
        type: 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE',
        sourceModule: '通知任务自愈审计归档',
        title: '通知任务自愈审计归档删除',
        description: '删除通知任务自愈闭环审计归档，需要安全审批后生效。',
        riskDomain: 'AUDIT_ARCHIVE',
      }),
    ].sort((left, right) => Date.parse(right.requested_at) - Date.parse(left.requested_at));
  }

  private loadToolApprovals(tenantId: string) {
    return this.prisma.toolApprovalRequest.findMany({
      where: { tenantId },
      include: approvalInclude,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  private loadNotificationApprovals(tenantId: string) {
    return this.prisma.systemSettingSnapshot.findMany({
      where: {
        tenantId,
        settingKey: { in: [...NOTIFICATION_SETTING_KEYS] },
        approvalStatus: { in: ['PENDING', 'APPROVED', 'REJECTED'] },
      },
      include: snapshotInclude,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  private loadApprovalAuditArchiveEvents(tenantId: string) {
    return this.prisma.approvalAuditEvent.findMany({
      where: {
        tenantId,
        sourceType: 'APPROVAL_AUDIT_ARCHIVE',
        eventType: { in: ['DELETE_REQUESTED', 'APPROVED', 'REJECTED', 'DELETE_APPLIED'] },
      },
      include: approvalAuditInclude,
      orderBy: { occurredAt: 'desc' },
      take: 500,
    });
  }

  private loadAgentTeamRunReportArchiveEvents(tenantId: string) {
    return this.prisma.approvalAuditEvent.findMany({
      where: {
        tenantId,
        sourceType: 'AGENT_TEAM_RUN_REPORT_ARCHIVE',
        eventType: { in: ['DELETE_REQUESTED', 'APPROVED', 'REJECTED', 'DELETE_APPLIED'] },
      },
      include: approvalAuditInclude,
      orderBy: { occurredAt: 'desc' },
      take: 500,
    });
  }

  private loadPlatformArchiveEvents(tenantId: string, eventTypes: string[]) {
    return this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        eventType: { in: eventTypes },
      },
      include: platformEventInclude,
      orderBy: { occurredAt: 'desc' },
      take: 500,
    });
  }
}

function mapToolApproval(approval: ToolApprovalRecord): WorkbenchSourceRecord {
  const timeline = buildSimpleTimeline({
    id: approval.id,
    status: approval.status,
    note: approval.reason,
    createdAt: approval.createdAt,
    reviewedAt: approval.reviewedAt,
    requester: approval.requester,
    reviewer: approval.reviewer,
  });

  return {
    id: `TOOL_CALL:${approval.id}`,
    source_id: approval.id,
    type: 'TOOL_CALL',
    source_module: '工具调用审批',
    title: `工具调用审批：${approval.tool.name}`,
    description: `${approval.toolCallLog.requestMethod} ${approval.toolCallLog.requestUrl}`,
    status: normalizeApprovalStatus(approval.status),
    risk_domain: 'TOOL',
    risk_level: normalizeToolRiskLevel(approval.tool.riskLevel),
    target_id: approval.toolId,
    target_label: approval.tool.name,
    reason: approval.reason,
    requester: mapActor(approval.requester),
    reviewer: mapActor(approval.reviewer),
    requested_at: approval.createdAt.toISOString(),
    reviewed_at: approval.reviewedAt?.toISOString() ?? null,
    request_id: null,
    trace_id: null,
    metadata: {
      tool_code: approval.tool.code,
      agent_name: approval.agent?.name ?? null,
      conversation_title: approval.conversation?.title ?? null,
      trigger_source: approval.triggerSource,
      execution_status: approval.toolCallLog.status,
      request_method: approval.toolCallLog.requestMethod as ToolMethod,
      request_url: approval.toolCallLog.requestUrl,
    },
    timeline,
  };
}

function mapNotificationApproval(snapshot: SystemSettingSnapshotRecord): WorkbenchSourceRecord {
  return {
    id: `NOTIFICATION_POLICY:${snapshot.id}`,
    source_id: snapshot.id,
    type: 'NOTIFICATION_POLICY',
    source_module: '通知策略审批',
    title: `通知策略变更：${snapshot.settingName}`,
    description: snapshot.impactSummary ?? `${snapshot.action} ${snapshot.settingKey}`,
    status: normalizeApprovalStatus(snapshot.approvalStatus),
    risk_domain: 'POLICY',
    risk_level: snapshot.impactLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
    target_id: snapshot.settingId,
    target_label: snapshot.settingName,
    reason: snapshot.impactSummary,
    requester: mapActor(snapshot.creator),
    reviewer: null,
    requested_at: snapshot.createdAt.toISOString(),
    reviewed_at: snapshot.approvalStatus === 'PENDING' ? null : snapshot.createdAt.toISOString(),
    request_id: null,
    trace_id: null,
    metadata: {
      setting_key: snapshot.settingKey,
      action: snapshot.action,
      version: snapshot.version,
      impact_level: snapshot.impactLevel,
      previous_status: snapshot.previousStatus,
      next_status: snapshot.nextStatus,
      previous_value: snapshot.previousValue,
      next_value: snapshot.nextValue,
    },
    timeline: buildSimpleTimeline({
      id: snapshot.id,
      status: snapshot.approvalStatus,
      note: snapshot.impactSummary,
      createdAt: snapshot.createdAt,
      reviewedAt: snapshot.approvalStatus === 'PENDING' ? null : snapshot.createdAt,
      requester: snapshot.creator,
      reviewer: null,
    }),
  };
}

function buildApprovalAuditArchiveDeleteItems(events: ApprovalAuditEventRecord[]): WorkbenchSourceRecord[] {
  const groups = groupBySource(events.map(mapApprovalAuditTimeline));
  return Array.from(groups.entries())
    .map(([sourceId, timeline]) => buildArchiveItemFromTimeline(timeline, {
      sourceId,
      type: 'APPROVAL_AUDIT_ARCHIVE_DELETE',
      sourceModule: '审批审计归档',
      title: '审批审计归档删除',
      description: '删除审批审计归档属于高危审计操作，需要审批后生效。',
      riskDomain: 'AUDIT_ARCHIVE',
    }))
    .filter((item): item is WorkbenchSourceRecord => Boolean(item));
}

function buildAgentTeamRunReportArchiveDeleteItems(events: ApprovalAuditEventRecord[]): WorkbenchSourceRecord[] {
  const groups = groupBySource(events.map(mapApprovalAuditTimeline));
  return Array.from(groups.entries())
    .map(([sourceId, timeline]) => buildArchiveItemFromTimeline(timeline, {
      sourceId,
      type: 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE',
      sourceModule: '团队运行报告归档',
      title: '团队运行报告归档删除',
      description: '删除多 Agent 团队运行报告归档属于高危审计操作，需要审批后生效。',
      riskDomain: 'AUDIT_ARCHIVE',
    }))
    .filter((item): item is WorkbenchSourceRecord => Boolean(item));
}

function buildPlatformArchiveDeleteItems(
  events: PlatformEventRecord[],
  config: {
    type: Exclude<
      SecurityApprovalWorkbenchType,
      'TOOL_CALL' | 'NOTIFICATION_POLICY' | 'APPROVAL_AUDIT_ARCHIVE_DELETE' | 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE'
    >;
    sourceModule: string;
    title: string;
    description: string;
    riskDomain: SecurityApprovalWorkbenchRiskDomain;
  },
): WorkbenchSourceRecord[] {
  const groups = groupBySource(events.map(mapPlatformTimeline));
  return Array.from(groups.entries())
    .map(([sourceId, timeline]) => buildArchiveItemFromTimeline(timeline, { sourceId, ...config }))
    .filter((item): item is WorkbenchSourceRecord => Boolean(item));
}

function buildArchiveItemFromTimeline(
  timeline: SecurityApprovalWorkbenchTimelineItem[],
  config: {
    sourceId: string;
    type: SecurityApprovalWorkbenchType;
    sourceModule: string;
    title: string;
    description: string;
    riskDomain: SecurityApprovalWorkbenchRiskDomain;
  },
): WorkbenchSourceRecord | null {
  const sorted = timeline.sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));
  const request = sorted.find((event) => event.type === 'DELETE_REQUESTED');
  if (!request) return null;
  const reversed = [...sorted].reverse();
  const applied = reversed.find((event) => event.type === 'DELETE_APPLIED') ?? null;
  const approved = reversed.find((event) => event.type === 'APPROVED') ?? null;
  const rejected = reversed.find((event) => event.type === 'REJECTED') ?? null;
  const decision = applied ?? rejected ?? approved;
  const metadata = archiveMetadata(request);

  return {
    id: `${config.type}:${request.id}`,
    source_id: request.id,
    type: config.type,
    source_module: config.sourceModule,
    title: config.title,
    description: config.description,
    status: archiveStatus({ applied, approved, rejected }),
    risk_domain: config.riskDomain,
    risk_level: 'CRITICAL',
    target_id: metadata.archive_id,
    target_label: metadata.archive_file_name,
    reason: request.note,
    requester: request.actor,
    reviewer: decision?.actor ?? null,
    requested_at: request.occurred_at,
    reviewed_at: decision?.occurred_at ?? null,
    request_id: request.request_id,
    trace_id: request.trace_id,
    metadata,
    timeline: sorted,
  };
}

function buildSimpleTimeline(input: {
  id: string;
  status: string;
  note: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  requester: { id: string; name: string; email: string } | null;
  reviewer: { id: string; name: string; email: string } | null;
}): SecurityApprovalWorkbenchTimelineItem[] {
  const events: SecurityApprovalWorkbenchTimelineItem[] = [
    {
      id: `${input.id}:created`,
      type: 'REQUEST_CREATED',
      title: '审批请求已创建',
      status: 'INFO',
      note: input.note,
      actor: mapActor(input.requester),
      request_id: null,
      trace_id: null,
      occurred_at: input.createdAt.toISOString(),
    },
  ];

  if (input.reviewedAt && input.status !== 'PENDING') {
    events.push({
      id: `${input.id}:reviewed`,
      type: input.status,
      title: input.status === 'APPROVED' ? '审批已批准' : '审批已拒绝',
      status: input.status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      note: null,
      actor: mapActor(input.reviewer),
      request_id: null,
      trace_id: null,
      occurred_at: input.reviewedAt.toISOString(),
    });
  }

  return events;
}

function mapApprovalAuditTimeline(event: ApprovalAuditEventRecord): SecurityApprovalWorkbenchTimelineItem {
  const metadata = jsonObject(event.metadata);
  return {
    id: event.id,
    type: event.eventType,
    title: event.title,
    status: event.eventStatus,
    note: event.note,
    actor: mapActor(event.actor),
    request_id: event.requestId,
    trace_id: event.traceId,
    occurred_at: event.occurredAt.toISOString(),
    source_id: event.sourceId,
    ...archiveTimelineMetadata(metadata),
  } as SecurityApprovalWorkbenchTimelineItem;
}

function mapPlatformTimeline(event: PlatformEventRecord): SecurityApprovalWorkbenchTimelineItem {
  const payload = jsonObject(event.payloadJson);
  return {
    id: event.id,
    type: normalizeArchiveEventType(payload.event_type, event.eventType),
    title: event.summary ?? '归档审批事件',
    status: event.status,
    note: typeof payload.note === 'string' ? payload.note : null,
    actor: mapActor(event.user),
    request_id: event.requestId,
    trace_id: event.traceId,
    occurred_at: event.occurredAt.toISOString(),
    ...archiveTimelineMetadata(payload),
  } as SecurityApprovalWorkbenchTimelineItem;
}

function archiveTimelineMetadata(metadata: Record<string, unknown>) {
  const archiveKey = typeof metadata.archive_key === 'string' ? metadata.archive_key : null;
  const inferred = inferArchiveContext(archiveKey);
  return {
    archive_id: typeof metadata.archive_id === 'string' ? metadata.archive_id : null,
    archive_key: archiveKey,
    archive_file_name: typeof metadata.archive_file_name === 'string' ? metadata.archive_file_name : null,
    archive_size_bytes: typeof metadata.archive_size_bytes === 'number' ? metadata.archive_size_bytes : 0,
    archive_folder: typeof metadata.archive_folder === 'string' ? metadata.archive_folder : inferred.archiveFolder,
    archive_source: typeof metadata.archive_source === 'string' ? metadata.archive_source : inferred.archiveSource,
    archive_context: typeof metadata.archive_context === 'string' ? metadata.archive_context : inferred.archiveContext,
    team_id: typeof metadata.team_id === 'string' ? metadata.team_id : inferred.teamId,
    team_name: typeof metadata.team_name === 'string' ? metadata.team_name : null,
    run_id: typeof metadata.run_id === 'string' ? metadata.run_id : inferred.runId,
    run_objective: typeof metadata.run_objective === 'string' ? metadata.run_objective : null,
  };
}

function archiveMetadata(event: SecurityApprovalWorkbenchTimelineItem) {
  const raw = event as SecurityApprovalWorkbenchTimelineItem & {
    archive_id?: string | null;
    archive_key?: string | null;
    archive_file_name?: string | null;
    archive_size_bytes?: number;
    archive_folder?: string | null;
    archive_source?: string | null;
    archive_context?: string | null;
    source_id?: string | null;
    team_id?: string | null;
    team_name?: string | null;
    run_id?: string | null;
    run_objective?: string | null;
  };
  const archiveKey = raw.archive_key ?? '';
  const inferred = inferArchiveContext(archiveKey || null);
  return {
    archive_id: raw.archive_id ?? event.id,
    archive_key: archiveKey,
    archive_file_name: raw.archive_file_name ?? archiveKey.split('/').at(-1) ?? '归档文件',
    archive_size_bytes: raw.archive_size_bytes ?? 0,
    archive_folder: raw.archive_folder ?? inferred.archiveFolder,
    archive_source: raw.archive_source ?? inferred.archiveSource,
    archive_context: raw.archive_context ?? inferred.archiveContext,
    source_id: raw.source_id ?? null,
    team_id: raw.team_id ?? inferred.teamId,
    team_name: raw.team_name ?? null,
    run_id: raw.run_id ?? inferred.runId,
    run_objective: raw.run_objective ?? null,
  };
}

function inferArchiveContext(archiveKey: string | null) {
  if (!archiveKey) {
    return {
      archiveFolder: null,
      archiveSource: null,
      archiveContext: null,
      teamId: null,
      runId: null,
    };
  }

  const parts = archiveKey.split('/').filter(Boolean);
  const fileName = parts.at(-1) ?? '';
  const archiveFolder = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
  const archiveSource = parts[0] ?? null;
  const fileNameWithoutExtension = fileName.endsWith('.csv') ? fileName.slice(0, -4) : fileName;
  const candidateRunId = fileNameWithoutExtension.slice(-36);
  const teamId = parts.length >= 3 && parts[0] === AGENT_TEAM_RUN_REPORT_ARCHIVE_PREFIX ? parts[1] ?? null : null;
  const runId = teamId && isUuid(candidateRunId) ? candidateRunId : null;

  return {
    archiveFolder,
    archiveSource,
    archiveContext: teamId || runId ? '团队运行报告归档' : archiveSource,
    teamId,
    runId,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function groupBySource(events: SecurityApprovalWorkbenchTimelineItem[]) {
  const groups = new Map<string, SecurityApprovalWorkbenchTimelineItem[]>();
  for (const event of events) {
    const metadata = archiveMetadata(event);
    const source = metadata.source_id || metadata.archive_id || event.id;
    groups.set(source, [...(groups.get(source) ?? []), event]);
  }
  return groups;
}

function filterItems(items: WorkbenchSourceRecord[], query: ListSecurityApprovalWorkbenchDto) {
  const keyword = query.keyword?.trim().toLowerCase();
  return items.filter((item) => {
    if (query.type && item.type !== query.type) return false;
    if (query.status && item.status !== query.status) return false;
    if (query.risk_domain && item.risk_domain !== query.risk_domain) return false;
    if (!keyword) return true;
    return [
      item.id,
      item.source_id,
      item.title,
      item.description,
      item.source_module,
      item.target_label,
      item.reason,
      item.requester?.name,
      item.requester?.email,
      item.reviewer?.name,
      item.reviewer?.email,
      item.request_id,
      item.trace_id,
      ...Object.entries(item.metadata).flatMap(([key, value]) => [key, searchableMetadataValue(value)]),
      ...item.timeline.flatMap((event) => [
        event.id,
        event.title,
        event.note,
        event.actor?.name,
        event.actor?.email,
        event.request_id,
        event.trace_id,
      ]),
    ].some((value) => value?.toLowerCase().includes(keyword));
  });
}

function searchableMetadataValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function approvalWorkbenchExportFilter(query: ListSecurityApprovalWorkbenchDto) {
  return {
    keyword: query.keyword?.trim() || null,
    type: query.type ?? null,
    status: query.status ?? null,
    risk_domain: query.risk_domain ?? null,
  };
}

function buildApprovalWorkbenchCsv(items: SecurityApprovalWorkbenchItem[]) {
  const rows = [
    [
      '审批ID',
      '来源ID',
      '审批类型',
      '来源模块',
      '标题',
      '状态',
      '风险域',
      '风险等级',
      '审批对象ID',
      '审批对象',
      '审批原因',
      '申请人',
      '申请人邮箱',
      '审批人',
      '审批人邮箱',
      '申请时间',
      '审批时间',
      '请求ID',
      'Trace ID',
    ],
    ...items.map((item) => [
      item.id,
      item.source_id,
      item.type,
      item.source_module,
      item.title,
      item.status,
      item.risk_domain,
      item.risk_level,
      item.target_id ?? '',
      item.target_label,
      item.reason ?? '',
      item.requester?.name ?? '系统',
      item.requester?.email ?? '',
      item.reviewer?.name ?? '',
      item.reviewer?.email ?? '',
      item.requested_at,
      item.reviewed_at ?? '',
      item.request_id ?? '',
      item.trace_id ?? '',
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function stripDetail(item: WorkbenchSourceRecord): SecurityApprovalWorkbenchItem {
  const { metadata: _metadata, timeline: _timeline, ...rest } = item;
  return rest;
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function buildTypeStats(items: WorkbenchSourceRecord[]): SecurityApprovalWorkbenchOverview['by_type'] {
  return uniqueValues(items.map((item) => item.type)).map((type) => {
    const scoped = items.filter((item) => item.type === type);
    return {
      type,
      total_count: scoped.length,
      pending_count: scoped.filter((item) => item.status === 'PENDING').length,
      approved_count: scoped.filter((item) => item.status === 'APPROVED').length,
      rejected_count: scoped.filter((item) => item.status === 'REJECTED').length,
      applied_count: scoped.filter((item) => item.status === 'APPLIED').length,
    };
  });
}

function buildRiskDomainStats(items: WorkbenchSourceRecord[]): SecurityApprovalWorkbenchOverview['by_risk_domain'] {
  return uniqueValues(items.map((item) => item.risk_domain)).map((riskDomain) => {
    const scoped = items.filter((item) => item.risk_domain === riskDomain);
    return {
      risk_domain: riskDomain,
      total_count: scoped.length,
      pending_count: scoped.filter((item) => item.status === 'PENDING').length,
      high_risk_pending_count: scoped.filter(
        (item) => item.status === 'PENDING' && (item.risk_level === 'HIGH' || item.risk_level === 'CRITICAL'),
      ).length,
    };
  });
}

function uniqueValues<TValue extends string>(values: TValue[]) {
  return Array.from(new Set(values));
}

function oldestDate(values: string[]) {
  return values.sort((left, right) => Date.parse(left) - Date.parse(right))[0] ?? null;
}

function normalizeApprovalStatus(status: string): SecurityApprovalWorkbenchStatus {
  if (status === 'APPROVED') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'APPLIED' || status === 'DELETE_APPLIED') return 'APPLIED';
  return 'PENDING';
}

function archiveStatus(input: {
  applied: SecurityApprovalWorkbenchTimelineItem | null;
  approved: SecurityApprovalWorkbenchTimelineItem | null;
  rejected: SecurityApprovalWorkbenchTimelineItem | null;
}): SecurityApprovalWorkbenchStatus {
  if (input.applied) return 'APPLIED';
  if (input.rejected) return 'REJECTED';
  if (input.approved) return 'APPROVED';
  return 'PENDING';
}

function normalizeToolRiskLevel(value: string): SecurityApprovalWorkbenchRiskLevel {
  if (value === 'CRITICAL') return 'CRITICAL';
  if (value === 'HIGH') return 'HIGH';
  if (value === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function normalizeArchiveEventType(value: unknown, eventType: string) {
  if (value === 'DELETE_REQUESTED' || value === 'APPROVED' || value === 'REJECTED' || value === 'DELETE_APPLIED') {
    return value;
  }
  if (eventType.endsWith('delete_requested')) return 'DELETE_REQUESTED';
  if (eventType.endsWith('delete_approved')) return 'APPROVED';
  if (eventType.endsWith('delete_rejected')) return 'REJECTED';
  return 'DELETE_APPLIED';
}

function mapActor(user: { id: string; name: string; email: string } | null | undefined) {
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    : null;
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
