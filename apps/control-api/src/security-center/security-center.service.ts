import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';

import {
  PERMISSION_CODES,
  type PaginatedResult,
  type AuditFailureItem,
  type CreateSecurityOperationAlertNotificationArchiveResult,
  type CreateSecurityOperationAlertNotificationTaskRecoveryAuditArchiveResult,
  type MonitorErrorSampleItem,
  type MonitorModule,
  type SecurityCenterEventDetail,
  type SecurityCenterEventListItem,
  type SecurityCenterEventSource,
  type SecurityCenterEventWindow,
  type SecurityCenterMetric,
  type SecurityCenterModuleSummary,
  type SecurityCenterDenialItem,
  type SecurityCenterOperationalAlert,
  type SecurityCenterOverview,
  type SecurityCenterRiskLevel,
  type SecurityCenterRiskSignal,
  type SecurityOperationAlertAction,
  type SecurityOperationAlertActionResult,
  type SecurityOperationAlertNotificationChannel,
  type SecurityOperationAlertNotificationArchiveApprovalDetail,
  type SecurityOperationAlertNotificationArchiveApprovalItem,
  type SecurityOperationAlertNotificationArchiveApprovalOverview,
  type SecurityOperationAlertNotificationArchiveApprovalTimelineItem,
  type SecurityOperationAlertNotificationArchiveItem,
  type SecurityOperationAlertNotificationArchiveListResult,
  type SecurityOperationAlertNotificationItem,
  type SecurityOperationAlertNotificationOverview,
  type SecurityOperationAlertNotificationResult,
  type SecurityOperationAlertNotificationStatus,
  type SecurityOperationAlertNotificationTaskRecoveryAction,
  type SecurityOperationAlertNotificationTaskRecoveryActionResult,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem,
  type SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult,
  type SecurityOperationAlertNotificationTaskRecoveryAuditItem,
  type SecurityOperationAlertNotificationTaskRecoveryAuditOverview,
  type SecurityOperationAlertNotificationTaskRecoveryFailureSource,
  type SecurityOperationAlertNotificationTaskRecoverySuggestion,
  type SecurityOperationAlertNotificationTaskRecoveryStatus,
  type SecurityOperationAlertStatus,
  type SecurityPolicyDecision,
  type SecurityPolicyEvaluationItem,
  type StorageDownloadUrlResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { ListSecurityCenterEventsDto } from './dto/list-security-center-events.dto';
import type { ListSecurityOperationAlertNotificationsDto } from './dto/list-security-operation-alert-notifications.dto';
import type { ListSecurityOperationAlertNotificationTaskRecoveryAuditsDto } from './dto/list-security-operation-alert-notification-task-recovery-audits.dto';

type EvaluationRecord = Prisma.SecurityPolicyEvaluationGetPayload<{
  include: {
    matchedPolicy: true;
    operator: true;
  };
}>;

type OperationSecurityEventRecord = Prisma.OperationLogGetPayload<{
  include: {
    user: true;
  };
}>;

type PolicySecurityEventRecord = Prisma.SecurityPolicyEvaluationGetPayload<{
  include: {
    matchedPolicy: true;
    operator: true;
  };
}>;

type SecurityOperationNotificationEventRecord = Prisma.PlatformEventGetPayload<object>;
type PlatformSecurityEventRecord = Prisma.PlatformEventGetPayload<{
  include: {
    user: true;
  };
}>;
type DedicatedSecurityEventRecord = Prisma.SecurityEventGetPayload<{
  include: {
    user: true;
  };
}>;

type NotificationTaskStats = ReturnType<typeof summarizeNotificationTaskEvents>;
type NotificationTaskPolicySnapshot = {
  auto_notify_enabled: boolean;
  auto_retry_enabled: boolean;
};
type NotificationDeliveryStats = {
  total: number;
  failed: number;
  partial: number;
  skipped: number;
  webhookFailed: number;
  latestWebhookError: string | null;
};
type NotificationTaskRecoveryLifecycle = {
  action: SecurityOperationAlertNotificationTaskRecoveryAction;
  note: string | null;
  occurredAt: Date;
};

type NotificationTaskRecoveryFailureSourceSummary = {
  failureSource: SecurityOperationAlertNotificationTaskRecoveryFailureSource;
  slaDeadLetterFailedCount: number;
  agentTeamReportArchiveDeleteFailedCount: number;
  recoveryArchiveDeleteFailedCount: number;
};

type ApprovalWorkbenchExportStats = {
  total: number;
  exportedRecords: number;
  highRiskExports: number;
  repeatedExports: number;
  oldestRiskAt: Date | null;
};

type ApprovalOperationStats = Omit<SecurityCenterOverview['approval_operations'], 'operational_alerts'> & {
  tool_pending_oldest_at: Date | null;
  runtime_pending_oldest_at: Date | null;
  notification_pending_oldest_at: Date | null;
  notification_high_impact_pending_oldest_at: Date | null;
  archive_delete_pending_oldest_at: Date | null;
  operation_alert_notification_archive_delete_pending_oldest_at: Date | null;
  agent_team_report_archive_delete_pending_oldest_at: Date | null;
  customer_success_close_won_report_archive_delete_pending_oldest_at: Date | null;
  sla_dead_letter_archive_delete_pending_oldest_at: Date | null;
  notification_task_recovery_audit_archive_delete_pending_oldest_at: Date | null;
  notification_task_failure_oldest_at: Date | null;
  approval_workbench_export_risk_oldest_at: Date | null;
  audit_risk_oldest_at: Date | null;
  audit_trace_gap_oldest_at: Date | null;
  approval_audit_oldest_at: Date | null;
  archive_storage_checked_at: Date;
};

const NOTIFICATION_POLICY_SETTING_KEYS = [
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

const SECURITY_OPERATION_ALERT_WEBHOOK_TIMEOUT_MS = 5000;
const OPERATION_ALERT_NOTIFICATION_ARCHIVE_PREFIX = 'audit-archives/security-operation-alert-notifications';
const OPERATION_ALERT_NOTIFICATION_ARCHIVE_DOWNLOAD_EXPIRES_IN = 300;
const NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_PREFIX = 'audit-archives/security-notification-task-recovery-audits';
const NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DOWNLOAD_EXPIRES_IN = 300;

@Injectable()
export class SecurityCenterService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storageService: StorageService,
  ) {}

  async getOverview(currentUser: AuthenticatedUser): Promise<SecurityCenterOverview> {
    const tenantId = currentUser.tenantId;
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      policyStats,
      dataScopeStats,
      resourceAclStats,
      approvalStats,
      auditStats,
      monitorStats,
      runtimeSecurityStats,
      recentEvaluations,
      recentDenials,
      recentAuditFailures,
      recentMonitorErrors,
      approvalOperations,
    ] = await Promise.all([
      this.loadPolicyStats(tenantId),
      this.loadDataScopeStats(tenantId),
      this.loadResourceAclStats(tenantId),
      this.loadApprovalStats(tenantId),
      this.loadAuditStats(tenantId, since24h),
      this.loadMonitorStats(tenantId, since24h),
      this.loadRuntimeSecurityStats(tenantId, since24h),
      this.loadRecentEvaluations(tenantId),
      this.loadRecentDenials(tenantId, since24h),
      this.loadRecentAuditFailures(tenantId, since24h),
      this.loadRecentMonitorErrors(tenantId, since24h),
      this.loadApprovalOperations(tenantId, since24h),
    ]);

    const metrics = {
      active_policies: policyStats.active,
      deny_policies: policyStats.deny,
      resource_acl_deny: resourceAclStats.deny,
      pending_approvals: approvalStats.pending,
      runtime_pending_approvals: approvalStats.runtimePending,
      security_events_24h: auditStats.securityEvents,
      security_policy_denials_24h: runtimeSecurityStats.securityPolicyDenials,
      list_data_scope_filters: runtimeSecurityStats.listDataScopeFilters,
      resource_acl_condition_checks: runtimeSecurityStats.resourceAclConditionChecks,
      failed_monitor_events_24h: monitorStats.failedEvents,
      configured_data_scope_roles: dataScopeStats.configuredRoleCount,
      custom_data_scopes: dataScopeStats.custom,
    };
    const posture = buildPosture(metrics);
    const modules = buildModules({
      policyStats,
      dataScopeStats,
      resourceAclStats,
      approvalStats,
      auditStats,
      monitorStats,
    });

    return {
      generated_at: new Date().toISOString(),
      posture,
      metrics,
      modules,
      approval_operations: approvalOperations,
      risks: buildRiskSignals(metrics, posture, approvalOperations),
      recent: {
        policy_evaluations: recentEvaluations,
        security_denials: recentDenials,
        audit_failures: recentAuditFailures,
        monitor_errors: recentMonitorErrors,
      },
    };
  }

  async listEvents(
    currentUser: AuthenticatedUser,
    query: ListSecurityCenterEventsDto,
  ): Promise<PaginatedResult<SecurityCenterEventListItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 20);
    const window = normalizeEventWindow(query.window);
    const since = eventWindowStart(window);
    const keyword = query.keyword?.trim().toLowerCase();
    const source = normalizeEventSource(query.source);

    const events = (await this.loadSecurityEvents(currentUser.tenantId, since)).filter((event) => {
      if (source && event.source !== source) return false;
      if (query.trace_only && !event.has_trace) return false;
      if (!keyword) return true;

      return [
        event.title,
        event.reason,
        event.resource_type,
        event.resource_id,
        event.action,
        event.path,
        event.method,
        event.request_id,
        event.trace_id,
        event.matched_code,
        event.source_record_id,
      ].some((value) => value?.toLowerCase().includes(keyword));
    });

    return {
      items: events.slice((page - 1) * pageSize, page * pageSize).map(stripEventDetail),
      page,
      page_size: pageSize,
      total: events.length,
    };
  }

  async notifyOperationAlert(
    currentUser: AuthenticatedUser,
    alertId: string,
    input: {
      channels?: SecurityOperationAlertNotificationChannel[];
      note?: string | null;
    },
  ): Promise<SecurityOperationAlertNotificationResult> {
    const overview = await this.getOverview(currentUser);
    const alert = overview.approval_operations.operational_alerts.find((item) => item.id === alertId);

    if (!alert) {
      throw new NotFoundException('Security operation alert not found');
    }

    return this.deliverOperationAlertNotification(currentUser, alert.id, input, {});
  }

  async updateOperationAlert(
    currentUser: AuthenticatedUser,
    alertId: string,
    input: {
      action: SecurityOperationAlertAction;
      note?: string | null;
    },
  ): Promise<SecurityOperationAlertActionResult> {
    const overview = await this.getOverview(currentUser);
    const alert = overview.approval_operations.operational_alerts.find((item) => item.id === alertId);

    if (!alert) {
      throw new NotFoundException('Security operation alert not found');
    }

    const occurredAt = new Date();
    const status = securityOperationStatusFromAction(input.action);
    const eventType = securityOperationAlertEventType(input.action);
    const alertCategory = securityOperationAlertCategory(alert);
    await this.prisma.platformEvent.create({
      data: {
        tenantId: currentUser.tenantId,
        userId: isSystemActor(currentUser) ? null : currentUser.id,
        actorType: isSystemActor(currentUser) ? 'SYSTEM' : 'USER',
        resourceType: 'security_operation_alert',
        resourceId: alert.id,
        requestId: currentUser.requestId,
        traceId: currentUser.traceId,
        eventSource: 'security_center',
        eventType,
        status: 'SUCCESS',
        severity: input.action === 'ESCALATE' ? 'WARN' : 'INFO',
        securityLevel: 'INTERNAL',
        billable: false,
        summary: securityOperationLifecycleMessage(input.action, alert.title),
        payloadJson: {
          alert_id: alert.id,
          title: alert.title,
          severity: alert.severity,
          metric: alert.metric,
          href: alert.href,
          alert_category: alertCategory,
          action: input.action,
          status,
          note: input.note ?? null,
          occurred_at: occurredAt.toISOString(),
        },
        occurredAt,
        sourceSystem: 'security_center',
        sourceId: `approval-operation-alert-lifecycle:${alert.id}:${input.action}:${occurredAt.toISOString()}`,
        dedupeKey: null,
      },
    });

    return {
      alert_id: alert.id,
      status,
      last_action: input.action,
      last_note: input.note ?? null,
      updated_at: occurredAt.toISOString(),
    };
  }

  async listOperationAlertNotifications(
    currentUser: AuthenticatedUser,
    query: ListSecurityOperationAlertNotificationsDto,
  ): Promise<SecurityOperationAlertNotificationOverview> {
    const items = await this.loadFilteredOperationAlertNotificationItems(currentUser.tenantId, query, 1000);

    return {
      generated_at: new Date().toISOString(),
      summary: buildSecurityOperationAlertNotificationSummary(items),
      items: items.slice(0, 100),
    };
  }

  async exportOperationAlertNotifications(
    currentUser: AuthenticatedUser,
    query: ListSecurityOperationAlertNotificationsDto,
  ): Promise<string> {
    const items = await this.loadFilteredOperationAlertNotificationItems(currentUser.tenantId, query, 1000);
    return buildSecurityOperationAlertNotificationCsv(items);
  }

  async createOperationAlertNotificationArchive(
    currentUser: AuthenticatedUser,
    query: ListSecurityOperationAlertNotificationsDto,
  ): Promise<CreateSecurityOperationAlertNotificationArchiveResult> {
    const csv = await this.exportOperationAlertNotifications(currentUser, query);
    const createdAt = new Date();
    const archiveKey = `${OPERATION_ALERT_NOTIFICATION_ARCHIVE_PREFIX}/${createdAt.toISOString().replace(/[:.]/g, '-')}.csv`;
    const item = await this.storageService.putTenantObject({
      tenantId: currentUser.tenantId,
      key: archiveKey,
      body: `\uFEFF${csv}`,
      contentType: 'text/csv; charset=utf-8',
      metadata: {
        archive_type: 'security_operation_alert_notification_audit',
        created_by: currentUser.id,
        status: query.status ?? '',
        alert_category: query.alert_category ?? '',
        keyword: query.keyword ?? '',
      },
    });

    return {
      item: mapOperationAlertNotificationArchive(item),
    };
  }

  async listOperationAlertNotificationArchives(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationArchiveListResult> {
    const items = (await this.storageService.listTenantObjects({
      tenantId: currentUser.tenantId,
      prefix: OPERATION_ALERT_NOTIFICATION_ARCHIVE_PREFIX,
      limit: 100,
    })).map(mapOperationAlertNotificationArchive);

    return {
      items,
      total: items.length,
      summary: {
        archive_count: items.length,
        total_size_bytes: items.reduce((sum, item) => sum + item.size_bytes, 0),
      },
    };
  }

  async getOperationAlertNotificationArchiveDownloadUrl(
    currentUser: AuthenticatedUser,
    archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    return this.storageService.getTenantObjectDownloadUrl(
      currentUser.tenantId,
      operationAlertNotificationArchiveKeyFromId(archiveId),
      OPERATION_ALERT_NOTIFICATION_ARCHIVE_DOWNLOAD_EXPIRES_IN,
    );
  }

  async deleteOperationAlertNotificationArchive(
    currentUser: AuthenticatedUser,
    archiveId: string,
  ): Promise<{ success: boolean; approval_id: string }> {
    const key = operationAlertNotificationArchiveKeyFromId(archiveId);
    const sourceId = operationAlertNotificationArchiveSourceIdFromKey(key);
    const existing = await this.findPendingOperationAlertNotificationArchiveDeleteApproval(
      currentUser.tenantId,
      sourceId,
    );

    if (existing) {
      return {
        success: true,
        approval_id: existing.id,
      };
    }

    const archive = mapOperationAlertNotificationArchive({
      key,
      relative_key: key,
      file_name: key.split('/').at(-1) ?? key,
      folder: OPERATION_ALERT_NOTIFICATION_ARCHIVE_PREFIX,
      size_bytes: 0,
      etag: null,
      last_modified: null,
    });
    const event = await this.recordOperationAlertNotificationArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId,
      eventType: 'DELETE_REQUESTED',
      status: 'WARNING',
      severity: 'WARN',
      summary: '运营告警通知审计归档删除待审批',
      note: '删除通知投递审计归档属于高危审计操作，已进入审批队列。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_id: archiveId,
        archive_key: key,
        archive_file_name: archive.file_name,
        archive_size_bytes: archive.size_bytes,
      },
    });

    return {
      success: true,
      approval_id: event.id,
    };
  }

  async getOperationAlertNotificationArchiveApprovalOverview(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalOverview> {
    const items = await this.listOperationAlertNotificationArchiveApprovals(currentUser);

    return {
      pending_count: items.filter((item) => item.status === 'PENDING').length,
      approved_count: items.filter((item) => item.status === 'APPROVED').length,
      rejected_count: items.filter((item) => item.status === 'REJECTED').length,
      applied_count: items.filter((item) => item.status === 'APPLIED').length,
    };
  }

  async listOperationAlertNotificationArchiveApprovals(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalItem[]> {
    const events = await this.loadOperationAlertNotificationArchiveDeleteEvents(currentUser.tenantId);
    return buildOperationAlertNotificationArchiveDeleteApprovals(events);
  }

  async getOperationAlertNotificationArchiveApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalDetail> {
    const events = await this.loadOperationAlertNotificationArchiveDeleteEvents(currentUser.tenantId);
    const item = buildOperationAlertNotificationArchiveDeleteApprovals(events).find(
      (approval) => approval.id === approvalId,
    );

    if (!item) {
      throw new NotFoundException('运营告警通知审计归档删除审批不存在。');
    }

    return {
      ...item,
      audit_timeline: events
        .filter((event) => event.source_id === item.archive_id)
        .sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at)),
    };
  }

  async approveOperationAlertNotificationArchiveApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    input: { decision_note?: string | null },
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalDetail> {
    const detail = await this.getOperationAlertNotificationArchiveApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('只有待审批的运营告警通知审计归档删除申请可以批准。');
    }

    await this.recordOperationAlertNotificationArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId: detail.archive_id,
      eventType: 'APPROVED',
      status: 'SUCCESS',
      severity: 'INFO',
      summary: '运营告警通知审计归档删除已批准',
      note: nullableText(input.decision_note),
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
        archive_size_bytes: detail.archive_size_bytes,
      },
    });

    await this.storageService.deleteTenantObject(currentUser.tenantId, detail.archive_key);

    await this.recordOperationAlertNotificationArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId: detail.archive_id,
      eventType: 'DELETE_APPLIED',
      status: 'SUCCESS',
      severity: 'INFO',
      summary: '运营告警通知审计归档删除已生效',
      note: '归档文件已从对象存储删除。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
        archive_size_bytes: detail.archive_size_bytes,
      },
    });

    return this.getOperationAlertNotificationArchiveApproval(currentUser, approvalId);
  }

  async rejectOperationAlertNotificationArchiveApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    input: { decision_note?: string | null },
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalDetail> {
    const detail = await this.getOperationAlertNotificationArchiveApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('只有待审批的运营告警通知审计归档删除申请可以拒绝。');
    }

    await this.recordOperationAlertNotificationArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId: detail.archive_id,
      eventType: 'REJECTED',
      status: 'WARNING',
      severity: 'WARN',
      summary: '运营告警通知审计归档删除已拒绝',
      note: nullableText(input.decision_note) ?? '归档删除申请已拒绝。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
        archive_size_bytes: detail.archive_size_bytes,
      },
    });

    return this.getOperationAlertNotificationArchiveApproval(currentUser, approvalId);
  }

  private async loadFilteredOperationAlertNotificationItems(
    tenantId: string,
    query: ListSecurityOperationAlertNotificationsDto,
    take: number,
  ) {
    const keyword = query.keyword?.trim().toLowerCase();
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert.notification_sent',
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take,
    });

    return events
      .map(mapSecurityOperationAlertNotificationEvent)
      .filter((item) => !query.status || item.status === query.status)
      .filter((item) => !query.alert_category || item.alert_category === query.alert_category)
      .filter((item) => {
        if (!keyword) return true;
        return [
          item.alert_id,
          item.notification_event_id,
          item.alert_category,
          item.status,
          item.message,
          item.webhook_error,
          item.request_id,
          item.trace_id,
          item.targets.join(' '),
          item.channels.join(' '),
        ].some((value) => value?.toLowerCase().includes(keyword));
      });
  }

  private async loadOperationAlertNotificationArchiveDeleteEvents(
    tenantId: string,
  ): Promise<SecurityOperationAlertNotificationArchiveApprovalTimelineItem[]> {
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        eventType: {
          in: [
            'platform.security.approval_operation_alert_notification.archive.delete_requested',
            'platform.security.approval_operation_alert_notification.archive.delete_approved',
            'platform.security.approval_operation_alert_notification.archive.delete_rejected',
            'platform.security.approval_operation_alert_notification.archive.delete_applied',
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 500,
    });

    return events.map(mapOperationAlertNotificationArchiveApprovalEvent);
  }

  private async findPendingOperationAlertNotificationArchiveDeleteApproval(tenantId: string, sourceId: string) {
    const events = (await this.loadOperationAlertNotificationArchiveDeleteEvents(tenantId)).filter(
      (event) => event.source_id === sourceId,
    );
    const approval = buildOperationAlertNotificationArchiveDeleteApprovals(events)[0] ?? null;
    return approval?.status === 'PENDING' ? approval : null;
  }

  private async recordOperationAlertNotificationArchiveEvent(input: {
    tenantId: string;
    userId: string | null;
    sourceId: string;
    eventType: 'DELETE_REQUESTED' | 'APPROVED' | 'REJECTED' | 'DELETE_APPLIED';
    status: string;
    severity: string;
    summary: string;
    note?: string | null;
    requestId?: string | null;
    traceId?: string | null;
    payload: Record<string, unknown>;
  }) {
    const eventTypeMap = {
      DELETE_REQUESTED: 'platform.security.approval_operation_alert_notification.archive.delete_requested',
      APPROVED: 'platform.security.approval_operation_alert_notification.archive.delete_approved',
      REJECTED: 'platform.security.approval_operation_alert_notification.archive.delete_rejected',
      DELETE_APPLIED: 'platform.security.approval_operation_alert_notification.archive.delete_applied',
    } satisfies Record<typeof input.eventType, string>;

    return this.prisma.platformEvent.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        actorType: input.userId ? 'USER' : 'SYSTEM',
        resourceType: 'SECURITY_OPERATION_ALERT_NOTIFICATION_ARCHIVE',
        resourceId: input.sourceId,
        requestId: input.requestId ?? null,
        traceId: input.traceId ?? null,
        eventSource: 'security_center',
        eventType: eventTypeMap[input.eventType],
        status: input.status,
        severity: input.severity,
        securityLevel: 'INTERNAL',
        billable: false,
        summary: input.summary,
        payloadJson: {
          ...input.payload,
          event_type: input.eventType,
          note: input.note ?? null,
        },
        occurredAt: new Date(),
        sourceSystem: 'security_center',
        sourceId: input.sourceId,
        dedupeKey: null,
      },
    });
  }

  async retryOperationAlertNotification(
    currentUser: AuthenticatedUser,
    notificationEventId: string,
  ): Promise<SecurityOperationAlertNotificationResult> {
    const event = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: notificationEventId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert.notification_sent',
      },
    });

    if (!event) {
      throw new NotFoundException('Security operation alert notification not found');
    }

    const notification = mapSecurityOperationAlertNotificationEvent(event);
    if (!isRetryableSecurityOperationNotification(notification.status)) {
      throw new NotFoundException('Only failed or partial security operation alert notifications can be retried');
    }

    return this.deliverOperationAlertNotification(
      currentUser,
      notification.alert_id,
      {
        channels: notification.channels.length ? notification.channels : ['IN_APP', 'WEBHOOK'],
        note: `重试投递 ${notification.notification_event_id}`,
      },
      {
        retriedFromEventId: notification.notification_event_id,
        retryCount: notification.retry_count + 1,
      },
    );
  }

  async listCurrentOperationAlerts(currentUser: AuthenticatedUser): Promise<SecurityCenterOperationalAlert[]> {
    const overview = await this.getOverview(currentUser);
    return overview.approval_operations.operational_alerts;
  }

  async updateNotificationTaskRecoverySuggestion(
    currentUser: AuthenticatedUser,
    suggestionId: string,
    input: {
      action: SecurityOperationAlertNotificationTaskRecoveryAction;
      note?: string | null;
    },
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryActionResult> {
    const overview = await this.getOverview(currentUser);
    const suggestion = overview.approval_operations.notification_task_recovery_suggestions.find(
      (item) => item.id === suggestionId,
    );

    if (!suggestion) {
      throw new NotFoundException('Notification task recovery suggestion not found');
    }

    const occurredAt = new Date();
    const status = notificationTaskRecoveryStatusFromAction(input.action);
    await this.prisma.platformEvent.create({
      data: {
        tenantId: currentUser.tenantId,
        userId: isSystemActor(currentUser) ? null : currentUser.id,
        actorType: isSystemActor(currentUser) ? 'SYSTEM' : 'USER',
        resourceType: 'security_operation_alert_notification_task_recovery_suggestion',
        resourceId: suggestion.id,
        requestId: currentUser.requestId,
        traceId: currentUser.traceId,
        eventSource: 'security_center',
        eventType: notificationTaskRecoveryEventType(input.action),
        status: 'SUCCESS',
        severity: input.action === 'RESOLVE' ? 'INFO' : 'WARN',
        securityLevel: 'INTERNAL',
        billable: false,
        summary: notificationTaskRecoveryLifecycleMessage(input.action, suggestion.title),
        payloadJson: {
          suggestion_id: suggestion.id,
          title: suggestion.title,
          severity: suggestion.severity,
          reason_code: suggestion.reason_code,
          failure_source: suggestion.failure_source,
          sla_dead_letter_failed_count: suggestion.sla_dead_letter_failed_count,
          agent_team_report_archive_delete_failed_count:
            suggestion.agent_team_report_archive_delete_failed_count,
          recovery_archive_delete_failed_count: suggestion.recovery_archive_delete_failed_count,
          action: input.action,
          status,
          note: input.note ?? null,
          evidence: suggestion.evidence,
          occurred_at: occurredAt.toISOString(),
        },
        occurredAt,
        sourceSystem: 'security_center',
        sourceId: `notification-task-recovery:${suggestion.id}:${input.action}:${occurredAt.toISOString()}`,
        dedupeKey: null,
      },
    });

    return {
      suggestion_id: suggestion.id,
      failure_source: suggestion.failure_source,
      status,
      last_action: input.action,
      last_note: input.note ?? null,
      updated_at: occurredAt.toISOString(),
    };
  }

  async listNotificationTaskRecoveryAudits(
    currentUser: AuthenticatedUser,
    query: ListSecurityOperationAlertNotificationTaskRecoveryAuditsDto,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditOverview> {
    const items = await this.loadFilteredNotificationTaskRecoveryAuditItems(currentUser.tenantId, query);

    return {
      generated_at: new Date().toISOString(),
      summary: buildNotificationTaskRecoveryAuditSummary(items),
      items,
    };
  }

  async exportNotificationTaskRecoveryAudits(
    currentUser: AuthenticatedUser,
    query: ListSecurityOperationAlertNotificationTaskRecoveryAuditsDto,
  ): Promise<string> {
    const items = await this.loadFilteredNotificationTaskRecoveryAuditItems(currentUser.tenantId, query);
    return buildNotificationTaskRecoveryAuditCsv(items);
  }

  async createNotificationTaskRecoveryAuditArchive(
    currentUser: AuthenticatedUser,
    query: ListSecurityOperationAlertNotificationTaskRecoveryAuditsDto,
  ): Promise<CreateSecurityOperationAlertNotificationTaskRecoveryAuditArchiveResult> {
    const csv = await this.exportNotificationTaskRecoveryAudits(currentUser, query);
    const createdAt = new Date();
    const archiveKey = `${NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_PREFIX}/${createdAt.toISOString().replace(/[:.]/g, '-')}.csv`;
    const item = await this.storageService.putTenantObject({
      tenantId: currentUser.tenantId,
      key: archiveKey,
      body: `\uFEFF${csv}`,
      contentType: 'text/csv; charset=utf-8',
        metadata: {
          archive_type: 'security_notification_task_recovery_audit',
          created_by: currentUser.id,
          action: query.action ?? '',
          status: query.status ?? '',
          reason_code: query.reason_code ?? '',
          failure_source: query.failure_source ?? '',
          keyword: query.keyword ?? '',
        },
    });

    return {
      item: mapNotificationTaskRecoveryAuditArchive(item),
    };
  }

  async listNotificationTaskRecoveryAuditArchives(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult> {
    const items = (await this.storageService.listTenantObjects({
      tenantId: currentUser.tenantId,
      prefix: NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_PREFIX,
      limit: 100,
    })).map(mapNotificationTaskRecoveryAuditArchive);

    return {
      items,
      total: items.length,
      summary: {
        archive_count: items.length,
        total_size_bytes: items.reduce((sum, item) => sum + item.size_bytes, 0),
      },
    };
  }

  async getNotificationTaskRecoveryAuditArchiveDownloadUrl(
    currentUser: AuthenticatedUser,
    archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    const key = notificationTaskRecoveryAuditArchiveKeyFromId(archiveId);
    return this.storageService.getTenantObjectDownloadUrl(
      currentUser.tenantId,
      key,
      NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DOWNLOAD_EXPIRES_IN,
    );
  }

  async deleteNotificationTaskRecoveryAuditArchive(
    currentUser: AuthenticatedUser,
    archiveId: string,
  ): Promise<{ success: boolean; approval_id: string }> {
    const key = notificationTaskRecoveryAuditArchiveKeyFromId(archiveId);
    const sourceId = notificationTaskRecoveryAuditArchiveSourceIdFromKey(key);
    const existing = await this.findPendingNotificationTaskRecoveryAuditArchiveDeleteApproval(
      currentUser.tenantId,
      sourceId,
    );

    if (existing) {
      return {
        success: true,
        approval_id: existing.id,
      };
    }

    const archive = mapNotificationTaskRecoveryAuditArchive({
      key,
      relative_key: key,
      file_name: key.split('/').at(-1) ?? key,
      folder: NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_PREFIX,
      size_bytes: 0,
      etag: null,
      last_modified: null,
    });
    const event = await this.recordNotificationTaskRecoveryAuditArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId,
      eventType: 'DELETE_REQUESTED',
      status: 'WARNING',
      severity: 'WARN',
      summary: '通知任务自愈闭环审计归档删除待审批',
      note: '删除归档属于高危审计操作，已进入审批队列。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_id: archiveId,
        archive_key: key,
        archive_file_name: archive.file_name,
        archive_size_bytes: archive.size_bytes,
      },
    });

    return {
      success: true,
      approval_id: event.id,
    };
  }

  async getNotificationTaskRecoveryAuditArchiveApprovalOverview(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview> {
    const items = await this.listNotificationTaskRecoveryAuditArchiveApprovals(currentUser);

    return {
      pending_count: items.filter((item) => item.status === 'PENDING').length,
      approved_count: items.filter((item) => item.status === 'APPROVED').length,
      rejected_count: items.filter((item) => item.status === 'REJECTED').length,
      applied_count: items.filter((item) => item.status === 'APPLIED').length,
    };
  }

  async listNotificationTaskRecoveryAuditArchiveApprovals(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem[]> {
    const events = await this.loadNotificationTaskRecoveryAuditArchiveDeleteEvents(currentUser.tenantId);
    return buildNotificationTaskRecoveryAuditArchiveDeleteApprovals(events);
  }

  async getNotificationTaskRecoveryAuditArchiveApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail> {
    const events = await this.loadNotificationTaskRecoveryAuditArchiveDeleteEvents(currentUser.tenantId);
    const item = buildNotificationTaskRecoveryAuditArchiveDeleteApprovals(events).find(
      (approval) => approval.id === approvalId,
    );

    if (!item) {
      throw new NotFoundException('通知任务自愈闭环审计归档删除审批不存在。');
    }

    return {
      ...item,
      audit_timeline: events
        .filter((event) => event.source_id === item.archive_id)
        .sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at)),
    };
  }

  async approveNotificationTaskRecoveryAuditArchiveApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    input: { decision_note?: string | null },
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail> {
    const detail = await this.getNotificationTaskRecoveryAuditArchiveApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('只有待审批的通知任务自愈闭环审计归档删除申请可以批准。');
    }

    await this.recordNotificationTaskRecoveryAuditArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId: detail.archive_id,
      eventType: 'APPROVED',
      status: 'SUCCESS',
      severity: 'INFO',
      summary: '通知任务自愈闭环审计归档删除已批准',
      note: nullableText(input.decision_note),
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
        archive_size_bytes: detail.archive_size_bytes,
      },
    });

    await this.storageService.deleteTenantObject(currentUser.tenantId, detail.archive_key);

    await this.recordNotificationTaskRecoveryAuditArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId: detail.archive_id,
      eventType: 'DELETE_APPLIED',
      status: 'SUCCESS',
      severity: 'INFO',
      summary: '通知任务自愈闭环审计归档删除已生效',
      note: '归档文件已从对象存储删除。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
        archive_size_bytes: detail.archive_size_bytes,
      },
    });

    return this.getNotificationTaskRecoveryAuditArchiveApproval(currentUser, approvalId);
  }

  async rejectNotificationTaskRecoveryAuditArchiveApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    input: { decision_note?: string | null },
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalDetail> {
    const detail = await this.getNotificationTaskRecoveryAuditArchiveApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('只有待审批的通知任务自愈闭环审计归档删除申请可以拒绝。');
    }

    await this.recordNotificationTaskRecoveryAuditArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId: detail.archive_id,
      eventType: 'REJECTED',
      status: 'WARNING',
      severity: 'WARN',
      summary: '通知任务自愈闭环审计归档删除已拒绝',
      note: nullableText(input.decision_note) ?? '归档删除申请已拒绝。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
        archive_size_bytes: detail.archive_size_bytes,
      },
    });

    return this.getNotificationTaskRecoveryAuditArchiveApproval(currentUser, approvalId);
  }

  private async loadFilteredNotificationTaskRecoveryAuditItems(
    tenantId: string,
    query: ListSecurityOperationAlertNotificationTaskRecoveryAuditsDto,
  ) {
    const keyword = query.keyword?.trim().toLowerCase();
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        resourceType: 'security_operation_alert_notification_task_recovery_suggestion',
        eventType: {
          in: [
            'platform.security.approval_operation_alert_notification_task.recovery_suggestion.acknowledged',
            'platform.security.approval_operation_alert_notification_task.recovery_suggestion.ignored',
            'platform.security.approval_operation_alert_notification_task.recovery_suggestion.resolved',
          ],
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 1000,
    });

    return events
      .map(mapNotificationTaskRecoveryAuditEvent)
      .filter((item) => !query.action || item.action === query.action)
      .filter((item) => !query.status || item.status === query.status)
      .filter((item) => !query.reason_code || item.reason_code === query.reason_code)
      .filter((item) => !query.failure_source || item.failure_source === query.failure_source)
      .filter((item) => {
        if (!keyword) return true;
        return [
          item.event_id,
          item.suggestion_id,
          item.title,
          item.reason_code,
          item.failure_source,
          notificationTaskRecoveryFailureSourceLabel(item.failure_source),
          item.action,
          item.status,
          item.note,
          item.evidence,
          item.request_id,
          item.trace_id,
        ].some((value) => value?.toLowerCase().includes(keyword));
      });
  }

  private async loadNotificationTaskRecoveryAuditArchiveDeleteEvents(
    tenantId: string,
  ): Promise<SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem[]> {
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        eventType: {
          in: [
            'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested',
            'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_approved',
            'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_rejected',
            'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_applied',
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 500,
    });

    return events.map(mapNotificationTaskRecoveryAuditArchiveApprovalEvent);
  }

  private async findPendingNotificationTaskRecoveryAuditArchiveDeleteApproval(tenantId: string, sourceId: string) {
    const events = (await this.loadNotificationTaskRecoveryAuditArchiveDeleteEvents(tenantId)).filter(
      (event) => event.source_id === sourceId,
    );
    const approval = buildNotificationTaskRecoveryAuditArchiveDeleteApprovals(events)[0] ?? null;
    return approval?.status === 'PENDING' ? approval : null;
  }

  private async recordNotificationTaskRecoveryAuditArchiveEvent(input: {
    tenantId: string;
    userId: string | null;
    sourceId: string;
    eventType: 'DELETE_REQUESTED' | 'APPROVED' | 'REJECTED' | 'DELETE_APPLIED';
    status: string;
    severity: string;
    summary: string;
    note?: string | null;
    requestId?: string | null;
    traceId?: string | null;
    payload: Record<string, unknown>;
  }) {
    const eventTypeMap = {
      DELETE_REQUESTED: 'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested',
      APPROVED: 'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_approved',
      REJECTED: 'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_rejected',
      DELETE_APPLIED: 'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_applied',
    } satisfies Record<typeof input.eventType, string>;

    return this.prisma.platformEvent.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        actorType: input.userId ? 'USER' : 'SYSTEM',
        resourceType: 'SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE',
        resourceId: input.sourceId,
        requestId: input.requestId ?? null,
        traceId: input.traceId ?? null,
        eventSource: 'security_center',
        eventType: eventTypeMap[input.eventType],
        status: input.status,
        severity: input.severity,
        securityLevel: 'INTERNAL',
        billable: false,
        summary: input.summary,
        payloadJson: {
          ...input.payload,
          event_type: input.eventType,
          note: input.note ?? null,
        },
        occurredAt: new Date(),
        sourceSystem: 'security_center',
        sourceId: input.sourceId,
        dedupeKey: null,
      },
    });
  }

  async getEvent(currentUser: AuthenticatedUser, eventId: string): Promise<SecurityCenterEventDetail> {
    const event = await this.findSecurityEvent(currentUser.tenantId, eventId);

    if (!event) {
      throw new NotFoundException('Security event not found');
    }

    return event;
  }

  private async loadExternalWebhookUrl(tenantId: string) {
    const setting = await this.prisma.systemSetting.findFirst({
      where: {
        tenantId,
        key: 'external_webhook_url',
        status: 'ACTIVE',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    const value = typeof setting?.value === 'string' ? setting.value.trim() : '';
    return value || null;
  }

  private async loadNotificationTaskPolicySnapshot(tenantId: string): Promise<NotificationTaskPolicySnapshot> {
    const settings = await this.prisma.systemSetting.findMany({
      where: {
        tenantId,
        category: 'NOTIFICATION',
        deletedAt: null,
        status: 'ACTIVE',
        key: {
          in: ['alert_notification_auto_notify_enabled', 'alert_notification_auto_retry_enabled'],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });
    const values = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      auto_notify_enabled: booleanSetting(values.get('alert_notification_auto_notify_enabled'), true),
      auto_retry_enabled: booleanSetting(values.get('alert_notification_auto_retry_enabled'), true),
    };
  }

  private async deliverOperationAlertNotification(
    currentUser: AuthenticatedUser,
    alertId: string,
    input: {
      channels?: SecurityOperationAlertNotificationChannel[];
      note?: string | null;
    },
    options: {
      retriedFromEventId?: string | null;
      retryCount?: number;
    },
  ): Promise<SecurityOperationAlertNotificationResult> {
    const overview = await this.getOverview(currentUser);
    const alert = overview.approval_operations.operational_alerts.find((item) => item.id === alertId);

    if (!alert) {
      throw new NotFoundException('Security operation alert not found');
    }

    const channels = normalizeSecurityOperationAlertChannels(input.channels);
    const deliveredAt = new Date();
    const targets = securityOperationAlertNotificationTargets(alert);
    const alertCategory = securityOperationAlertCategory(alert);
    const webhookUrl = channels.includes('WEBHOOK') ? await this.loadExternalWebhookUrl(currentUser.tenantId) : null;
    const webhookResult = webhookUrl
      ? await deliverSecurityOperationAlertWebhook(webhookUrl, alert, input.note ?? null, targets, alertCategory)
      : null;
    const webhookSkipped = channels.includes('WEBHOOK') && !webhookUrl;
    const status = securityOperationNotificationStatus(channels, webhookResult, webhookSkipped);
    const message = securityOperationNotificationMessage(status, channels, webhookSkipped);
    const deliveryEvent = await this.prisma.platformEvent.create({
      data: {
        tenantId: currentUser.tenantId,
        userId: isSystemActor(currentUser) ? null : currentUser.id,
        actorType: isSystemActor(currentUser) ? 'SYSTEM' : 'USER',
        resourceType: 'security_operation_alert',
        resourceId: alert.id,
        requestId: currentUser.requestId,
        traceId: currentUser.traceId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert.notification_sent',
        status: status === 'FAILED' ? 'FAILED' : status === 'SKIPPED' ? 'SKIPPED' : 'SUCCESS',
        severity: status === 'FAILED' ? 'WARN' : 'INFO',
        securityLevel: 'INTERNAL',
        billable: false,
        summary: message,
        payloadJson: {
          alert_id: alert.id,
          title: alert.title,
          severity: alert.severity,
          metric: alert.metric,
          href: alert.href,
          status,
          channels,
          targets,
          alert_category: alertCategory,
          note: input.note ?? null,
          webhook_status: webhookResult?.status ?? null,
          webhook_error: webhookResult?.error ?? null,
          retry_count: options.retryCount ?? 0,
          retried_from_event_id: options.retriedFromEventId ?? null,
          delivered_at: deliveredAt.toISOString(),
        },
        occurredAt: deliveredAt,
        sourceSystem: 'security_center',
        sourceId: `approval-operation-alert-notify:${alert.id}:${deliveredAt.toISOString()}`,
        dedupeKey: null,
      },
    });

    return {
      alert_id: alert.id,
      status,
      channels,
      targets,
      delivery_event_id: deliveryEvent.id,
      webhook_status: webhookResult?.status ?? null,
      message,
      delivered_at: deliveredAt.toISOString(),
    };
  }

  private async loadPolicyStats(tenantId: string) {
    const [total, active, disabled, deny, allow, evaluations] = await this.prisma.$transaction([
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          status: 'DISABLED',
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          effect: 'DENY',
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicy.count({
        where: {
          tenantId,
          effect: 'ALLOW',
          deletedAt: null,
        },
      }),
      this.prisma.securityPolicyEvaluation.count({
        where: {
          tenantId,
        },
      }),
    ]);

    return {
      total,
      active,
      disabled,
      deny,
      allow,
      evaluations,
    };
  }

  private async loadDataScopeStats(tenantId: string) {
    const [roleCount, configuredRoles, total, all, tenant, dept, self, custom] = await this.prisma.$transaction([
      this.prisma.role.count({
        where: {
          tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        distinct: ['roleId'],
        select: {
          roleId: true,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: 'ALL',
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: 'TENANT',
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: {
            in: ['DEPT', 'DEPT_AND_CHILD'],
          },
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: 'SELF',
          deletedAt: null,
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          scopeType: 'CUSTOM',
          deletedAt: null,
        },
      }),
    ]);

    return {
      roleCount,
      configuredRoleCount: configuredRoles.length,
      total,
      all,
      tenant,
      dept,
      self,
      custom,
    };
  }

  private async loadResourceAclStats(tenantId: string) {
    const [total, active, disabled, allow, deny] = await this.prisma.$transaction([
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          deletedAt: null,
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          status: 'DISABLED',
          deletedAt: null,
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          effect: 'ALLOW',
          deletedAt: null,
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          effect: 'DENY',
          deletedAt: null,
        },
      }),
    ]);

    return {
      total,
      active,
      disabled,
      allow,
      deny,
    };
  }

  private async loadApprovalStats(tenantId: string) {
    const [
      toolPending,
      toolApproved,
      toolRejected,
      runtimePending,
      testPending,
      notificationPending,
      notificationApproved,
      notificationRejected,
      notificationHighImpactPending,
    ] = await this.prisma.$transaction([
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'PENDING',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'APPROVED',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'REJECTED',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'PENDING',
          triggerSource: 'RUNTIME',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'PENDING',
          triggerSource: 'TEST',
        },
      }),
      this.prisma.systemSettingSnapshot.count({
        where: {
          tenantId,
          settingKey: {
            in: [...NOTIFICATION_POLICY_SETTING_KEYS],
          },
          approvalStatus: 'PENDING',
        },
      }),
      this.prisma.systemSettingSnapshot.count({
        where: {
          tenantId,
          settingKey: {
            in: [...NOTIFICATION_POLICY_SETTING_KEYS],
          },
          approvalStatus: 'APPROVED',
        },
      }),
      this.prisma.systemSettingSnapshot.count({
        where: {
          tenantId,
          settingKey: {
            in: [...NOTIFICATION_POLICY_SETTING_KEYS],
          },
          approvalStatus: 'REJECTED',
        },
      }),
      this.prisma.systemSettingSnapshot.count({
        where: {
          tenantId,
          settingKey: {
            in: [...NOTIFICATION_POLICY_SETTING_KEYS],
          },
          approvalStatus: 'PENDING',
          impactLevel: 'HIGH',
        },
      }),
    ]);
    const pending = toolPending + notificationPending;
    const approved = toolApproved + notificationApproved;
    const rejected = toolRejected + notificationRejected;

    return {
      pending,
      approved,
      rejected,
      toolPending,
      runtimePending,
      testPending,
      notificationPending,
      notificationApproved,
      notificationRejected,
      notificationHighImpactPending,
    };
  }

  private async loadAuditStats(tenantId: string, since: Date) {
    const [loginTotal, operationTotal, dedicatedSecurityEvents, failedLogin, failedOperation, configChanges] = await this.prisma.$transaction([
      this.prisma.loginLog.count({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.operationLog.count({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.securityEvent.count({
        where: {
          tenantId,
          occurredAt: {
            gte: since,
          },
        },
      }),
      this.prisma.loginLog.count({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.operationLog.count({
        where: {
          tenantId,
          statusCode: {
            gte: 400,
          },
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.operationLog.count({
        where: {
          tenantId,
          createdAt: {
            gte: since,
          },
          OR: configChangePathFilters(),
        },
      }),
    ]);
    const total = loginTotal + operationTotal;
    const failed = failedLogin + failedOperation;

    return {
      loginTotal,
      operationTotal,
      securityEvents: dedicatedSecurityEvents > 0 ? dedicatedSecurityEvents : failed,
      configChanges,
      successRate: ratioPercent(total - failed, total),
    };
  }

  private async loadApprovalOperations(tenantId: string, since: Date): Promise<SecurityCenterOverview['approval_operations']> {
    const [
      toolPending,
      toolApproved,
      toolRejected,
      runtimePending,
      notificationPending,
      notificationHighImpactPending,
      approvalAuditEvents,
      archiveDeleteEvents,
      operationAlertNotificationArchiveDeleteEvents,
      agentTeamReportArchiveDeleteEvents,
      customerSuccessCloseWonReportArchiveDeleteEvents,
      slaDeadLetterArchiveDeleteEvents,
      notificationTaskRecoveryAuditArchiveDeleteEvents,
      notificationTaskEvents,
      notificationDeliveryEvents,
      approvalWorkbenchExportEvents,
      archiveStorageStats,
      lifecycleEvents,
      notificationTaskRecoveryEvents,
      externalWebhookUrl,
      notificationTaskPolicy,
      toolPendingOldest,
      runtimePendingOldest,
      notificationPendingOldest,
      notificationHighImpactPendingOldest,
    ] = await Promise.all([
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'PENDING',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'APPROVED',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'REJECTED',
        },
      }),
      this.prisma.toolApprovalRequest.count({
        where: {
          tenantId,
          status: 'PENDING',
          triggerSource: 'RUNTIME',
        },
      }),
      this.prisma.systemSettingSnapshot.count({
        where: {
          tenantId,
          settingKey: {
            in: [...NOTIFICATION_POLICY_SETTING_KEYS],
          },
          approvalStatus: 'PENDING',
        },
      }),
      this.prisma.systemSettingSnapshot.count({
        where: {
          tenantId,
          settingKey: {
            in: [...NOTIFICATION_POLICY_SETTING_KEYS],
          },
          approvalStatus: 'PENDING',
          impactLevel: 'HIGH',
        },
      }),
      this.prisma.approvalAuditEvent.findMany({
        where: {
          tenantId,
          occurredAt: {
            gte: since,
          },
        },
        select: {
          eventStatus: true,
          traceId: true,
          occurredAt: true,
        },
        take: 1000,
      }),
      this.prisma.approvalAuditEvent.findMany({
        where: {
          tenantId,
          sourceType: 'APPROVAL_AUDIT_ARCHIVE',
          eventType: {
            in: ['DELETE_REQUESTED', 'APPROVED', 'REJECTED', 'DELETE_APPLIED'],
          },
        },
        select: {
          sourceId: true,
          eventType: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          eventSource: 'security_center',
          eventType: {
            in: [
              'platform.security.approval_operation_alert_notification.archive.delete_requested',
              'platform.security.approval_operation_alert_notification.archive.delete_approved',
              'platform.security.approval_operation_alert_notification.archive.delete_rejected',
              'platform.security.approval_operation_alert_notification.archive.delete_applied',
            ],
          },
        },
        select: {
          sourceId: true,
          eventType: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.prisma.approvalAuditEvent.findMany({
        where: {
          tenantId,
          sourceType: 'AGENT_TEAM_RUN_REPORT_ARCHIVE',
          eventType: {
            in: ['DELETE_REQUESTED', 'APPROVED', 'REJECTED', 'DELETE_APPLIED'],
          },
        },
        select: {
          sourceId: true,
          eventType: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.prisma.approvalAuditEvent.findMany({
        where: {
          tenantId,
          sourceType: 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE',
          eventType: {
            in: ['DELETE_REQUESTED', 'APPROVED', 'REJECTED', 'DELETE_APPLIED'],
          },
        },
        select: {
          sourceId: true,
          eventType: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          eventSource: 'security_center',
          eventType: {
            in: [
              'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_requested',
              'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_approved',
              'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_rejected',
              'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_applied',
            ],
          },
        },
        select: {
          sourceId: true,
          eventType: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          eventSource: 'security_center',
          eventType: {
            in: [
              'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested',
              'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_approved',
              'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_rejected',
              'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_applied',
            ],
          },
        },
        select: {
          sourceId: true,
          eventType: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          resourceType: 'security_operation_alert_notification_task',
          eventSource: 'security_center',
          eventType: {
            in: [
              'platform.security.approval_operation_alert_notification_task.manual_auto_notify',
              'platform.security.approval_operation_alert_notification_task.auto_notify_finished',
              'platform.security.approval_operation_alert_notification_task.manual_auto_retry',
              'platform.security.approval_operation_alert_notification_task.auto_retry_finished',
            ],
          },
          occurredAt: {
            gte: since,
          },
        },
        select: {
          eventType: true,
          payloadJson: true,
          occurredAt: true,
          requestId: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          eventSource: 'security_center',
          eventType: 'platform.security.approval_operation_alert.notification_sent',
          occurredAt: {
            gte: since,
          },
        },
        select: {
          payloadJson: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          eventSource: 'security_center',
          eventType: 'platform.security.approval_workbench.exported',
          occurredAt: {
            gte: since,
          },
        },
        select: {
          userId: true,
          payloadJson: true,
          occurredAt: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 500,
      }),
      this.loadArchiveStorageStats(tenantId),
      this.loadOperationAlertLifecycleEvents(tenantId),
      this.loadNotificationTaskRecoveryLifecycleEvents(tenantId),
      this.loadExternalWebhookUrl(tenantId),
      this.loadNotificationTaskPolicySnapshot(tenantId),
      this.prisma.toolApprovalRequest.findFirst({
        where: {
          tenantId,
          status: 'PENDING',
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.toolApprovalRequest.findFirst({
        where: {
          tenantId,
          status: 'PENDING',
          triggerSource: 'RUNTIME',
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.systemSettingSnapshot.findFirst({
        where: {
          tenantId,
          settingKey: {
            in: [...NOTIFICATION_POLICY_SETTING_KEYS],
          },
          approvalStatus: 'PENDING',
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.systemSettingSnapshot.findFirst({
        where: {
          tenantId,
          settingKey: {
            in: [...NOTIFICATION_POLICY_SETTING_KEYS],
          },
          approvalStatus: 'PENDING',
          impactLevel: 'HIGH',
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);
    const archiveDeleteStats = summarizeArchiveDeleteEvents(archiveDeleteEvents);
    const operationAlertNotificationArchiveDeleteStats = summarizeOperationAlertNotificationArchiveDeleteEvents(
      operationAlertNotificationArchiveDeleteEvents,
    );
    const agentTeamReportArchiveDeleteStats = summarizeArchiveDeleteEvents(agentTeamReportArchiveDeleteEvents);
    const customerSuccessCloseWonReportArchiveDeleteStats = summarizeArchiveDeleteEvents(
      customerSuccessCloseWonReportArchiveDeleteEvents,
    );
    const slaDeadLetterArchiveDeleteStats = summarizeSlaDeadLetterArchiveDeleteEvents(slaDeadLetterArchiveDeleteEvents);
    const notificationTaskRecoveryAuditArchiveDeleteStats = summarizeNotificationTaskRecoveryAuditArchiveDeleteEvents(
      notificationTaskRecoveryAuditArchiveDeleteEvents,
    );
    const notificationTaskStats = summarizeNotificationTaskEvents(notificationTaskEvents);
    const notificationDeliveryStats = summarizeNotificationDeliveryEvents(notificationDeliveryEvents);
    const approvalWorkbenchExportStats = summarizeApprovalWorkbenchExportEvents(approvalWorkbenchExportEvents);
    const notificationTaskRecoveryLifecycleMap = buildNotificationTaskRecoveryLifecycleMap(notificationTaskRecoveryEvents);
    const archiveDeletePendingOldest = oldestPendingArchiveDeleteAt(archiveDeleteEvents);
    const operationAlertNotificationArchiveDeletePendingOldest = oldestPendingOperationAlertNotificationArchiveDeleteAt(
      operationAlertNotificationArchiveDeleteEvents,
    );
    const agentTeamReportArchiveDeletePendingOldest = oldestPendingArchiveDeleteAt(agentTeamReportArchiveDeleteEvents);
    const customerSuccessCloseWonReportArchiveDeletePendingOldest = oldestPendingArchiveDeleteAt(
      customerSuccessCloseWonReportArchiveDeleteEvents,
    );
    const slaDeadLetterArchiveDeletePendingOldest = oldestPendingSlaDeadLetterArchiveDeleteAt(slaDeadLetterArchiveDeleteEvents);
    const notificationTaskRecoveryAuditArchiveDeletePendingOldest =
      oldestPendingNotificationTaskRecoveryAuditArchiveDeleteAt(notificationTaskRecoveryAuditArchiveDeleteEvents);
    const auditRiskOldest = oldestApprovalAuditRiskAt(approvalAuditEvents);
    const auditTraceGapOldest = oldestApprovalAuditTraceGapAt(approvalAuditEvents);
    const approvalAuditOldest = oldestApprovalAuditAt(approvalAuditEvents);

    const operations: ApprovalOperationStats = {
      tool_pending: toolPending,
      tool_approved: toolApproved,
      tool_rejected: toolRejected,
      runtime_pending: runtimePending,
      notification_pending: notificationPending,
      notification_high_impact_pending: notificationHighImpactPending,
      archive_delete_pending: archiveDeleteStats.pending,
      archive_delete_approved: archiveDeleteStats.approved,
      archive_delete_rejected: archiveDeleteStats.rejected,
      archive_delete_applied: archiveDeleteStats.applied,
      operation_alert_notification_archive_delete_pending:
        operationAlertNotificationArchiveDeleteStats.pending,
      operation_alert_notification_archive_delete_approved:
        operationAlertNotificationArchiveDeleteStats.approved,
      operation_alert_notification_archive_delete_rejected:
        operationAlertNotificationArchiveDeleteStats.rejected,
      operation_alert_notification_archive_delete_applied:
        operationAlertNotificationArchiveDeleteStats.applied,
      agent_team_report_archive_delete_pending: agentTeamReportArchiveDeleteStats.pending,
      agent_team_report_archive_delete_approved: agentTeamReportArchiveDeleteStats.approved,
      agent_team_report_archive_delete_rejected: agentTeamReportArchiveDeleteStats.rejected,
      agent_team_report_archive_delete_applied: agentTeamReportArchiveDeleteStats.applied,
      customer_success_close_won_report_archive_delete_pending:
        customerSuccessCloseWonReportArchiveDeleteStats.pending,
      customer_success_close_won_report_archive_delete_approved:
        customerSuccessCloseWonReportArchiveDeleteStats.approved,
      customer_success_close_won_report_archive_delete_rejected:
        customerSuccessCloseWonReportArchiveDeleteStats.rejected,
      customer_success_close_won_report_archive_delete_applied:
        customerSuccessCloseWonReportArchiveDeleteStats.applied,
      sla_dead_letter_archive_delete_pending: slaDeadLetterArchiveDeleteStats.pending,
      sla_dead_letter_archive_delete_approved: slaDeadLetterArchiveDeleteStats.approved,
      sla_dead_letter_archive_delete_rejected: slaDeadLetterArchiveDeleteStats.rejected,
      sla_dead_letter_archive_delete_applied: slaDeadLetterArchiveDeleteStats.applied,
      notification_task_recovery_audit_archive_delete_pending:
        notificationTaskRecoveryAuditArchiveDeleteStats.pending,
      notification_task_recovery_audit_archive_delete_approved:
        notificationTaskRecoveryAuditArchiveDeleteStats.approved,
      notification_task_recovery_audit_archive_delete_rejected:
        notificationTaskRecoveryAuditArchiveDeleteStats.rejected,
      notification_task_recovery_audit_archive_delete_applied:
        notificationTaskRecoveryAuditArchiveDeleteStats.applied,
      notification_task_runs_24h: notificationTaskStats.total,
      notification_task_failed_24h: notificationTaskStats.failed,
      notification_task_skipped_24h: notificationTaskStats.skipped,
      notification_task_failure_rate_24h: notificationTaskStats.failureRate,
      notification_task_consecutive_failures: notificationTaskStats.consecutiveFailures,
      notification_task_sla_dead_letter_failed_24h: notificationTaskStats.slaDeadLetterFailed,
      notification_task_agent_team_report_archive_delete_failed_24h:
        notificationTaskStats.agentTeamReportArchiveDeleteFailed,
      notification_task_recovery_archive_delete_failed_24h: notificationTaskStats.recoveryArchiveDeleteFailed,
      notification_task_recovery_suggestions: buildNotificationTaskRecoverySuggestions({
        deliveryStats: notificationDeliveryStats,
        lifecycleMap: notificationTaskRecoveryLifecycleMap,
        policy: notificationTaskPolicy,
        stats: notificationTaskStats,
        webhookConfigured: Boolean(externalWebhookUrl),
      }),
      approval_workbench_exports_24h: approvalWorkbenchExportStats.total,
      approval_workbench_exported_records_24h: approvalWorkbenchExportStats.exportedRecords,
      approval_workbench_high_risk_exports_24h: approvalWorkbenchExportStats.highRiskExports,
      approval_workbench_repeated_exports_24h: approvalWorkbenchExportStats.repeatedExports,
      audit_events_24h: approvalAuditEvents.length,
      audit_failed_24h: approvalAuditEvents.filter((event) => event.eventStatus === 'FAILED').length,
      audit_warning_24h: approvalAuditEvents.filter((event) => event.eventStatus === 'WARNING').length,
      audit_trace_count_24h: approvalAuditEvents.filter((event) => event.traceId).length,
      archive_count: archiveStorageStats.count,
      archive_total_size_bytes: archiveStorageStats.size,
      archive_storage_status: archiveStorageStats.status,
      tool_pending_oldest_at: toolPendingOldest?.createdAt ?? null,
      runtime_pending_oldest_at: runtimePendingOldest?.createdAt ?? null,
      notification_pending_oldest_at: notificationPendingOldest?.createdAt ?? null,
      notification_high_impact_pending_oldest_at: notificationHighImpactPendingOldest?.createdAt ?? null,
      archive_delete_pending_oldest_at: archiveDeletePendingOldest,
      operation_alert_notification_archive_delete_pending_oldest_at:
        operationAlertNotificationArchiveDeletePendingOldest,
      agent_team_report_archive_delete_pending_oldest_at: agentTeamReportArchiveDeletePendingOldest,
      customer_success_close_won_report_archive_delete_pending_oldest_at:
        customerSuccessCloseWonReportArchiveDeletePendingOldest,
      sla_dead_letter_archive_delete_pending_oldest_at: slaDeadLetterArchiveDeletePendingOldest,
      notification_task_recovery_audit_archive_delete_pending_oldest_at:
        notificationTaskRecoveryAuditArchiveDeletePendingOldest,
      notification_task_failure_oldest_at: notificationTaskStats.oldestFailureAt,
      approval_workbench_export_risk_oldest_at: approvalWorkbenchExportStats.oldestRiskAt,
      audit_risk_oldest_at: auditRiskOldest,
      audit_trace_gap_oldest_at: auditTraceGapOldest,
      approval_audit_oldest_at: approvalAuditOldest,
      archive_storage_checked_at: new Date(),
    };

    return {
      ...operations,
      operational_alerts: buildApprovalOperationAlerts(operations, lifecycleEvents),
    };
  }

  private async loadOperationAlertLifecycleEvents(tenantId: string) {
    return this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        resourceType: 'security_operation_alert',
        eventType: {
          in: [
            'platform.security.approval_operation_alert.acknowledged',
            'platform.security.approval_operation_alert.escalated',
            'platform.security.approval_operation_alert.closed',
          ],
        },
      },
      orderBy: {
        occurredAt: 'asc',
      },
      take: 1000,
    });
  }

  private async loadNotificationTaskRecoveryLifecycleEvents(tenantId: string) {
    return this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        resourceType: 'security_operation_alert_notification_task_recovery_suggestion',
        eventType: {
          in: [
            'platform.security.approval_operation_alert_notification_task.recovery_suggestion.acknowledged',
            'platform.security.approval_operation_alert_notification_task.recovery_suggestion.ignored',
            'platform.security.approval_operation_alert_notification_task.recovery_suggestion.resolved',
          ],
        },
      },
      orderBy: {
        occurredAt: 'asc',
      },
      take: 1000,
    });
  }

  private async loadArchiveStorageStats(tenantId: string) {
    try {
      const items = await this.storageService.listTenantObjects({
        tenantId,
        prefix: 'audit-archives/approval-audits',
        limit: 1000,
      });

      return {
        count: items.length,
        size: items.reduce((sum, item) => sum + item.size_bytes, 0),
        status: 'CONNECTED' as const,
      };
    } catch {
      return {
        count: 0,
        size: 0,
        status: 'UNKNOWN' as const,
      };
    }
  }

  private async loadMonitorStats(tenantId: string, since: Date) {
    const [operationLogs, modelCallLogs, toolCallLogs, recallLogs, conversationRuns, activeConversations] =
      await this.prisma.$transaction([
        this.prisma.operationLog.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            statusCode: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.modelCallLog.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            status: true,
            latencyMs: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.toolCallLog.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            status: true,
            latencyMs: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.knowledgeRecallLog.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            status: true,
            latencyMs: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.conversationRun.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: since,
            },
          },
          select: {
            status: true,
            latencyMs: true,
            createdAt: true,
          },
          take: 300,
        }),
        this.prisma.conversation.count({
          where: {
            tenantId,
            status: 'ACTIVE',
            deletedAt: null,
          },
        }),
      ]);

    const events = [
      ...operationLogs.map((item) => ({
        success: item.statusCode < 400,
        latency: null,
      })),
      ...modelCallLogs.map((item) => ({
        success: item.status === 'SUCCESS',
        latency: item.latencyMs,
      })),
      ...toolCallLogs.map((item) => ({
        success: item.status === 'SUCCESS',
        latency: item.latencyMs,
      })),
      ...recallLogs.map((item) => ({
        success: item.status === 'SUCCESS',
        latency: item.latencyMs,
      })),
      ...conversationRuns.map((item) => ({
        success: item.status === 'SUCCESS',
        latency: item.latencyMs,
      })),
    ];
    const latencies = events.map((item) => item.latency).filter(isNumber);

    return {
      eventsTotal: events.length,
      successRate: ratioPercent(events.filter((item) => item.success).length, events.length),
      failedEvents: events.filter((item) => !item.success).length,
      averageLatencyMs: average(latencies),
      p95LatencyMs: percentile(latencies, 0.95) ?? 0,
      activeConversations,
    };
  }

  private async loadRecentEvaluations(tenantId: string): Promise<SecurityPolicyEvaluationItem[]> {
    const items = await this.prisma.securityPolicyEvaluation.findMany({
      where: {
        tenantId,
      },
      include: {
        matchedPolicy: true,
        operator: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    });

    return items.map(mapEvaluation);
  }

  private async loadRuntimeSecurityStats(tenantId: string, since: Date) {
    const [securityPolicyDenials, listDataScopeFilters, resourceAclConditionChecks] = await this.prisma.$transaction([
      this.prisma.securityPolicyEvaluation.count({
        where: {
          tenantId,
          decision: 'DENY',
          createdAt: {
            gte: since,
          },
        },
      }),
      this.prisma.roleDataScope.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
          resourceType: {
            in: ['AGENT', 'KNOWLEDGE_BASE', 'TOOL', 'MODEL', 'CONVERSATION'],
          },
        },
      }),
      this.prisma.resourceAcl.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
          conditions: {
            not: Prisma.JsonNull,
          },
        },
      }),
    ]);

    return {
      securityPolicyDenials,
      listDataScopeFilters,
      resourceAclConditionChecks,
    };
  }

  private async loadRecentDenials(tenantId: string, since: Date): Promise<SecurityCenterDenialItem[]> {
    return (await this.loadSecurityEvents(tenantId, since)).slice(0, 8).map(stripSecurityCenterDenial);
  }

  private async loadSecurityEvents(tenantId: string, since: Date): Promise<SecurityCenterEventDetail[]> {
    const dedicatedEvents = await this.prisma.securityEvent.findMany({
      where: {
        tenantId,
        occurredAt: {
          gte: since,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 900,
    });

    if (dedicatedEvents.length > 0) {
      return dedicatedEvents.map(mapDedicatedSecurityEvent);
    }

    const [operationLogs, policyEvaluations, platformEvents] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where: {
          tenantId,
          module: 'security',
          action: 'deny',
          statusCode: {
            gte: 400,
          },
          createdAt: {
            gte: since,
          },
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 300,
      }),
      this.prisma.securityPolicyEvaluation.findMany({
        where: {
          tenantId,
          decision: 'DENY',
          createdAt: {
            gte: since,
          },
        },
        include: {
          matchedPolicy: true,
          operator: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 300,
      }),
      this.prisma.platformEvent.findMany({
        where: {
          tenantId,
          eventSource: 'security_center',
          eventType: {
            in: ['platform.security.approval_workbench.exported'],
          },
          occurredAt: {
            gte: since,
          },
        },
        include: {
          user: true,
        },
        orderBy: {
          occurredAt: 'desc',
        },
        take: 300,
      }),
    ]);

    const operationDenials = operationLogs.map(mapOperationDenial);
    const policyDenials = policyEvaluations.map(mapPolicyDenial);
    const platformSecurityEvents = platformEvents.map(mapPlatformSecurityEvent);

    return [...operationDenials, ...policyDenials, ...platformSecurityEvents]
      .sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at))
      .slice(0, 900);
  }

  private async findSecurityEvent(tenantId: string, eventId: string): Promise<SecurityCenterEventDetail | null> {
    const dedicatedEvent = await this.prisma.securityEvent.findFirst({
      where: {
        tenantId,
        id: eventId,
      },
      include: {
        user: true,
      },
    });

    if (dedicatedEvent) {
      return mapDedicatedSecurityEvent(dedicatedEvent);
    }

    const [sourceType, recordId] = eventId.split(':', 2);

    if (!sourceType || !recordId) {
      return null;
    }

    if (sourceType === 'operation') {
      const operation = await this.prisma.operationLog.findFirst({
        where: {
          tenantId,
          id: recordId,
          module: 'security',
          action: 'deny',
          statusCode: {
            gte: 400,
          },
        },
        include: {
          user: true,
        },
      });

      return operation ? mapOperationDenial(operation) : null;
    }

    if (sourceType === 'policy') {
      const evaluation = await this.prisma.securityPolicyEvaluation.findFirst({
        where: {
          tenantId,
          id: recordId,
          decision: 'DENY',
        },
        include: {
          matchedPolicy: true,
          operator: true,
        },
      });

      return evaluation ? mapPolicyDenial(evaluation) : null;
    }

    if (sourceType === 'platform') {
      const event = await this.prisma.platformEvent.findFirst({
        where: {
          tenantId,
          id: recordId,
          eventSource: 'security_center',
          eventType: 'platform.security.approval_workbench.exported',
        },
        include: {
          user: true,
        },
      });

      return event ? mapPlatformSecurityEvent(event) : null;
    }

    return null;
  }

  private async loadRecentAuditFailures(tenantId: string, since: Date): Promise<AuditFailureItem[]> {
    const [loginLogs, operationLogs] = await this.prisma.$transaction([
      this.prisma.loginLog.findMany({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.operationLog.findMany({
        where: {
          tenantId,
          statusCode: {
            gte: 400,
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
    ]);

    return [
      ...loginLogs.map((log) => ({
        event_id: `login:${log.id}`,
        source_type: 'login' as const,
        title: log.status === 'SUCCESS' ? '登录成功' : '登录失败',
        error_message: log.errorMessage ?? `来自 ${log.ip ?? '未知 IP'} 的登录尝试`,
        occurred_at: log.createdAt.toISOString(),
      })),
      ...operationLogs.map((log) => ({
        event_id: `operation:${log.id}`,
        source_type: 'operation' as const,
        title: `${log.module} ${log.action}`,
        error_message: log.errorMessage ?? `${log.method} ${log.path}`,
        occurred_at: log.createdAt.toISOString(),
      })),
    ]
      .sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at))
      .slice(0, 6);
  }

  private async loadRecentMonitorErrors(tenantId: string, since: Date): Promise<MonitorErrorSampleItem[]> {
    const [operationLogs, modelCallLogs, toolCallLogs, recallLogs, conversationRuns] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where: {
          tenantId,
          statusCode: {
            gte: 400,
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.modelCallLog.findMany({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.toolCallLog.findMany({
        where: {
          tenantId,
          status: {
            notIn: ['SUCCESS', 'APPROVAL_REQUIRED'],
          },
          createdAt: {
            gte: since,
          },
        },
        include: {
          tool: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.knowledgeRecallLog.findMany({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
      this.prisma.conversationRun.findMany({
        where: {
          tenantId,
          status: {
            not: 'SUCCESS',
          },
          createdAt: {
            gte: since,
          },
        },
        include: {
          agent: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
      }),
    ]);

    return [
      ...operationLogs.map((item) => ({
        event_id: `operation:${item.id}`,
        trace_id: item.requestId,
        module: normalizeMonitorModule(item.module),
        title: `${item.module} ${item.action}`,
        error_message: item.errorMessage ?? `${item.method} ${item.path}`,
        occurred_at: item.createdAt.toISOString(),
      })),
      ...modelCallLogs.map((item) => ({
        event_id: `model:${item.id}`,
        trace_id: item.traceId,
        module: 'model' as const,
        title: item.requestModel,
        error_message: item.errorMessage ?? '模型调用失败',
        occurred_at: item.createdAt.toISOString(),
      })),
      ...toolCallLogs.map((item) => ({
        event_id: `tool:${item.id}`,
        trace_id: item.id,
        module: 'tool' as const,
        title: item.tool?.name ?? item.requestUrl,
        error_message: item.errorMessage ?? '工具调用失败',
        occurred_at: item.createdAt.toISOString(),
      })),
      ...recallLogs.map((item) => ({
        event_id: `knowledge:${item.id}`,
        trace_id: item.id,
        module: 'knowledge' as const,
        title: item.query.slice(0, 60),
        error_message: item.errorMessage ?? '知识库检索失败',
        occurred_at: item.createdAt.toISOString(),
      })),
      ...conversationRuns.map((item) => ({
        event_id: `conversation:${item.id}`,
        trace_id: item.id,
        module: 'conversation' as const,
        title: item.agent?.name ?? item.requestModel ?? '会话运行',
        error_message: item.errorMessage ?? '会话运行失败',
        occurred_at: item.createdAt.toISOString(),
      })),
    ]
      .sort((left, right) => Date.parse(right.occurred_at) - Date.parse(left.occurred_at))
      .slice(0, 6);
  }
}

function buildPosture(metrics: SecurityCenterOverview['metrics']): SecurityCenterOverview['posture'] {
  let score = 100;
  score -= Math.min(metrics.pending_approvals * 8, 24);
  score -= Math.min(metrics.security_events_24h * 5, 25);
  score -= Math.min(metrics.security_policy_denials_24h * 4, 16);
  score -= Math.min(metrics.failed_monitor_events_24h * 4, 20);
  if (metrics.active_policies === 0) score -= 12;
  if (metrics.configured_data_scope_roles === 0) score -= 10;
  if (metrics.list_data_scope_filters === 0) score -= 8;
  if (metrics.resource_acl_deny === 0) score -= 4;
  score = Math.max(0, Math.min(100, score));

  const level: SecurityCenterRiskLevel = score >= 85 ? 'LOW' : score >= 65 ? 'MEDIUM' : 'HIGH';
  const summary = level === 'LOW'
    ? '安全治理运行平稳，关键访问控制链路已覆盖。'
    : level === 'MEDIUM'
      ? '存在需要关注的审批、审计或运行异常，建议检查风险信号。'
      : '安全风险偏高，请优先处理待审批和异常事件。';

  return {
    score,
    level,
    summary,
    guard_chain: ['JWT 鉴权', 'RBAC 权限', 'DataScope 数据范围', 'Resource ACL 资源授权', 'Security Policy 安全策略', '业务执行'],
  };
}

function buildModules(input: {
  policyStats: Awaited<ReturnType<SecurityCenterService['loadPolicyStats']>>;
  dataScopeStats: Awaited<ReturnType<SecurityCenterService['loadDataScopeStats']>>;
  resourceAclStats: Awaited<ReturnType<SecurityCenterService['loadResourceAclStats']>>;
  approvalStats: Awaited<ReturnType<SecurityCenterService['loadApprovalStats']>>;
  auditStats: Awaited<ReturnType<SecurityCenterService['loadAuditStats']>>;
  monitorStats: Awaited<ReturnType<SecurityCenterService['loadMonitorStats']>>;
}): SecurityCenterModuleSummary[] {
  return [
    moduleSummary({
      key: 'security_policies',
      title: '安全策略',
      description: '租户级 ABAC 策略、显式拒绝和模拟评估。',
      href: '/security',
      permission: PERMISSION_CODES.securityRuleView,
      status: input.policyStats.active > 0 ? 'healthy' : 'degraded',
      primary: metric('生效策略', input.policyStats.active, `${input.policyStats.total} 条策略`),
      secondary: metric('拒绝策略', input.policyStats.deny, `${input.policyStats.evaluations} 条评估`),
      action: '治理策略',
    }),
    moduleSummary({
      key: 'data_scopes',
      title: '数据权限',
      description: '按角色配置资源数据范围，约束能看哪些数据。',
      href: '/data-scopes',
      permission: PERMISSION_CODES.systemDataScopeView,
      status: input.dataScopeStats.configuredRoleCount > 0 ? 'healthy' : 'degraded',
      primary: metric('已配置角色', input.dataScopeStats.configuredRoleCount, `${input.dataScopeStats.roleCount} 个角色`),
      secondary: metric('列表过滤', input.dataScopeStats.total, `${input.dataScopeStats.custom} 条自定义范围`),
      action: '配置范围',
    }),
    moduleSummary({
      key: 'resource_acls',
      title: '资源授权',
      description: '按具体 Agent、知识库、工具、模型做对象级授权。',
      href: '/resource-acls',
      permission: PERMISSION_CODES.systemResourceAclView,
      status: input.resourceAclStats.active > 0 ? 'healthy' : 'planned',
      primary: metric('启用授权', input.resourceAclStats.active, `${input.resourceAclStats.total} 条规则`),
      secondary: metric('拒绝/条件', input.resourceAclStats.deny, `${input.resourceAclStats.allow} 条允许`),
      action: '管理授权',
    }),
    moduleSummary({
      key: 'approvals',
      title: '高危审批',
      description: '处理高风险工具调用、运行时请求和通知策略变更审批。',
      href: '/approvals',
      permission: PERMISSION_CODES.securityApprovalView,
      status: input.approvalStats.pending > 0 ? 'degraded' : 'healthy',
      primary: metric(
        '待审批',
        input.approvalStats.pending,
        `${input.approvalStats.runtimePending} 个运行时 / ${input.approvalStats.notificationPending} 个策略`,
      ),
      secondary: metric(
        '已拒绝',
        input.approvalStats.rejected,
        `${input.approvalStats.approved} 个已通过 / ${input.approvalStats.notificationHighImpactPending} 个高影响`,
      ),
      action: '处理审批',
    }),
    moduleSummary({
      key: 'audit',
      title: '审计日志',
      description: '查看登录、操作、安全事件和配置变更记录。',
      href: '/audit',
      permission: PERMISSION_CODES.securityAuditView,
      status: input.auditStats.securityEvents > 0 ? 'degraded' : 'healthy',
      primary: metric('安全事件', input.auditStats.securityEvents, '最近 24 小时'),
      secondary: metric('成功率', `${input.auditStats.successRate}%`, `${input.auditStats.configChanges} 次配置变更`),
      action: '查看审计',
    }),
    moduleSummary({
      key: 'monitor',
      title: '运行监控',
      description: '聚合模型、工具、知识库、会话运行和链路异常。',
      href: '/monitor',
      permission: PERMISSION_CODES.monitorLogView,
      status: input.monitorStats.failedEvents > 0 ? 'degraded' : 'healthy',
      primary: metric('成功率', `${input.monitorStats.successRate}%`, `${input.monitorStats.eventsTotal} 个事件`),
      secondary: metric('P95 延迟', `${input.monitorStats.p95LatencyMs} ms`, `${input.monitorStats.failedEvents} 个异常`),
      action: '查看监控',
    }),
  ];
}

function summarizeArchiveDeleteEvents(
  events: Array<{ sourceId: string; eventType: string; occurredAt: Date }>,
) {
  const groups = new Map<string, Array<{ eventType: string; occurredAt: Date }>>();
  for (const event of events) {
    groups.set(event.sourceId, [...(groups.get(event.sourceId) ?? []), event]);
  }

  const summary = {
    pending: 0,
    approved: 0,
    rejected: 0,
    applied: 0,
  };

  for (const groupEvents of groups.values()) {
    const latest = [...groupEvents].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())[0];
    if (!latest) continue;
    if (latest.eventType === 'DELETE_APPLIED') {
      summary.applied += 1;
    } else if (latest.eventType === 'REJECTED') {
      summary.rejected += 1;
    } else if (latest.eventType === 'APPROVED') {
      summary.approved += 1;
    } else {
      summary.pending += 1;
    }
  }

  return summary;
}

function summarizeSlaDeadLetterArchiveDeleteEvents(
  events: Array<{ sourceId: string | null; eventType: string; occurredAt: Date }>,
) {
  return summarizeArchiveDeleteEvents(normalizeSlaDeadLetterArchiveDeleteEvents(events));
}

function summarizeOperationAlertNotificationArchiveDeleteEvents(
  events: Array<{ sourceId: string | null; eventType: string; occurredAt: Date }>,
) {
  return summarizeArchiveDeleteEvents(normalizeOperationAlertNotificationArchiveDeleteEvents(events));
}

function summarizeNotificationTaskRecoveryAuditArchiveDeleteEvents(
  events: Array<{ sourceId: string | null; eventType: string; occurredAt: Date }>,
) {
  return summarizeArchiveDeleteEvents(normalizeNotificationTaskRecoveryAuditArchiveDeleteEvents(events));
}

function oldestPendingArchiveDeleteAt(events: Array<{ sourceId: string; eventType: string; occurredAt: Date }>) {
  const groups = new Map<string, Array<{ eventType: string; occurredAt: Date }>>();
  for (const event of events) {
    groups.set(event.sourceId, [...(groups.get(event.sourceId) ?? []), event]);
  }

  const pendingDates: Date[] = [];
  for (const groupEvents of groups.values()) {
    const sorted = [...groupEvents].sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());
    const latest = sorted.at(-1);
    if (!latest || latest.eventType !== 'DELETE_REQUESTED') continue;
    pendingDates.push(sorted[0]?.occurredAt ?? latest.occurredAt);
  }

  return oldestDateOrNull(pendingDates);
}

function oldestPendingSlaDeadLetterArchiveDeleteAt(
  events: Array<{ sourceId: string | null; eventType: string; occurredAt: Date }>,
) {
  return oldestPendingArchiveDeleteAt(normalizeSlaDeadLetterArchiveDeleteEvents(events));
}

function oldestPendingOperationAlertNotificationArchiveDeleteAt(
  events: Array<{ sourceId: string | null; eventType: string; occurredAt: Date }>,
) {
  return oldestPendingArchiveDeleteAt(normalizeOperationAlertNotificationArchiveDeleteEvents(events));
}

function oldestPendingNotificationTaskRecoveryAuditArchiveDeleteAt(
  events: Array<{ sourceId: string | null; eventType: string; occurredAt: Date }>,
) {
  return oldestPendingArchiveDeleteAt(normalizeNotificationTaskRecoveryAuditArchiveDeleteEvents(events));
}

function normalizeSlaDeadLetterArchiveDeleteEvents(
  events: Array<{ sourceId: string | null; eventType: string; occurredAt: Date }>,
) {
  return events
    .map((event) => ({
      sourceId: event.sourceId ?? '',
      eventType: slaDeadLetterArchiveDeleteEventType(event.eventType),
      occurredAt: event.occurredAt,
    }))
    .filter((event) => event.sourceId && event.eventType);
}

function slaDeadLetterArchiveDeleteEventType(eventType: string) {
  if (eventType.endsWith('.delete_requested')) return 'DELETE_REQUESTED';
  if (eventType.endsWith('.delete_approved')) return 'APPROVED';
  if (eventType.endsWith('.delete_rejected')) return 'REJECTED';
  if (eventType.endsWith('.delete_applied')) return 'DELETE_APPLIED';
  return '';
}

function normalizeOperationAlertNotificationArchiveDeleteEvents(
  events: Array<{ sourceId: string | null; eventType: string; occurredAt: Date }>,
) {
  return events
    .map((event) => ({
      sourceId: event.sourceId ?? '',
      eventType: operationAlertNotificationArchiveDeleteEventType(event.eventType),
      occurredAt: event.occurredAt,
    }))
    .filter((event) => event.sourceId && event.eventType);
}

function operationAlertNotificationArchiveDeleteEventType(eventType: string) {
  if (eventType.endsWith('.delete_requested')) return 'DELETE_REQUESTED';
  if (eventType.endsWith('.delete_approved')) return 'APPROVED';
  if (eventType.endsWith('.delete_rejected')) return 'REJECTED';
  if (eventType.endsWith('.delete_applied')) return 'DELETE_APPLIED';
  return '';
}

function normalizeNotificationTaskRecoveryAuditArchiveDeleteEvents(
  events: Array<{ sourceId: string | null; eventType: string; occurredAt: Date }>,
) {
  return events
    .map((event) => ({
      sourceId: event.sourceId ?? '',
      eventType: notificationTaskRecoveryAuditArchiveDeleteEventType(event.eventType),
      occurredAt: event.occurredAt,
    }))
    .filter((event) => event.sourceId && event.eventType);
}

function notificationTaskRecoveryAuditArchiveDeleteEventType(eventType: string) {
  if (eventType.endsWith('.delete_requested')) return 'DELETE_REQUESTED';
  if (eventType.endsWith('.delete_approved')) return 'APPROVED';
  if (eventType.endsWith('.delete_rejected')) return 'REJECTED';
  if (eventType.endsWith('.delete_applied')) return 'DELETE_APPLIED';
  return '';
}

function summarizeNotificationTaskEvents(
  events: Array<{ eventType: string; payloadJson: Prisma.JsonValue; occurredAt: Date; requestId: string | null }>,
) {
  const items = events
    .filter((event) => !isManualNotificationTaskFinishedDuplicate(event))
    .map((event) => {
      const payload = normalizeJsonObjectOutput(event.payloadJson);
      const status = notificationTaskStatus(payload?.status);

      return {
        status,
        occurredAt: event.occurredAt,
        slaDeadLetterNotifyCount: numericPayloadField(payload?.sla_dead_letter_notify_count),
        agentTeamReportArchiveDeleteNotifyCount: numericPayloadField(
          payload?.agent_team_report_archive_delete_notify_count,
        ),
        recoveryArchiveDeleteNotifyCount: numericPayloadField(payload?.recovery_archive_delete_notify_count),
      };
    });
  const total = items.length;
  const failedItems = items.filter((item) => item.status === 'FAILED');
  const skippedItems = items.filter((item) => item.status === 'SKIPPED');
  const riskyCount = failedItems.length + skippedItems.length;

  return {
    total,
    failed: failedItems.length,
    skipped: skippedItems.length,
    slaDeadLetterFailed: [...failedItems, ...skippedItems].reduce(
      (sum, item) => sum + item.slaDeadLetterNotifyCount,
      0,
    ),
    agentTeamReportArchiveDeleteFailed: [...failedItems, ...skippedItems].reduce(
      (sum, item) => sum + item.agentTeamReportArchiveDeleteNotifyCount,
      0,
    ),
    recoveryArchiveDeleteFailed: [...failedItems, ...skippedItems].reduce(
      (sum, item) => sum + item.recoveryArchiveDeleteNotifyCount,
      0,
    ),
    failureRate: total > 0 ? Math.round((riskyCount / total) * 100) : 0,
    consecutiveFailures: countNotificationTaskConsecutiveFailures(items),
    oldestFailureAt: oldestDateOrNull([...failedItems, ...skippedItems].map((item) => item.occurredAt)),
  };
}

function summarizeNotificationDeliveryEvents(events: Array<{ payloadJson: Prisma.JsonValue; occurredAt: Date }>): NotificationDeliveryStats {
  const items = events.map((event) => {
    const payload = normalizeJsonObjectOutput(event.payloadJson);
    const status = normalizeSecurityOperationNotificationStatus(payload?.status);
    const webhookStatus = typeof payload?.webhook_status === 'number' ? payload.webhook_status : null;
    const webhookError = typeof payload?.webhook_error === 'string' && payload.webhook_error.trim() ? payload.webhook_error : null;
    const webhookFailed = Boolean(webhookError) || (typeof webhookStatus === 'number' && webhookStatus >= 400);

    return {
      status,
      webhookFailed,
      webhookError,
      occurredAt: event.occurredAt,
    };
  });
  const sortedWebhookFailures = items
    .filter((item) => item.webhookFailed)
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());

  return {
    total: items.length,
    failed: items.filter((item) => item.status === 'FAILED').length,
    partial: items.filter((item) => item.status === 'PARTIAL').length,
    skipped: items.filter((item) => item.status === 'SKIPPED').length,
    webhookFailed: sortedWebhookFailures.length,
    latestWebhookError: sortedWebhookFailures[0]?.webhookError ?? null,
  };
}

function summarizeApprovalWorkbenchExportEvents(
  events: Array<{ userId: string | null; payloadJson: Prisma.JsonValue; occurredAt: Date }>,
): ApprovalWorkbenchExportStats {
  const userExportCounts = new Map<string, number>();
  const items = events.map((event) => {
    const payload = normalizeJsonObjectOutput(event.payloadJson);
    const filter = normalizeJsonObjectOutput(payload?.filter);
    const exportedRecords = numericPayloadField(payload?.exported_count);
    const userKey = event.userId ?? 'SYSTEM';
    userExportCounts.set(userKey, (userExportCounts.get(userKey) ?? 0) + 1);

    return {
      exportedRecords,
      highRisk: approvalWorkbenchExportHasHighRiskFilter(filter),
      occurredAt: event.occurredAt,
    };
  });
  const highRiskItems = items.filter((item) => item.highRisk);
  const repeatedExports = Array.from(userExportCounts.values()).reduce((sum, count) => sum + Math.max(0, count - 2), 0);
  const volumeRiskItems = items.filter((item) => item.exportedRecords >= 1000);

  return {
    total: items.length,
    exportedRecords: items.reduce((sum, item) => sum + item.exportedRecords, 0),
    highRiskExports: highRiskItems.length,
    repeatedExports,
    oldestRiskAt: oldestDateOrNull([...highRiskItems, ...volumeRiskItems].map((item) => item.occurredAt)),
  };
}

function approvalWorkbenchExportHasHighRiskFilter(filter: Record<string, unknown> | null) {
  return (
    filter?.status === 'PENDING' ||
    filter?.risk_domain === 'AUDIT_ARCHIVE' ||
    filter?.type === 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE' ||
    filter?.type === 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE' ||
    filter?.type === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE'
  );
}

function buildNotificationTaskRecoverySuggestions(input: {
  stats: NotificationTaskStats;
  deliveryStats: NotificationDeliveryStats;
  policy: NotificationTaskPolicySnapshot;
  webhookConfigured: boolean;
  lifecycleMap: Map<string, NotificationTaskRecoveryLifecycle>;
}): SecurityOperationAlertNotificationTaskRecoverySuggestion[] {
  const suggestions: SecurityOperationAlertNotificationTaskRecoverySuggestion[] = [];
  const hasTaskRisk = input.stats.failed > 0 || input.stats.skipped > 0 || input.stats.failureRate >= 30;
  const hasDeliveryRisk = input.deliveryStats.failed > 0 || input.deliveryStats.partial > 0 || input.deliveryStats.skipped > 0;
  const failureSourceEvidence = notificationTaskFailureSourceEvidence(input.stats);

  if (!input.webhookConfigured && (hasTaskRisk || hasDeliveryRisk || input.stats.total > 0)) {
    const failureSourceSummary = notificationTaskRecoveryFailureSourceSummary(input.stats);
    suggestions.push({
      id: 'notification-task-webhook-not-configured',
      title: '配置外部 Webhook 地址',
      description: '通知任务已经运行，但外部 Webhook 未配置，站内记录之外的告警无法触达外部系统。',
      severity: hasTaskRisk ? 'HIGH' : 'MEDIUM',
      reason_code: 'WEBHOOK_NOT_CONFIGURED',
      failure_source: failureSourceSummary.failureSource,
      sla_dead_letter_failed_count: failureSourceSummary.slaDeadLetterFailedCount,
      agent_team_report_archive_delete_failed_count:
        failureSourceSummary.agentTeamReportArchiveDeleteFailedCount,
      recovery_archive_delete_failed_count: failureSourceSummary.recoveryArchiveDeleteFailedCount,
      ...notificationTaskRecoveryLifecycleFields(input.lifecycleMap.get('notification-task-webhook-not-configured') ?? null),
      primary_action_label: '配置外部集成',
      primary_action_href: '/settings?category=INTEGRATION',
      secondary_action_label: '查看任务历史',
      secondary_action_href: '/security',
      evidence: `近 24 小时任务 ${input.stats.total} 次，失败 ${input.stats.failed} 次，跳过 ${input.stats.skipped} 次。${failureSourceEvidence}`,
    });
  }

  if (input.deliveryStats.webhookFailed > 0) {
    const failureSourceSummary = notificationTaskRecoveryFailureSourceSummary(input.stats);
    suggestions.push({
      id: 'notification-task-webhook-delivery-failed',
      title: '核对 Webhook 投递响应',
      description: '外部 Webhook 最近出现非 2xx 响应或网络异常，需要检查地址、鉴权、超时和接收端日志。',
      severity: input.deliveryStats.webhookFailed >= 3 ? 'HIGH' : 'MEDIUM',
      reason_code: 'WEBHOOK_DELIVERY_FAILED',
      failure_source: failureSourceSummary.failureSource,
      sla_dead_letter_failed_count: failureSourceSummary.slaDeadLetterFailedCount,
      agent_team_report_archive_delete_failed_count:
        failureSourceSummary.agentTeamReportArchiveDeleteFailedCount,
      recovery_archive_delete_failed_count: failureSourceSummary.recoveryArchiveDeleteFailedCount,
      ...notificationTaskRecoveryLifecycleFields(input.lifecycleMap.get('notification-task-webhook-delivery-failed') ?? null),
      primary_action_label: '查看投递审计',
      primary_action_href: '/security',
      secondary_action_label: '查看运行监控',
      secondary_action_href: '/monitor',
      evidence: input.deliveryStats.latestWebhookError
        ? `Webhook 异常 ${input.deliveryStats.webhookFailed} 次，最近错误：${input.deliveryStats.latestWebhookError}`
        : `Webhook 异常 ${input.deliveryStats.webhookFailed} 次。`,
    });
  }

  if (!input.policy.auto_notify_enabled) {
    const failureSourceSummary = notificationTaskRecoveryFailureSourceSummary(input.stats);
    suggestions.push({
      id: 'notification-task-auto-notify-disabled',
      title: '开启首发自动通知策略',
      description: '首发自动通知关闭后，新产生的运营告警不会自动首发投递。',
      severity: hasTaskRisk ? 'HIGH' : 'MEDIUM',
      reason_code: 'AUTO_NOTIFY_DISABLED',
      failure_source: failureSourceSummary.failureSource,
      sla_dead_letter_failed_count: failureSourceSummary.slaDeadLetterFailedCount,
      agent_team_report_archive_delete_failed_count:
        failureSourceSummary.agentTeamReportArchiveDeleteFailedCount,
      recovery_archive_delete_failed_count: failureSourceSummary.recoveryArchiveDeleteFailedCount,
      ...notificationTaskRecoveryLifecycleFields(input.lifecycleMap.get('notification-task-auto-notify-disabled') ?? null),
      primary_action_label: '打开通知策略',
      primary_action_href: '/settings?category=NOTIFICATION',
      secondary_action_label: '查看策略审批',
      secondary_action_href: '/approvals?queue=notification-policy&status=PENDING',
      evidence: '系统设置 alert_notification_auto_notify_enabled 当前为关闭。',
    });
  }

  if (!input.policy.auto_retry_enabled) {
    const failureSourceSummary = notificationTaskRecoveryFailureSourceSummary(input.stats);
    suggestions.push({
      id: 'notification-task-auto-retry-disabled',
      title: '开启失败自动重试策略',
      description: '自动重试关闭后，失败或部分成功的投递需要人工重试，容易形成告警触达缺口。',
      severity: input.deliveryStats.webhookFailed > 0 || input.stats.failed > 0 ? 'HIGH' : 'MEDIUM',
      reason_code: 'AUTO_RETRY_DISABLED',
      failure_source: failureSourceSummary.failureSource,
      sla_dead_letter_failed_count: failureSourceSummary.slaDeadLetterFailedCount,
      agent_team_report_archive_delete_failed_count:
        failureSourceSummary.agentTeamReportArchiveDeleteFailedCount,
      recovery_archive_delete_failed_count: failureSourceSummary.recoveryArchiveDeleteFailedCount,
      ...notificationTaskRecoveryLifecycleFields(input.lifecycleMap.get('notification-task-auto-retry-disabled') ?? null),
      primary_action_label: '打开通知策略',
      primary_action_href: '/settings?category=NOTIFICATION',
      secondary_action_label: '查看投递审计',
      secondary_action_href: '/security',
      evidence: '系统设置 alert_notification_auto_retry_enabled 当前为关闭。',
    });
  }

  if (input.stats.consecutiveFailures >= 2) {
    const failureSourceSummary = notificationTaskRecoveryFailureSourceSummary(input.stats);
    suggestions.push({
      id: 'notification-task-consecutive-failures',
      title: '排查连续失败任务链路',
      description: '通知任务连续失败或跳过，建议优先核对最近任务事件、Webhook 配置和调度状态。',
      severity: input.stats.consecutiveFailures >= 3 ? 'HIGH' : 'MEDIUM',
      reason_code: 'CONSECUTIVE_FAILURES',
      failure_source: failureSourceSummary.failureSource,
      sla_dead_letter_failed_count: failureSourceSummary.slaDeadLetterFailedCount,
      agent_team_report_archive_delete_failed_count:
        failureSourceSummary.agentTeamReportArchiveDeleteFailedCount,
      recovery_archive_delete_failed_count: failureSourceSummary.recoveryArchiveDeleteFailedCount,
      ...notificationTaskRecoveryLifecycleFields(input.lifecycleMap.get('notification-task-consecutive-failures') ?? null),
      primary_action_label: '查看任务历史',
      primary_action_href: '/security',
      secondary_action_label: '打开审计中心',
      secondary_action_href: '/audit',
      evidence: `当前连续失败或跳过 ${input.stats.consecutiveFailures} 次。${failureSourceEvidence}`,
    });
  }

  if (input.stats.total >= 3 && input.stats.failureRate >= 30) {
    const failureSourceSummary = notificationTaskRecoveryFailureSourceSummary(input.stats);
    suggestions.push({
      id: 'notification-task-high-failure-rate',
      title: '降低通知任务失败率',
      description: '最近 24 小时通知任务失败率偏高，需要结合任务历史和投递审计确认主要失败来源。',
      severity: input.stats.failureRate >= 50 || input.stats.failed >= 3 ? 'HIGH' : 'MEDIUM',
      reason_code: 'HIGH_FAILURE_RATE',
      failure_source: failureSourceSummary.failureSource,
      sla_dead_letter_failed_count: failureSourceSummary.slaDeadLetterFailedCount,
      agent_team_report_archive_delete_failed_count:
        failureSourceSummary.agentTeamReportArchiveDeleteFailedCount,
      recovery_archive_delete_failed_count: failureSourceSummary.recoveryArchiveDeleteFailedCount,
      ...notificationTaskRecoveryLifecycleFields(input.lifecycleMap.get('notification-task-high-failure-rate') ?? null),
      primary_action_label: '查看任务历史',
      primary_action_href: '/security',
      secondary_action_label: '查看运行监控',
      secondary_action_href: '/monitor',
      evidence: `近 24 小时 ${input.stats.total} 次任务，失败/跳过占比 ${input.stats.failureRate}%。${failureSourceEvidence}`,
    });
  }

  return suggestions.sort(compareRecoverySuggestionSeverity).slice(0, 6);
}

function notificationTaskFailureSourceEvidence(stats: NotificationTaskStats) {
  const parts = [
    stats.slaDeadLetterFailed > 0 ? `SLA 死信归档删除覆盖 ${stats.slaDeadLetterFailed} 条` : null,
    stats.agentTeamReportArchiveDeleteFailed > 0
      ? `团队报告归档删除覆盖 ${stats.agentTeamReportArchiveDeleteFailed} 条`
      : null,
    stats.recoveryArchiveDeleteFailed > 0 ? `自愈归档删除覆盖 ${stats.recoveryArchiveDeleteFailed} 条` : null,
  ].filter((item): item is string => Boolean(item));

  return parts.length > 0 ? ` 失败来源：${parts.join('，')}。` : '';
}

function notificationTaskRecoveryFailureSourceSummary(
  stats: NotificationTaskStats,
): NotificationTaskRecoveryFailureSourceSummary {
  return {
    failureSource: notificationTaskRecoveryFailureSource(stats),
    slaDeadLetterFailedCount: stats.slaDeadLetterFailed,
    agentTeamReportArchiveDeleteFailedCount: stats.agentTeamReportArchiveDeleteFailed,
    recoveryArchiveDeleteFailedCount: stats.recoveryArchiveDeleteFailed,
  };
}

function notificationTaskRecoveryFailureSource(
  stats: Pick<
    NotificationTaskStats,
    'slaDeadLetterFailed' | 'agentTeamReportArchiveDeleteFailed' | 'recoveryArchiveDeleteFailed'
  >,
): SecurityOperationAlertNotificationTaskRecoveryFailureSource {
  const sourceCount = [
    stats.slaDeadLetterFailed,
    stats.agentTeamReportArchiveDeleteFailed,
    stats.recoveryArchiveDeleteFailed,
  ].filter((count) => count > 0).length;
  if (sourceCount > 1) return 'MIXED';
  if (stats.slaDeadLetterFailed > 0) return 'SLA_DEAD_LETTER_ARCHIVE_DELETE';
  if (stats.agentTeamReportArchiveDeleteFailed > 0) return 'AGENT_TEAM_REPORT_ARCHIVE_DELETE';
  if (stats.recoveryArchiveDeleteFailed > 0) return 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE';
  return 'UNKNOWN';
}

function buildNotificationTaskRecoveryLifecycleMap(
  events: Array<{ resourceId: string | null; eventType: string; payloadJson: Prisma.JsonValue; occurredAt: Date }>,
) {
  const map = new Map<string, NotificationTaskRecoveryLifecycle>();

  for (const event of events) {
    if (!event.resourceId) continue;
    const action = notificationTaskRecoveryActionFromEventType(event.eventType);
    if (!action) continue;
    const payload = normalizeJsonObjectOutput(event.payloadJson);
    map.set(event.resourceId, {
      action,
      note: typeof payload?.note === 'string' ? payload.note : null,
      occurredAt: event.occurredAt,
    });
  }

  return map;
}

function notificationTaskRecoveryLifecycleFields(
  lifecycle: NotificationTaskRecoveryLifecycle | null,
): Pick<
  SecurityOperationAlertNotificationTaskRecoverySuggestion,
  'last_action' | 'last_note' | 'status' | 'updated_at'
> {
  if (!lifecycle) {
    return {
      status: 'OPEN',
      last_action: null,
      last_note: null,
      updated_at: null,
    };
  }

  return {
    status: notificationTaskRecoveryStatusFromAction(lifecycle.action),
    last_action: lifecycle.action,
    last_note: lifecycle.note,
    updated_at: lifecycle.occurredAt.toISOString(),
  };
}

function notificationTaskRecoveryActionFromEventType(
  eventType: string,
): SecurityOperationAlertNotificationTaskRecoveryAction | null {
  if (eventType === 'platform.security.approval_operation_alert_notification_task.recovery_suggestion.acknowledged') {
    return 'ACKNOWLEDGE';
  }
  if (eventType === 'platform.security.approval_operation_alert_notification_task.recovery_suggestion.ignored') {
    return 'IGNORE';
  }
  if (eventType === 'platform.security.approval_operation_alert_notification_task.recovery_suggestion.resolved') {
    return 'RESOLVE';
  }
  return null;
}

function notificationTaskRecoveryEventType(action: SecurityOperationAlertNotificationTaskRecoveryAction) {
  if (action === 'ACKNOWLEDGE') {
    return 'platform.security.approval_operation_alert_notification_task.recovery_suggestion.acknowledged';
  }
  if (action === 'IGNORE') {
    return 'platform.security.approval_operation_alert_notification_task.recovery_suggestion.ignored';
  }
  return 'platform.security.approval_operation_alert_notification_task.recovery_suggestion.resolved';
}

function notificationTaskRecoveryStatusFromAction(
  action: SecurityOperationAlertNotificationTaskRecoveryAction,
): SecurityOperationAlertNotificationTaskRecoveryStatus {
  if (action === 'ACKNOWLEDGE') return 'ACKNOWLEDGED';
  if (action === 'IGNORE') return 'IGNORED';
  return 'RESOLVED';
}

function notificationTaskRecoveryLifecycleMessage(
  action: SecurityOperationAlertNotificationTaskRecoveryAction,
  title: string,
) {
  if (action === 'ACKNOWLEDGE') return `已确认通知任务自愈建议：${title}`;
  if (action === 'IGNORE') return `已忽略通知任务自愈建议：${title}`;
  return `已标记通知任务自愈建议已处理：${title}`;
}

function mapNotificationTaskRecoveryAuditEvent(
  event: Prisma.PlatformEventGetPayload<object>,
): SecurityOperationAlertNotificationTaskRecoveryAuditItem {
  const payload = normalizeJsonObjectOutput(event.payloadJson);
  const action = normalizeNotificationTaskRecoveryAction(payload?.action, event.eventType);
  const status = normalizeNotificationTaskRecoveryStatus(payload?.status, action);

  return {
    event_id: event.id,
    suggestion_id: typeof payload?.suggestion_id === 'string' ? payload.suggestion_id : event.resourceId ?? '',
    title: typeof payload?.title === 'string' ? payload.title : event.summary ?? '通知任务自愈建议',
    severity: normalizeSecurityRiskLevel(payload?.severity),
    reason_code: normalizeNotificationTaskRecoveryReason(payload?.reason_code),
    failure_source: normalizeNotificationTaskRecoveryFailureSource(payload?.failure_source, payload),
    sla_dead_letter_failed_count: numericPayloadField(payload?.sla_dead_letter_failed_count),
    agent_team_report_archive_delete_failed_count: numericPayloadField(
      payload?.agent_team_report_archive_delete_failed_count,
    ),
    recovery_archive_delete_failed_count: numericPayloadField(payload?.recovery_archive_delete_failed_count),
    action,
    status,
    note: typeof payload?.note === 'string' ? payload.note : null,
    evidence: typeof payload?.evidence === 'string' ? payload.evidence : null,
    request_id: event.requestId,
    trace_id: event.traceId,
    occurred_at: event.occurredAt.toISOString(),
  };
}

function buildNotificationTaskRecoveryAuditSummary(items: SecurityOperationAlertNotificationTaskRecoveryAuditItem[]) {
  return {
    total_count: items.length,
    acknowledged_count: items.filter((item) => item.action === 'ACKNOWLEDGE').length,
    ignored_count: items.filter((item) => item.action === 'IGNORE').length,
    resolved_count: items.filter((item) => item.action === 'RESOLVE').length,
    sla_dead_letter_source_count: items.filter((item) => item.failure_source === 'SLA_DEAD_LETTER_ARCHIVE_DELETE').length,
    agent_team_report_archive_delete_source_count: items.filter(
      (item) => item.failure_source === 'AGENT_TEAM_REPORT_ARCHIVE_DELETE',
    ).length,
    recovery_archive_delete_source_count: items.filter(
      (item) => item.failure_source === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE',
    ).length,
    mixed_source_count: items.filter((item) => item.failure_source === 'MIXED').length,
    unknown_source_count: items.filter((item) => item.failure_source === 'UNKNOWN').length,
    latest_action_at: items[0]?.occurred_at ?? null,
  };
}

function buildNotificationTaskRecoveryAuditCsv(items: SecurityOperationAlertNotificationTaskRecoveryAuditItem[]) {
  const rows = [
    [
      '事件ID',
      '建议ID',
      '建议标题',
      '原因',
      '失败来源',
      'SLA 死信失败数',
      '团队报告归档失败数',
      '自愈归档失败数',
      '风险等级',
      '动作',
      '状态',
      '备注',
      '证据',
      'Request ID',
      'Trace ID',
      '处理时间',
    ],
    ...items.map((item) => [
      item.event_id,
      item.suggestion_id,
      item.title,
      notificationTaskRecoveryReasonLabel(item.reason_code),
      notificationTaskRecoveryFailureSourceLabel(item.failure_source),
      String(item.sla_dead_letter_failed_count),
      String(item.agent_team_report_archive_delete_failed_count),
      String(item.recovery_archive_delete_failed_count),
      securityRiskLevelLabel(item.severity),
      notificationTaskRecoveryActionLabel(item.action),
      notificationTaskRecoveryStatusLabel(item.status),
      item.note ?? '',
      item.evidence ?? '',
      item.request_id ?? '',
      item.trace_id ?? '',
      item.occurred_at,
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function notificationTaskRecoveryActionLabel(action: SecurityOperationAlertNotificationTaskRecoveryAction) {
  if (action === 'ACKNOWLEDGE') return '确认';
  if (action === 'IGNORE') return '忽略';
  return '标记已处理';
}

function notificationTaskRecoveryStatusLabel(status: SecurityOperationAlertNotificationTaskRecoveryStatus) {
  if (status === 'OPEN') return '待处理';
  if (status === 'ACKNOWLEDGED') return '已确认';
  if (status === 'IGNORED') return '已忽略';
  return '已处理';
}

function notificationTaskRecoveryReasonLabel(
  reason: SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'],
) {
  if (reason === 'WEBHOOK_NOT_CONFIGURED') return 'Webhook 未配置';
  if (reason === 'WEBHOOK_DELIVERY_FAILED') return 'Webhook 投递失败';
  if (reason === 'AUTO_NOTIFY_DISABLED') return '自动通知关闭';
  if (reason === 'AUTO_RETRY_DISABLED') return '自动重试关闭';
  if (reason === 'CONSECUTIVE_FAILURES') return '连续失败';
  return '失败率偏高';
}

function notificationTaskRecoveryFailureSourceLabel(
  source: SecurityOperationAlertNotificationTaskRecoveryFailureSource,
) {
  if (source === 'SLA_DEAD_LETTER_ARCHIVE_DELETE') return 'SLA 死信归档删除';
  if (source === 'AGENT_TEAM_REPORT_ARCHIVE_DELETE') return '团队报告归档删除';
  if (source === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE') return '自愈归档删除';
  if (source === 'MIXED') return '混合来源';
  return '未知来源';
}

function securityRiskLevelLabel(level: SecurityCenterRiskLevel) {
  if (level === 'HIGH') return '高风险';
  if (level === 'MEDIUM') return '中风险';
  return '低风险';
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function mapNotificationTaskRecoveryAuditArchive(item: {
  key: string;
  relative_key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
}): SecurityOperationAlertNotificationTaskRecoveryAuditArchiveItem {
  return {
    id: Buffer.from(item.key, 'utf8').toString('base64url'),
    key: item.key,
    file_name: item.file_name,
    folder: item.folder,
    size_bytes: item.size_bytes,
    etag: item.etag,
    last_modified: item.last_modified,
    download_expires_in: NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DOWNLOAD_EXPIRES_IN,
  };
}

function mapOperationAlertNotificationArchive(item: {
  key: string;
  relative_key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
}): SecurityOperationAlertNotificationArchiveItem {
  return {
    id: Buffer.from(item.key, 'utf8').toString('base64url'),
    key: item.key,
    file_name: item.file_name,
    folder: item.folder,
    size_bytes: item.size_bytes,
    etag: item.etag,
    last_modified: item.last_modified,
    download_expires_in: OPERATION_ALERT_NOTIFICATION_ARCHIVE_DOWNLOAD_EXPIRES_IN,
  };
}

function operationAlertNotificationArchiveKeyFromId(archiveId: string) {
  const key = Buffer.from(archiveId, 'base64url').toString('utf8');
  if (!key.startsWith(`${OPERATION_ALERT_NOTIFICATION_ARCHIVE_PREFIX}/`)) {
    throw new BadRequestException('无效的运营告警通知审计归档 ID。');
  }
  return key;
}

function operationAlertNotificationArchiveSourceIdFromKey(key: string) {
  return uuidFromText(`security-operation-alert-notification-archive:${key}`);
}

function buildOperationAlertNotificationArchiveDeleteApprovals(
  events: SecurityOperationAlertNotificationArchiveApprovalTimelineItem[],
): SecurityOperationAlertNotificationArchiveApprovalItem[] {
  const groups = new Map<string, SecurityOperationAlertNotificationArchiveApprovalTimelineItem[]>();

  for (const event of events) {
    groups.set(event.source_id, [...(groups.get(event.source_id) ?? []), event]);
  }

  return Array.from(groups.entries())
    .map(([sourceId, groupEvents]) => {
      const sorted = [...groupEvents].sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));
      const request = sorted.find((event) => event.event_type === 'DELETE_REQUESTED');
      if (!request) return null;
      const reversed = [...sorted].reverse();
      const applied = reversed.find((event) => event.event_type === 'DELETE_APPLIED') ?? null;
      const approved = reversed.find((event) => event.event_type === 'APPROVED') ?? null;
      const rejected = reversed.find((event) => event.event_type === 'REJECTED') ?? null;
      const latestDecision = applied ?? rejected ?? approved;

      return {
        id: request.event_id,
        archive_id: sourceId,
        archive_key: request.archive_key,
        archive_file_name: request.archive_file_name,
        archive_size_bytes: request.archive_size_bytes,
        status: operationAlertNotificationArchiveApprovalStatus({ applied, approved, rejected }),
        reason: request.note,
        requested_by: request.actor,
        reviewed_by: latestDecision?.actor ?? null,
        requested_at: request.occurred_at,
        reviewed_at: latestDecision?.occurred_at ?? null,
      };
    })
    .filter((item): item is SecurityOperationAlertNotificationArchiveApprovalItem => Boolean(item))
    .sort((left, right) => Date.parse(right.requested_at) - Date.parse(left.requested_at));
}

function operationAlertNotificationArchiveApprovalStatus(input: {
  applied: SecurityOperationAlertNotificationArchiveApprovalTimelineItem | null;
  approved: SecurityOperationAlertNotificationArchiveApprovalTimelineItem | null;
  rejected: SecurityOperationAlertNotificationArchiveApprovalTimelineItem | null;
}): SecurityOperationAlertNotificationArchiveApprovalItem['status'] {
  if (input.applied) return 'APPLIED';
  if (input.rejected) return 'REJECTED';
  if (input.approved) return 'APPROVED';
  return 'PENDING';
}

function mapOperationAlertNotificationArchiveApprovalEvent(
  event: Prisma.PlatformEventGetPayload<{
    include: {
      user: {
        select: {
          id: true;
          name: true;
          email: true;
        };
      };
    };
  }>,
): SecurityOperationAlertNotificationArchiveApprovalTimelineItem {
  const payload = normalizeJsonObjectOutput(event.payloadJson);
  const archiveKey = typeof payload?.archive_key === 'string' ? payload.archive_key : '';

  return {
    event_id: event.id,
    source_id: event.sourceId ?? event.resourceId ?? '',
    event_type: normalizeOperationAlertNotificationArchiveApprovalEventType(payload?.event_type, event.eventType),
    status: event.status,
    title: event.summary ?? '运营告警通知审计归档操作',
    note: typeof payload?.note === 'string' ? payload.note : null,
    actor: event.user
      ? {
          id: event.user.id,
          name: event.user.name,
          email: event.user.email,
        }
      : null,
    request_id: event.requestId,
    trace_id: event.traceId,
    occurred_at: event.occurredAt.toISOString(),
    archive_key: archiveKey,
    archive_file_name:
      typeof payload?.archive_file_name === 'string'
        ? payload.archive_file_name
        : archiveKey.split('/').at(-1) ?? '归档文件',
    archive_size_bytes: typeof payload?.archive_size_bytes === 'number' ? payload.archive_size_bytes : 0,
  };
}

function normalizeOperationAlertNotificationArchiveApprovalEventType(value: unknown, eventType: string) {
  if (value === 'DELETE_REQUESTED' || value === 'APPROVED' || value === 'REJECTED' || value === 'DELETE_APPLIED') {
    return value;
  }
  if (eventType.endsWith('delete_requested')) return 'DELETE_REQUESTED';
  if (eventType.endsWith('delete_approved')) return 'APPROVED';
  if (eventType.endsWith('delete_rejected')) return 'REJECTED';
  return 'DELETE_APPLIED';
}

function notificationTaskRecoveryAuditArchiveKeyFromId(archiveId: string) {
  const key = Buffer.from(archiveId, 'base64url').toString('utf8');
  if (!key.startsWith(`${NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_PREFIX}/`)) {
    throw new BadRequestException('无效的通知任务自愈闭环审计归档 ID。');
  }
  return key;
}

function notificationTaskRecoveryAuditArchiveSourceIdFromKey(key: string) {
  return uuidFromText(`security-notification-task-recovery-audit-archive:${key}`);
}

function buildNotificationTaskRecoveryAuditArchiveDeleteApprovals(
  events: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem[],
): SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem[] {
  const groups = new Map<string, SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem[]>();

  for (const event of events) {
    groups.set(event.source_id, [...(groups.get(event.source_id) ?? []), event]);
  }

  return Array.from(groups.entries())
    .map(([sourceId, groupEvents]) => {
      const sorted = [...groupEvents].sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));
      const request = sorted.find((event) => event.event_type === 'DELETE_REQUESTED');
      if (!request) return null;
      const reversed = [...sorted].reverse();
      const applied = reversed.find((event) => event.event_type === 'DELETE_APPLIED') ?? null;
      const approved = reversed.find((event) => event.event_type === 'APPROVED') ?? null;
      const rejected = reversed.find((event) => event.event_type === 'REJECTED') ?? null;
      const latestDecision = applied ?? rejected ?? approved;

      return {
        id: request.event_id,
        archive_id: sourceId,
        archive_key: request.archive_key,
        archive_file_name: request.archive_file_name,
        archive_size_bytes: request.archive_size_bytes,
        status: notificationTaskRecoveryAuditArchiveApprovalStatus({ applied, approved, rejected }),
        reason: request.note,
        requested_by: request.actor,
        reviewed_by: latestDecision?.actor ?? null,
        requested_at: request.occurred_at,
        reviewed_at: latestDecision?.occurred_at ?? null,
      };
    })
    .filter((item): item is SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem => Boolean(item))
    .sort((left, right) => Date.parse(right.requested_at) - Date.parse(left.requested_at));
}

function notificationTaskRecoveryAuditArchiveApprovalStatus(input: {
  applied: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem | null;
  approved: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem | null;
  rejected: SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem | null;
}): SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalItem['status'] {
  if (input.applied) return 'APPLIED';
  if (input.rejected) return 'REJECTED';
  if (input.approved) return 'APPROVED';
  return 'PENDING';
}

function mapNotificationTaskRecoveryAuditArchiveApprovalEvent(
  event: Prisma.PlatformEventGetPayload<{
    include: {
      user: {
        select: {
          id: true;
          name: true;
          email: true;
        };
      };
    };
  }>,
): SecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalTimelineItem {
  const payload = normalizeJsonObjectOutput(event.payloadJson);
  const archiveKey = typeof payload?.archive_key === 'string' ? payload.archive_key : '';

  return {
    event_id: event.id,
    source_id: event.sourceId ?? event.resourceId ?? '',
    event_type: normalizeNotificationTaskRecoveryAuditArchiveApprovalEventType(payload?.event_type, event.eventType),
    status: event.status,
    title: event.summary ?? '通知任务自愈闭环审计归档操作',
    note: typeof payload?.note === 'string' ? payload.note : null,
    actor: event.user
      ? {
          id: event.user.id,
          name: event.user.name,
          email: event.user.email,
        }
      : null,
    request_id: event.requestId,
    trace_id: event.traceId,
    occurred_at: event.occurredAt.toISOString(),
    archive_key: archiveKey,
    archive_file_name:
      typeof payload?.archive_file_name === 'string'
        ? payload.archive_file_name
        : archiveKey.split('/').at(-1) ?? '归档文件',
    archive_size_bytes: typeof payload?.archive_size_bytes === 'number' ? payload.archive_size_bytes : 0,
  };
}

function normalizeNotificationTaskRecoveryAuditArchiveApprovalEventType(value: unknown, eventType: string) {
  if (value === 'DELETE_REQUESTED' || value === 'APPROVED' || value === 'REJECTED' || value === 'DELETE_APPLIED') {
    return value;
  }
  if (eventType.endsWith('delete_requested')) return 'DELETE_REQUESTED';
  if (eventType.endsWith('delete_approved')) return 'APPROVED';
  if (eventType.endsWith('delete_rejected')) return 'REJECTED';
  return 'DELETE_APPLIED';
}

function nullableText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function uuidFromText(value: string) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function normalizeNotificationTaskRecoveryAction(
  value: unknown,
  eventType: string,
): SecurityOperationAlertNotificationTaskRecoveryAction {
  if (value === 'ACKNOWLEDGE' || value === 'IGNORE' || value === 'RESOLVE') return value;
  return notificationTaskRecoveryActionFromEventType(eventType) ?? 'ACKNOWLEDGE';
}

function normalizeNotificationTaskRecoveryStatus(
  value: unknown,
  action: SecurityOperationAlertNotificationTaskRecoveryAction,
): SecurityOperationAlertNotificationTaskRecoveryStatus {
  if (value === 'ACKNOWLEDGED' || value === 'IGNORED' || value === 'RESOLVED') return value;
  return notificationTaskRecoveryStatusFromAction(action);
}

function normalizeNotificationTaskRecoveryReason(
  value: unknown,
): SecurityOperationAlertNotificationTaskRecoverySuggestion['reason_code'] {
  if (
    value === 'WEBHOOK_NOT_CONFIGURED' ||
    value === 'WEBHOOK_DELIVERY_FAILED' ||
    value === 'AUTO_NOTIFY_DISABLED' ||
    value === 'AUTO_RETRY_DISABLED' ||
    value === 'CONSECUTIVE_FAILURES' ||
    value === 'HIGH_FAILURE_RATE'
  ) {
    return value;
  }
  return 'HIGH_FAILURE_RATE';
}

function normalizeNotificationTaskRecoveryFailureSource(
  value: unknown,
  payload?: Record<string, unknown> | null,
): SecurityOperationAlertNotificationTaskRecoveryFailureSource {
  if (
    value === 'SLA_DEAD_LETTER_ARCHIVE_DELETE' ||
    value === 'AGENT_TEAM_REPORT_ARCHIVE_DELETE' ||
    value === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE' ||
    value === 'MIXED' ||
    value === 'UNKNOWN'
  ) {
    return value;
  }

  return notificationTaskRecoveryFailureSource({
    slaDeadLetterFailed: numericPayloadField(payload?.sla_dead_letter_failed_count),
    agentTeamReportArchiveDeleteFailed: numericPayloadField(
      payload?.agent_team_report_archive_delete_failed_count,
    ),
    recoveryArchiveDeleteFailed: numericPayloadField(payload?.recovery_archive_delete_failed_count),
  });
}

function normalizeSecurityRiskLevel(value: unknown): SecurityCenterRiskLevel {
  if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH') return value;
  return 'MEDIUM';
}

function compareRecoverySuggestionSeverity(
  left: SecurityOperationAlertNotificationTaskRecoverySuggestion,
  right: SecurityOperationAlertNotificationTaskRecoverySuggestion,
) {
  return recoverySeverityRank(right.severity) - recoverySeverityRank(left.severity);
}

function recoverySeverityRank(severity: SecurityOperationAlertNotificationTaskRecoverySuggestion['severity']) {
  if (severity === 'HIGH') return 3;
  if (severity === 'MEDIUM') return 2;
  return 1;
}

function isManualNotificationTaskFinishedDuplicate(event: { eventType: string; requestId: string | null }) {
  return event.eventType.endsWith('_finished') && Boolean(event.requestId?.includes('_manual_'));
}

function notificationTaskStatus(value: unknown): 'SUCCESS' | 'FAILED' | 'SKIPPED' {
  if (value === 'SUCCESS' || value === 'FAILED' || value === 'SKIPPED') return value;
  return 'SKIPPED';
}

function numericPayloadField(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function booleanSetting(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function countNotificationTaskConsecutiveFailures(items: Array<{ status: 'SUCCESS' | 'FAILED' | 'SKIPPED'; occurredAt: Date }>) {
  let count = 0;
  const sorted = [...items].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
  for (const item of sorted) {
    if (item.status === 'SUCCESS') break;
    count += 1;
  }

  return count;
}

function oldestApprovalAuditRiskAt(events: Array<{ eventStatus: string; occurredAt: Date }>) {
  return oldestDateOrNull(
    events
      .filter((event) => event.eventStatus === 'FAILED' || event.eventStatus === 'WARNING')
      .map((event) => event.occurredAt),
  );
}

function oldestApprovalAuditTraceGapAt(events: Array<{ traceId: string | null; occurredAt: Date }>) {
  return oldestDateOrNull(events.filter((event) => !event.traceId).map((event) => event.occurredAt));
}

function oldestApprovalAuditAt(events: Array<{ occurredAt: Date }>) {
  return oldestDateOrNull(events.map((event) => event.occurredAt));
}

function oldestDateOrNull(values: Array<Date | null | undefined>) {
  const dates = values.filter((value): value is Date => value instanceof Date);
  if (dates.length === 0) return null;
  return dates.sort((left, right) => left.getTime() - right.getTime())[0] ?? null;
}

function oldestDate(values: Array<Date | null | undefined>) {
  return oldestDateOrNull(values) ?? new Date();
}

function buildRiskSignals(
  metrics: SecurityCenterOverview['metrics'],
  posture: SecurityCenterOverview['posture'],
  approvalOperations: SecurityCenterOverview['approval_operations'],
): SecurityCenterRiskSignal[] {
  const risks: SecurityCenterRiskSignal[] = [];

  if (approvalOperations.notification_task_recovery_audit_archive_delete_pending > 0) {
    risks.push({
      id: 'notification-task-recovery-audit-archive-delete-pending-risk',
      title: '通知任务自愈归档删除待审批',
      description: '通知任务自愈闭环审计归档删除申请尚未审批，建议确认删除原因、审计留存要求和 Trace 链路。',
      severity:
        approvalOperations.notification_task_recovery_audit_archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${approvalOperations.notification_task_recovery_audit_archive_delete_pending} 个删除申请`,
    });
  }

  if (approvalOperations.operation_alert_notification_archive_delete_pending > 0) {
    risks.push({
      id: 'operation-alert-notification-archive-delete-pending-risk',
      title: '通知审计归档删除待审批',
      description: '来源型运营告警通知审计归档删除申请尚未审批，建议确认删除原因、审计留存要求和 Trace 链路。',
      severity:
        approvalOperations.operation_alert_notification_archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${approvalOperations.operation_alert_notification_archive_delete_pending} 个删除申请`,
    });
  }

  if (approvalOperations.agent_team_report_archive_delete_pending > 0) {
    risks.push({
      id: 'agent-team-report-archive-delete-pending-risk',
      title: '团队运行报告归档删除待审批',
      description: '团队运行报告归档删除申请尚未审批，建议确认删除原因、团队运行证据、审计留存要求和 Trace 链路。',
      severity: approvalOperations.agent_team_report_archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${approvalOperations.agent_team_report_archive_delete_pending} 个删除申请`,
    });
  }

  if (approvalOperations.customer_success_close_won_report_archive_delete_pending > 0) {
    risks.push({
      id: 'customer-success-close-won-report-archive-delete-pending-risk',
      title: '客户成功复盘归档删除待审批',
      description: '成交复盘报告归档删除申请尚未审批，建议确认删除原因、续约机会证据、审计留存要求和 Trace 链路。',
      severity:
        approvalOperations.customer_success_close_won_report_archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${approvalOperations.customer_success_close_won_report_archive_delete_pending} 个删除申请`,
    });
  }

  if (
    approvalOperations.operation_alert_notification_archive_delete_rejected > 0 &&
    approvalOperations.operation_alert_notification_archive_delete_rejected >=
      approvalOperations.operation_alert_notification_archive_delete_applied
  ) {
    risks.push({
      id: 'operation-alert-notification-archive-delete-rejected-risk',
      title: '通知审计归档删除拒绝偏多',
      description: '通知投递审计归档删除被拒绝数量不低于已生效数量，需要复核申请理由和归档留存策略。',
      severity:
        approvalOperations.operation_alert_notification_archive_delete_rejected >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${approvalOperations.operation_alert_notification_archive_delete_rejected} 个拒绝`,
    });
  }

  if (
    approvalOperations.agent_team_report_archive_delete_rejected > 0 &&
    approvalOperations.agent_team_report_archive_delete_rejected >=
      approvalOperations.agent_team_report_archive_delete_applied
  ) {
    risks.push({
      id: 'agent-team-report-archive-delete-rejected-risk',
      title: '团队运行报告归档删除拒绝偏多',
      description: '团队运行报告归档删除被拒绝数量不低于已生效数量，需要复核申请理由和报告留存策略。',
      severity: approvalOperations.agent_team_report_archive_delete_rejected >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${approvalOperations.agent_team_report_archive_delete_rejected} 个拒绝`,
    });
  }

  if (
    approvalOperations.customer_success_close_won_report_archive_delete_rejected > 0 &&
    approvalOperations.customer_success_close_won_report_archive_delete_rejected >=
      approvalOperations.customer_success_close_won_report_archive_delete_applied
  ) {
    risks.push({
      id: 'customer-success-close-won-report-archive-delete-rejected-risk',
      title: '客户成功复盘归档删除拒绝偏多',
      description: '成交复盘报告归档删除被拒绝数量不低于已生效数量，需要复核申请理由和复盘报告留存策略。',
      severity:
        approvalOperations.customer_success_close_won_report_archive_delete_rejected >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${approvalOperations.customer_success_close_won_report_archive_delete_rejected} 个拒绝`,
    });
  }

  if (
    approvalOperations.notification_task_recovery_audit_archive_delete_rejected > 0 &&
    approvalOperations.notification_task_recovery_audit_archive_delete_rejected >=
      approvalOperations.notification_task_recovery_audit_archive_delete_applied
  ) {
    risks.push({
      id: 'notification-task-recovery-audit-archive-delete-rejected-risk',
      title: '通知任务自愈归档删除拒绝偏多',
      description: '自愈闭环审计归档删除被拒绝数量不低于已生效数量，需要复核申请理由和归档留存策略。',
      severity:
        approvalOperations.notification_task_recovery_audit_archive_delete_rejected >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${approvalOperations.notification_task_recovery_audit_archive_delete_rejected} 个拒绝`,
    });
  }

  if (metrics.pending_approvals > 0) {
    risks.push({
      id: 'pending-approvals',
      title: '存在待处理高危审批',
      description: '高风险工具调用或高影响通知策略变更正在等待人工决策，建议优先处理。',
      severity: metrics.pending_approvals >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/approvals?status=PENDING',
      metric: `${metrics.pending_approvals} 个待审批`,
    });
  }

  if (metrics.security_events_24h > 0) {
    risks.push({
      id: 'audit-security-events',
      title: '最近 24 小时存在安全事件',
      description: '失败登录或异常操作已进入审计日志，需要检查来源和影响面。',
      severity: metrics.security_events_24h >= 5 ? 'HIGH' : 'MEDIUM',
      href: '/audit?status=FAILED',
      metric: `${metrics.security_events_24h} 个事件`,
    });
  }

  if (metrics.security_policy_denials_24h > 0) {
    risks.push({
      id: 'runtime-policy-denials',
      title: '运行时安全策略发生拒绝',
      description: 'SecurityPolicyGuard 已拦截访问请求，请结合最近拒绝事件检查规则和主体属性。',
      severity: metrics.security_policy_denials_24h >= 5 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${metrics.security_policy_denials_24h} 次拒绝`,
    });
  }

  if (metrics.list_data_scope_filters === 0) {
    risks.push({
      id: 'list-data-scope-missing',
      title: '列表数据范围过滤尚未覆盖',
      description: '建议为核心角色配置数据范围，确保列表页不会暴露无权资源。',
      severity: 'MEDIUM',
      href: '/data-scopes',
      metric: '0 个过滤范围',
    });
  }

  if (metrics.failed_monitor_events_24h > 0) {
    risks.push({
      id: 'monitor-failures',
      title: '运行链路存在异常',
      description: '模型、工具、知识库或会话链路出现失败事件。',
      severity: metrics.failed_monitor_events_24h >= 5 ? 'HIGH' : 'MEDIUM',
      href: '/monitor?status=FAILED',
      metric: `${metrics.failed_monitor_events_24h} 个异常`,
    });
  }

  if (metrics.configured_data_scope_roles === 0) {
    risks.push({
      id: 'data-scope-empty',
      title: '数据权限尚未覆盖角色',
      description: '建议至少为核心角色配置 TENANT、DEPT、SELF 或 CUSTOM 数据范围。',
      severity: 'MEDIUM',
      href: '/data-scopes',
      metric: '0 个角色',
    });
  }

  if (metrics.active_policies === 0) {
    risks.push({
      id: 'policy-empty',
      title: '未启用安全策略',
      description: 'ABAC 策略为空时，运行时主要依赖 RBAC 和对象授权。',
      severity: 'MEDIUM',
      href: '/security',
      metric: '0 条策略',
    });
  }

  if (risks.length === 0) {
    risks.push({
      id: 'posture-normal',
      title: '安全治理运行平稳',
      description: posture.summary,
      severity: 'LOW',
      href: '/security',
      metric: `${posture.score} 分`,
    });
  }

  return risks.slice(0, 6);
}

function buildApprovalOperationAlerts(
  operations: ApprovalOperationStats,
  lifecycleEvents: Array<{ resourceId: string | null; eventType: string; payloadJson: Prisma.JsonValue; occurredAt: Date }>,
): SecurityCenterOperationalAlert[] {
  const alerts: Array<Omit<SecurityCenterOperationalAlert, 'last_action' | 'last_note' | 'status' | 'updated_at'>> = [];
  const pendingTotal =
    operations.tool_pending +
    operations.notification_pending +
    operations.archive_delete_pending +
    operations.operation_alert_notification_archive_delete_pending +
    operations.agent_team_report_archive_delete_pending +
    operations.customer_success_close_won_report_archive_delete_pending +
    operations.sla_dead_letter_archive_delete_pending +
    operations.notification_task_recovery_audit_archive_delete_pending;
  const auditRiskTotal = operations.audit_failed_24h + operations.audit_warning_24h;
  const lifecycleMap = buildSecurityOperationLifecycleMap(lifecycleEvents);

  if (pendingTotal >= 5) {
    alerts.push({
      id: 'approval-operation-backlog',
      title: '审批待办出现积压',
      description: '工具审批、通知策略审批或归档删除审批已经形成积压，建议安全管理员集中处理。',
      severity: pendingTotal >= 10 ? 'HIGH' : 'MEDIUM',
      href: '/approvals?status=PENDING',
      metric: `${pendingTotal} 个待办`,
      action_label: '处理审批',
      triggered_at: oldestDate([
        operations.tool_pending_oldest_at,
        operations.notification_pending_oldest_at,
        operations.archive_delete_pending_oldest_at,
        operations.operation_alert_notification_archive_delete_pending_oldest_at,
        operations.agent_team_report_archive_delete_pending_oldest_at,
        operations.customer_success_close_won_report_archive_delete_pending_oldest_at,
        operations.sla_dead_letter_archive_delete_pending_oldest_at,
        operations.notification_task_recovery_audit_archive_delete_pending_oldest_at,
      ]).toISOString(),
    });
  }

  if (operations.runtime_pending >= 3) {
    alerts.push({
      id: 'runtime-tool-approval-backlog',
      title: '运行时工具审批积压',
      description: 'Agent 运行链路正在等待工具审批，可能影响用户会话响应和自动化任务推进。',
      severity: operations.runtime_pending >= 6 ? 'HIGH' : 'MEDIUM',
      href: '/approvals?queue=tool&status=PENDING',
      metric: `${operations.runtime_pending} 个运行时请求`,
      action_label: '查看运行时审批',
      triggered_at: (operations.runtime_pending_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (operations.notification_high_impact_pending > 0) {
    alerts.push({
      id: 'high-impact-notification-policy-pending',
      title: '高影响通知策略待审批',
      description: '告警通知自动重试策略存在高影响变更，批准前应确认投递频率、退避和最大重试次数。',
      severity: operations.notification_high_impact_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/approvals?queue=notification-policy&status=PENDING',
      metric: `${operations.notification_high_impact_pending} 个高影响`,
      action_label: '审核策略变更',
      triggered_at: (operations.notification_high_impact_pending_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (operations.archive_delete_pending > 0) {
    alerts.push({
      id: 'archive-delete-pending',
      title: '归档删除等待审批',
      description: '审批审计归档删除属于高危操作，请确认删除原因、申请人和审计留存要求。',
      severity: operations.archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/approvals?queue=archive-delete&status=PENDING',
      metric: `${operations.archive_delete_pending} 个删除申请`,
      action_label: '处理归档删除',
      triggered_at: (operations.archive_delete_pending_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (operations.operation_alert_notification_archive_delete_pending > 0) {
    alerts.push({
      id: 'operation-alert-notification-archive-delete-pending',
      title: '通知审计归档删除等待审批',
      description: '来源型运营告警通知审计归档删除申请尚未审批，请确认删除原因、投递审计留存要求和链路证据。',
      severity: operations.operation_alert_notification_archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.operation_alert_notification_archive_delete_pending} 个删除申请`,
      action_label: '查看通知归档审批',
      triggered_at: (
        operations.operation_alert_notification_archive_delete_pending_oldest_at ??
        operations.archive_storage_checked_at
      ).toISOString(),
    });
  }

  if (
    operations.operation_alert_notification_archive_delete_rejected > 0 &&
    operations.operation_alert_notification_archive_delete_rejected >=
      operations.operation_alert_notification_archive_delete_applied
  ) {
    alerts.push({
      id: 'operation-alert-notification-archive-delete-rejected-risk',
      title: '通知审计归档删除拒绝偏多',
      description: '来源型运营告警通知审计归档删除被拒绝数量不低于已生效数量，需要复核删除申请理由和审计留存策略。',
      severity: operations.operation_alert_notification_archive_delete_rejected >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.operation_alert_notification_archive_delete_rejected} 个拒绝`,
      action_label: '复核归档删除',
      triggered_at: operations.archive_storage_checked_at.toISOString(),
    });
  }

  if (operations.agent_team_report_archive_delete_pending > 0) {
    alerts.push({
      id: 'agent-team-report-archive-delete-pending',
      title: '团队运行报告归档删除等待审批',
      description: '团队运行报告归档删除申请正在等待审批，请核对团队、运行记录、归档文件、申请原因和 Trace 链路。',
      severity: operations.agent_team_report_archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.agent_team_report_archive_delete_pending} 个删除申请`,
      action_label: '查看团队报告审批',
      triggered_at: (
        operations.agent_team_report_archive_delete_pending_oldest_at ?? operations.archive_storage_checked_at
      ).toISOString(),
    });
  }

  if (
    operations.agent_team_report_archive_delete_rejected > 0 &&
    operations.agent_team_report_archive_delete_rejected >= operations.agent_team_report_archive_delete_applied
  ) {
    alerts.push({
      id: 'agent-team-report-archive-delete-rejected-risk',
      title: '团队运行报告归档删除拒绝偏多',
      description: '团队运行报告归档删除被拒绝数量不低于已生效数量，建议复核申请原因、团队运行报告归档范围和留存策略。',
      severity: operations.agent_team_report_archive_delete_rejected >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.agent_team_report_archive_delete_rejected} 个拒绝`,
      action_label: '复核团队报告审批',
      triggered_at: operations.archive_storage_checked_at.toISOString(),
    });
  }

  if (operations.customer_success_close_won_report_archive_delete_pending > 0) {
    alerts.push({
      id: 'customer-success-close-won-report-archive-delete-pending',
      title: '客户成功复盘归档删除等待审批',
      description: '成交复盘报告归档删除申请正在等待审批，请核对续约机会、归档文件、申请原因和 Trace 链路。',
      severity: operations.customer_success_close_won_report_archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.customer_success_close_won_report_archive_delete_pending} 个删除申请`,
      action_label: '查看复盘归档审批',
      triggered_at: (
        operations.customer_success_close_won_report_archive_delete_pending_oldest_at ??
        operations.archive_storage_checked_at
      ).toISOString(),
    });
  }

  if (
    operations.customer_success_close_won_report_archive_delete_rejected > 0 &&
    operations.customer_success_close_won_report_archive_delete_rejected >=
      operations.customer_success_close_won_report_archive_delete_applied
  ) {
    alerts.push({
      id: 'customer-success-close-won-report-archive-delete-rejected-risk',
      title: '客户成功复盘归档删除拒绝偏多',
      description: '成交复盘报告归档删除被拒绝数量不低于已生效数量，建议复核删除申请原因和复盘报告留存策略。',
      severity: operations.customer_success_close_won_report_archive_delete_rejected >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.customer_success_close_won_report_archive_delete_rejected} 个拒绝`,
      action_label: '复核复盘归档审批',
      triggered_at: operations.archive_storage_checked_at.toISOString(),
    });
  }

  if (operations.sla_dead_letter_archive_delete_pending > 0) {
    alerts.push({
      id: 'sla-dead-letter-archive-delete-pending',
      title: 'SLA 死信归档删除等待审批',
      description: 'SLA 死信处置审计归档删除申请正在等待审批，请核对文件、申请人、审批意见和 Trace 链路。',
      severity: operations.sla_dead_letter_archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.sla_dead_letter_archive_delete_pending} 个删除申请`,
      action_label: '查看归档删除审批',
      triggered_at: (
        operations.sla_dead_letter_archive_delete_pending_oldest_at ??
        operations.archive_storage_checked_at
      ).toISOString(),
    });
  }

  if (
    operations.sla_dead_letter_archive_delete_rejected > 0 &&
    operations.sla_dead_letter_archive_delete_rejected >= operations.sla_dead_letter_archive_delete_applied
  ) {
    alerts.push({
      id: 'sla-dead-letter-archive-delete-rejected-risk',
      title: 'SLA 死信归档删除拒绝偏多',
      description: 'SLA 死信审计归档删除被拒绝数量不低于已生效数量，建议复核删除申请原因和归档留存策略。',
      severity: operations.sla_dead_letter_archive_delete_rejected >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.sla_dead_letter_archive_delete_rejected} 个拒绝`,
      action_label: '复核删除审批',
      triggered_at: operations.archive_storage_checked_at.toISOString(),
    });
  }

  if (operations.notification_task_recovery_audit_archive_delete_pending > 0) {
    alerts.push({
      id: 'notification-task-recovery-audit-archive-delete-pending',
      title: '通知任务自愈归档删除等待审批',
      description: '通知任务自愈闭环审计归档删除申请正在等待审批，请核对申请原因、归档文件和 Trace 链路。',
      severity: operations.notification_task_recovery_audit_archive_delete_pending >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.notification_task_recovery_audit_archive_delete_pending} 个删除申请`,
      action_label: '查看自愈归档审批',
      triggered_at: (
        operations.notification_task_recovery_audit_archive_delete_pending_oldest_at ??
        operations.archive_storage_checked_at
      ).toISOString(),
    });
  }

  if (
    operations.notification_task_recovery_audit_archive_delete_rejected > 0 &&
    operations.notification_task_recovery_audit_archive_delete_rejected >=
      operations.notification_task_recovery_audit_archive_delete_applied
  ) {
    alerts.push({
      id: 'notification-task-recovery-audit-archive-delete-rejected-risk',
      title: '通知任务自愈归档删除拒绝偏多',
      description: '自愈闭环审计归档删除被拒绝数量不低于已生效数量，建议复核删除申请原因和审计留存策略。',
      severity: operations.notification_task_recovery_audit_archive_delete_rejected >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.notification_task_recovery_audit_archive_delete_rejected} 个拒绝`,
      action_label: '复核自愈归档审批',
      triggered_at: operations.archive_storage_checked_at.toISOString(),
    });
  }

  if (
    operations.notification_task_runs_24h >= 3 &&
    (operations.notification_task_failed_24h > 0 || operations.notification_task_failure_rate_24h >= 30)
  ) {
    const failedSourceCounts = [
      operations.notification_task_sla_dead_letter_failed_24h,
      operations.notification_task_agent_team_report_archive_delete_failed_24h,
      operations.notification_task_recovery_archive_delete_failed_24h,
    ];
    const failedSourceKindCount = failedSourceCounts.filter((count) => count > 0).length;

    if (failedSourceKindCount > 1) {
      const sourceFailureTotal =
        operations.notification_task_sla_dead_letter_failed_24h +
        operations.notification_task_agent_team_report_archive_delete_failed_24h +
        operations.notification_task_recovery_archive_delete_failed_24h;
      alerts.push({
        id: 'operation-alert-notification-task-mixed-failure-source',
        title: failedSourceKindCount >= 3 ? '通知任务多来源失败' : '通知任务双来源失败',
        description: 'SLA 死信、团队报告或自愈归档删除通知任务同时出现失败或跳过，需要优先排查 Webhook、调度和通知策略。',
        severity:
          sourceFailureTotal >= 3 ||
          operations.notification_task_failure_rate_24h >= 50 ||
          operations.notification_task_consecutive_failures >= 3
            ? 'HIGH'
            : 'MEDIUM',
        href: '/security',
        metric: `SLA ${operations.notification_task_sla_dead_letter_failed_24h} / 团队 ${operations.notification_task_agent_team_report_archive_delete_failed_24h} / 自愈 ${operations.notification_task_recovery_archive_delete_failed_24h}`,
        action_label: failedSourceKindCount >= 3 ? '排查多来源失败' : '排查双来源失败',
        triggered_at: (operations.notification_task_failure_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
      });
    } else if (operations.notification_task_sla_dead_letter_failed_24h > 0) {
      alerts.push({
        id: 'operation-alert-notification-task-sla-dead-letter-failure-source',
        title: 'SLA 死信通知来源失败',
        description: 'SLA 死信归档删除审批告警自动通知出现失败或跳过，可能影响超时处置和死信审计删除审批触达。',
        severity:
          operations.notification_task_sla_dead_letter_failed_24h >= 3 ||
          operations.notification_task_failure_rate_24h >= 50 ||
          operations.notification_task_consecutive_failures >= 3
            ? 'HIGH'
            : 'MEDIUM',
        href: '/security',
        metric: `${operations.notification_task_sla_dead_letter_failed_24h} 条 SLA 来源失败`,
        action_label: '排查 SLA 来源',
        triggered_at: (operations.notification_task_failure_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
      });
    } else if (operations.notification_task_agent_team_report_archive_delete_failed_24h > 0) {
      alerts.push({
        id: 'operation-alert-notification-task-agent-team-report-archive-failure-source',
        title: '团队报告归档通知来源失败',
        description: '团队运行报告归档删除审批告警自动通知出现失败或跳过，可能影响多 Agent 运行报告删除审批触达。',
        severity:
          operations.notification_task_agent_team_report_archive_delete_failed_24h >= 3 ||
          operations.notification_task_failure_rate_24h >= 50 ||
          operations.notification_task_consecutive_failures >= 3
            ? 'HIGH'
            : 'MEDIUM',
        href: '/security',
        metric: `${operations.notification_task_agent_team_report_archive_delete_failed_24h} 条团队报告来源失败`,
        action_label: '排查团队报告来源',
        triggered_at: (operations.notification_task_failure_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
      });
    } else if (operations.notification_task_recovery_archive_delete_failed_24h > 0) {
      alerts.push({
        id: 'operation-alert-notification-task-recovery-archive-failure-source',
        title: '自愈归档通知来源失败',
        description: '通知任务自愈闭环审计归档删除审批告警自动通知出现失败或跳过，可能影响归档删除审批触达和审计留存治理。',
        severity:
          operations.notification_task_recovery_archive_delete_failed_24h >= 3 ||
          operations.notification_task_failure_rate_24h >= 50 ||
          operations.notification_task_consecutive_failures >= 3
            ? 'HIGH'
            : 'MEDIUM',
        href: '/security',
        metric: `${operations.notification_task_recovery_archive_delete_failed_24h} 条自愈来源失败`,
        action_label: '排查自愈来源',
        triggered_at: (operations.notification_task_failure_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
      });
    }

    alerts.push({
      id: 'operation-alert-notification-task-failure-risk',
      title: '通知任务失败率偏高',
      description: '审批与归档告警通知任务最近 24 小时出现失败或跳过，可能影响 SLA 死信归档删除审批告警触达。',
      severity:
        operations.notification_task_failure_rate_24h >= 50 || operations.notification_task_failed_24h >= 3
          ? 'HIGH'
          : 'MEDIUM',
      href: '/security',
      metric: `${operations.notification_task_failed_24h} 失败 / ${operations.notification_task_skipped_24h} 跳过 / ${operations.notification_task_failure_rate_24h}%`,
      action_label: '查看任务历史',
      triggered_at: (operations.notification_task_failure_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (operations.notification_task_consecutive_failures >= 2) {
    alerts.push({
      id: 'operation-alert-notification-task-consecutive-failure',
      title: '通知任务连续失败',
      description: '自动通知或自动重试任务连续失败或跳过，建议检查 Webhook 配置、系统设置和任务执行事件。',
      severity: operations.notification_task_consecutive_failures >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.notification_task_consecutive_failures} 次连续失败`,
      action_label: '排查任务链路',
      triggered_at: (operations.notification_task_failure_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (operations.approval_workbench_exported_records_24h >= 1000 || operations.approval_workbench_exports_24h >= 10) {
    alerts.push({
      id: 'approval-workbench-export-volume-risk',
      title: '审批工作台导出量偏高',
      description: '统一安全审批工作台最近 24 小时导出次数或导出记录数偏高，建议审计导出用途、筛选范围和操作人。',
      severity:
        operations.approval_workbench_exported_records_24h >= 5000 || operations.approval_workbench_exports_24h >= 20
          ? 'HIGH'
          : 'MEDIUM',
      href: '/security',
      metric: `${operations.approval_workbench_exports_24h} 次 / ${operations.approval_workbench_exported_records_24h} 条`,
      action_label: '查看导出事件',
      triggered_at: (operations.approval_workbench_export_risk_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (operations.approval_workbench_high_risk_exports_24h > 0) {
    alerts.push({
      id: 'approval-workbench-export-high-risk-filter',
      title: '高风险审批筛选被导出',
      description: '审批工作台导出包含待审批、审计归档或归档删除等高风险筛选范围，需要确认导出目的和数据流向。',
      severity: operations.approval_workbench_high_risk_exports_24h >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.approval_workbench_high_risk_exports_24h} 次高风险导出`,
      action_label: '复核导出范围',
      triggered_at: (operations.approval_workbench_export_risk_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (operations.approval_workbench_repeated_exports_24h > 0) {
    alerts.push({
      id: 'approval-workbench-export-repeated-risk',
      title: '审批工作台短时间重复导出',
      description: '同一操作主体最近 24 小时多次导出审批工作台数据，建议确认是否为审计任务、批量取数或异常操作。',
      severity: operations.approval_workbench_repeated_exports_24h >= 3 ? 'HIGH' : 'MEDIUM',
      href: '/security',
      metric: `${operations.approval_workbench_repeated_exports_24h} 次重复导出`,
      action_label: '查看导出链路',
      triggered_at: (operations.approval_workbench_export_risk_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (auditRiskTotal > 0) {
    alerts.push({
      id: 'approval-audit-event-risk',
      title: '审批审计存在失败或告警',
      description: '最近 24 小时审批审计链路出现失败或告警事件，需要核对审批操作和归档链路。',
      severity: operations.audit_failed_24h > 0 ? 'HIGH' : 'MEDIUM',
      href: '/approval-audits?status=FAILED',
      metric: `${operations.audit_failed_24h} 失败 / ${operations.audit_warning_24h} 告警`,
      action_label: '查看审批审计',
      triggered_at: (operations.audit_risk_oldest_at ?? operations.approval_audit_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (operations.audit_events_24h > 0 && operations.audit_trace_count_24h < operations.audit_events_24h) {
    const missingTraceCount = operations.audit_events_24h - operations.audit_trace_count_24h;
    alerts.push({
      id: 'approval-audit-trace-gap',
      title: '审批审计 Trace 覆盖不足',
      description: '部分审批审计事件缺少 Trace ID，排障时可能无法串起操作日志、审批链路和归档记录。',
      severity: missingTraceCount >= 5 ? 'HIGH' : 'MEDIUM',
      href: '/approval-audits?traceOnly=false',
      metric: `${missingTraceCount} 条缺少 Trace`,
      action_label: '检查审计链路',
      triggered_at: (operations.audit_trace_gap_oldest_at ?? operations.approval_audit_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  if (operations.archive_storage_status === 'UNKNOWN' || operations.archive_storage_status === 'UNAVAILABLE') {
    alerts.push({
      id: 'approval-archive-storage-unavailable',
      title: '归档存储暂不可用',
      description: '安全中心无法读取审批审计归档前缀，归档数量和容量可能不是实时值。',
      severity: 'HIGH',
      href: '/approval-audits',
      metric: operations.archive_storage_status,
      action_label: '检查归档中心',
      triggered_at: operations.archive_storage_checked_at.toISOString(),
    });
  } else if (operations.archive_storage_status === 'DEGRADED') {
    alerts.push({
      id: 'approval-archive-storage-degraded',
      title: '归档存储处于降级状态',
      description: '审批审计归档仍可展示，但建议检查对象存储连接、桶策略和租户前缀权限。',
      severity: 'MEDIUM',
      href: '/approval-audits',
      metric: 'DEGRADED',
      action_label: '检查归档中心',
      triggered_at: operations.archive_storage_checked_at.toISOString(),
    });
  }

  if (operations.audit_events_24h > 0 && operations.archive_count === 0) {
    alerts.push({
      id: 'approval-audit-archive-empty',
      title: '审批审计尚未形成归档',
      description: '已有审批审计事件但没有归档文件，建议生成 CSV 归档用于审计留存。',
      severity: 'MEDIUM',
      href: '/approval-audits',
      metric: '0 个归档',
      action_label: '生成归档',
      triggered_at: (operations.approval_audit_oldest_at ?? operations.archive_storage_checked_at).toISOString(),
    });
  }

  return alerts.slice(0, 8).map((alert) => ({
    ...alert,
    ...securityOperationLifecycleFields(lifecycleMap.get(alert.id) ?? null),
  }));
}

function securityOperationAlertNotificationTargets(alert: SecurityCenterOperationalAlert) {
  if (isApprovalWorkbenchExportAlert(alert.id)) {
    return alert.severity === 'HIGH' ? ['租户管理员', '安全管理员', '审计员'] : ['安全管理员', '审计员'];
  }
  if (isNotificationTaskFailureAlert(alert.id)) {
    return alert.severity === 'HIGH' ? ['租户管理员', '安全管理员', '审计员'] : ['安全管理员', '审计员'];
  }
  if (isNotificationTaskRecoveryAuditArchiveDeleteAlert(alert.id)) {
    return alert.severity === 'HIGH' ? ['租户管理员', '安全管理员', '审计员'] : ['安全管理员', '审计员'];
  }
  if (isAgentTeamReportArchiveDeleteAlert(alert.id)) {
    return alert.severity === 'HIGH' ? ['租户管理员', '安全管理员', '审计员'] : ['安全管理员', '审计员'];
  }
  if (isCustomerSuccessCloseWonReportArchiveDeleteAlert(alert.id)) {
    return alert.severity === 'HIGH' ? ['租户管理员', '安全管理员', '审计员'] : ['安全管理员', '审计员'];
  }
  if (isSlaDeadLetterArchiveDeleteAlert(alert.id)) {
    return alert.severity === 'HIGH' ? ['租户管理员', '安全管理员', '审计员'] : ['安全管理员', '审计员'];
  }
  if (alert.severity === 'HIGH') return ['租户管理员', '安全管理员', '审计员'];
  if (alert.id.includes('archive')) return ['安全管理员', '审计员'];
  return ['安全管理员'];
}

function isApprovalWorkbenchExportAlert(alertId: string) {
  return (
    alertId === 'approval-workbench-export-volume-risk' ||
    alertId === 'approval-workbench-export-high-risk-filter' ||
    alertId === 'approval-workbench-export-repeated-risk'
  );
}

function isSlaDeadLetterArchiveDeleteAlert(alertId: string) {
  return (
    alertId === 'sla-dead-letter-archive-delete-pending' ||
    alertId === 'sla-dead-letter-archive-delete-rejected-risk'
  );
}

function isNotificationTaskRecoveryAuditArchiveDeleteAlert(alertId: string) {
  return (
    alertId === 'notification-task-recovery-audit-archive-delete-pending' ||
    alertId === 'notification-task-recovery-audit-archive-delete-rejected-risk'
  );
}

function isAgentTeamReportArchiveDeleteAlert(alertId: string) {
  return (
    alertId === 'agent-team-report-archive-delete-pending' ||
    alertId === 'agent-team-report-archive-delete-rejected-risk'
  );
}

function isCustomerSuccessCloseWonReportArchiveDeleteAlert(alertId: string) {
  return (
    alertId === 'customer-success-close-won-report-archive-delete-pending' ||
    alertId === 'customer-success-close-won-report-archive-delete-rejected-risk'
  );
}

function isNotificationTaskFailureAlert(alertId: string) {
  return (
    alertId === 'operation-alert-notification-task-failure-risk' ||
    alertId === 'operation-alert-notification-task-consecutive-failure' ||
    isNotificationTaskFailureSourceAlert(alertId)
  );
}

function isNotificationTaskFailureSourceAlert(alertId: string) {
  return (
    alertId === 'operation-alert-notification-task-sla-dead-letter-failure-source' ||
    alertId === 'operation-alert-notification-task-agent-team-report-archive-failure-source' ||
    alertId === 'operation-alert-notification-task-recovery-archive-failure-source' ||
    alertId === 'operation-alert-notification-task-mixed-failure-source'
  );
}

function securityOperationAlertCategory(alert: SecurityCenterOperationalAlert) {
  if (isApprovalWorkbenchExportAlert(alert.id)) return 'APPROVAL_WORKBENCH_EXPORT';
  if (alert.id === 'operation-alert-notification-task-sla-dead-letter-failure-source') {
    return 'SLA_DEAD_LETTER_ARCHIVE_DELETE';
  }
  if (alert.id === 'operation-alert-notification-task-agent-team-report-archive-failure-source') {
    return 'AGENT_TEAM_REPORT_ARCHIVE_DELETE';
  }
  if (alert.id === 'operation-alert-notification-task-recovery-archive-failure-source') {
    return 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE';
  }
  if (alert.id === 'operation-alert-notification-task-mixed-failure-source') return 'NOTIFICATION_TASK_MIXED_FAILURE_SOURCE';
  if (isNotificationTaskFailureAlert(alert.id)) return 'NOTIFICATION_TASK';
  if (isNotificationTaskRecoveryAuditArchiveDeleteAlert(alert.id)) {
    return 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE';
  }
  if (isAgentTeamReportArchiveDeleteAlert(alert.id)) return 'AGENT_TEAM_REPORT_ARCHIVE_DELETE';
  if (isCustomerSuccessCloseWonReportArchiveDeleteAlert(alert.id)) {
    return 'CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE';
  }
  if (isSlaDeadLetterArchiveDeleteAlert(alert.id)) return 'SLA_DEAD_LETTER_ARCHIVE_DELETE';
  if (alert.id.includes('archive')) return 'ARCHIVE_OPERATION';
  if (alert.id.includes('notification')) return 'NOTIFICATION_POLICY';
  if (alert.id.includes('runtime')) return 'RUNTIME_APPROVAL';
  return 'SECURITY_OPERATION';
}

function buildSecurityOperationLifecycleMap(
  events: Array<{ resourceId: string | null; eventType: string; payloadJson: Prisma.JsonValue; occurredAt: Date }>,
) {
  const map = new Map<string, { action: SecurityOperationAlertAction; note: string | null; occurredAt: Date }>();

  for (const event of events) {
    if (!event.resourceId) continue;
    const action = securityOperationActionFromEventType(event.eventType);
    if (!action) continue;
    const payload = normalizeJsonObjectOutput(event.payloadJson);
    map.set(event.resourceId, {
      action,
      note: typeof payload?.note === 'string' ? payload.note : null,
      occurredAt: event.occurredAt,
    });
  }

  return map;
}

function securityOperationLifecycleFields(
  lifecycle: { action: SecurityOperationAlertAction; note: string | null; occurredAt: Date } | null,
): Pick<SecurityCenterOperationalAlert, 'last_action' | 'last_note' | 'status' | 'updated_at'> {
  if (!lifecycle) {
    return {
      status: 'OPEN',
      last_action: null,
      last_note: null,
      updated_at: null,
    };
  }

  return {
    status: securityOperationStatusFromAction(lifecycle.action),
    last_action: lifecycle.action,
    last_note: lifecycle.note,
    updated_at: lifecycle.occurredAt.toISOString(),
  };
}

function securityOperationActionFromEventType(eventType: string): SecurityOperationAlertAction | null {
  if (eventType === 'platform.security.approval_operation_alert.acknowledged') return 'ACKNOWLEDGE';
  if (eventType === 'platform.security.approval_operation_alert.escalated') return 'ESCALATE';
  if (eventType === 'platform.security.approval_operation_alert.closed') return 'CLOSE';
  return null;
}

function securityOperationAlertEventType(action: SecurityOperationAlertAction) {
  if (action === 'ACKNOWLEDGE') return 'platform.security.approval_operation_alert.acknowledged';
  if (action === 'ESCALATE') return 'platform.security.approval_operation_alert.escalated';
  return 'platform.security.approval_operation_alert.closed';
}

function securityOperationStatusFromAction(action: SecurityOperationAlertAction): SecurityOperationAlertStatus {
  if (action === 'ACKNOWLEDGE') return 'ACKNOWLEDGED';
  if (action === 'ESCALATE') return 'ESCALATED';
  return 'CLOSED';
}

function securityOperationLifecycleMessage(action: SecurityOperationAlertAction, title: string) {
  if (action === 'ACKNOWLEDGE') return `已确认审批与归档告警：${title}`;
  if (action === 'ESCALATE') return `已升级审批与归档告警：${title}`;
  return `已关闭审批与归档告警：${title}`;
}

function normalizeSecurityOperationAlertChannels(
  channels: SecurityOperationAlertNotificationChannel[] | undefined,
) {
  const allowed: SecurityOperationAlertNotificationChannel[] = ['IN_APP', 'WEBHOOK'];
  const requested = channels?.length ? channels : allowed;
  const normalized = requested.filter((channel): channel is SecurityOperationAlertNotificationChannel =>
    allowed.includes(channel),
  );

  return Array.from(new Set(normalized));
}

async function deliverSecurityOperationAlertWebhook(
  webhookUrl: string,
  alert: SecurityCenterOperationalAlert,
  note: string | null,
  targets: string[],
  category: string,
): Promise<{ status: number | null; ok: boolean; error: string | null }> {
  const body = JSON.stringify({
    event: 'platform.security.approval_operation_alert.notification',
    category,
    alert_id: alert.id,
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    metric: alert.metric,
    href: alert.href,
    action_label: alert.action_label,
    targets,
    note,
    created_at: new Date().toISOString(),
  });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'AIAGET-Security-Alerts/1.0',
      },
      body,
      signal: AbortSignal.timeout(SECURITY_OPERATION_ALERT_WEBHOOK_TIMEOUT_MS),
    });
    const text = await safeSecurityOperationAlertResponseText(response);

    return {
      status: response.status,
      ok: response.ok,
      error: response.ok ? null : text ?? `Webhook returned HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      error: error instanceof Error ? error.message : 'Webhook notification failed',
    };
  }
}

async function safeSecurityOperationAlertResponseText(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, 1200);
  } catch {
    return null;
  }
}

function securityOperationNotificationStatus(
  channels: SecurityOperationAlertNotificationChannel[],
  webhookResult: { ok: boolean } | null,
  webhookSkipped: boolean,
): SecurityOperationAlertNotificationStatus {
  if (channels.length === 0) return 'SKIPPED';

  const inAppSent = channels.includes('IN_APP');
  const webhookRequested = channels.includes('WEBHOOK');

  if (!webhookRequested) return inAppSent ? 'SENT' : 'SKIPPED';
  if (webhookResult?.ok) return 'SENT';
  if (webhookSkipped) return inAppSent ? 'PARTIAL' : 'SKIPPED';

  return inAppSent ? 'PARTIAL' : 'FAILED';
}

function securityOperationNotificationMessage(
  status: SecurityOperationAlertNotificationStatus,
  channels: SecurityOperationAlertNotificationChannel[],
  webhookSkipped: boolean,
) {
  if (status === 'SENT') return '审批与归档告警通知已投递。';
  if (status === 'PARTIAL') {
    return webhookSkipped ? '站内通知已记录，外部 Webhook 未配置。' : '站内通知已记录，外部 Webhook 投递失败。';
  }
  if (status === 'SKIPPED') return '审批与归档告警通知已跳过，未配置可用投递渠道。';

  return channels.includes('WEBHOOK') ? '外部 Webhook 告警通知投递失败。' : '审批与归档告警通知投递失败。';
}

function mapSecurityOperationAlertNotificationEvent(
  event: SecurityOperationNotificationEventRecord,
): SecurityOperationAlertNotificationItem {
  const payload = normalizeJsonObjectOutput(event.payloadJson);
  const status = normalizeSecurityOperationNotificationStatus(payload?.status);
  const channels = normalizeSecurityOperationAlertChannels(
    Array.isArray(payload?.channels) ? payload.channels : undefined,
  );
  const targets = Array.isArray(payload?.targets)
    ? payload.targets.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    alert_id: typeof payload?.alert_id === 'string' ? payload.alert_id : event.resourceId ?? '',
    notification_event_id: event.id,
    alert_category: typeof payload?.alert_category === 'string' ? payload.alert_category : null,
    status,
    channels,
    targets,
    delivery_event_id: event.id,
    webhook_status: typeof payload?.webhook_status === 'number' ? payload.webhook_status : null,
    webhook_error: typeof payload?.webhook_error === 'string' ? payload.webhook_error : null,
    message: event.summary ?? securityOperationNotificationMessage(status, channels, false),
    retry_count: typeof payload?.retry_count === 'number' ? payload.retry_count : 0,
    retried_from_event_id: typeof payload?.retried_from_event_id === 'string' ? payload.retried_from_event_id : null,
    request_id: event.requestId,
    trace_id: event.traceId,
    delivered_at: typeof payload?.delivered_at === 'string' ? payload.delivered_at : event.occurredAt.toISOString(),
    created_at: event.createdAt.toISOString(),
  };
}

function buildSecurityOperationAlertNotificationSummary(items: SecurityOperationAlertNotificationItem[]) {
  return {
    total_count: items.length,
    sent_count: items.filter((item) => item.status === 'SENT').length,
    partial_count: items.filter((item) => item.status === 'PARTIAL').length,
    skipped_count: items.filter((item) => item.status === 'SKIPPED').length,
    failed_count: items.filter((item) => item.status === 'FAILED').length,
    retryable_count: items.filter((item) => isRetryableSecurityOperationNotification(item.status)).length,
  };
}

function buildSecurityOperationAlertNotificationCsv(items: SecurityOperationAlertNotificationItem[]) {
  const rows = [
    [
      '通知事件ID',
      '告警ID',
      '来源分类',
      '状态',
      '渠道',
      '目标',
      'Webhook 状态',
      'Webhook 错误',
      '重试次数',
      '来源事件ID',
      'Request ID',
      'Trace ID',
      '消息',
      '投递时间',
      '创建时间',
    ],
    ...items.map((item) => [
      item.notification_event_id,
      item.alert_id,
      item.alert_category ?? '',
      item.status,
      item.channels.join('、'),
      item.targets.join('、'),
      item.webhook_status === null ? '' : String(item.webhook_status),
      item.webhook_error ?? '',
      String(item.retry_count),
      item.retried_from_event_id ?? '',
      item.request_id ?? '',
      item.trace_id ?? '',
      item.message,
      item.delivered_at,
      item.created_at,
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function isSystemActor(currentUser: AuthenticatedUser) {
  return currentUser.id.startsWith('system-');
}

function normalizeSecurityOperationNotificationStatus(value: unknown): SecurityOperationAlertNotificationStatus {
  if (value === 'SENT' || value === 'PARTIAL' || value === 'SKIPPED' || value === 'FAILED') return value;
  return 'SKIPPED';
}

function isRetryableSecurityOperationNotification(status: SecurityOperationAlertNotificationStatus) {
  return status === 'FAILED' || status === 'PARTIAL';
}

function moduleSummary(input: {
  key: SecurityCenterModuleSummary['key'];
  title: string;
  description: string;
  href: string;
  permission: SecurityCenterModuleSummary['permission'];
  status: SecurityCenterModuleSummary['status'];
  primary: SecurityCenterMetric;
  secondary: SecurityCenterMetric;
  action: string;
}): SecurityCenterModuleSummary {
  return {
    key: input.key,
    title: input.title,
    description: input.description,
    href: input.href,
    permission: input.permission,
    status: input.status,
    primary_metric: input.primary,
    secondary_metric: input.secondary,
    action_label: input.action,
  };
}

function metric(label: string, value: string | number, helper: string): SecurityCenterMetric {
  return {
    label,
    value: String(value),
    helper,
  };
}

function mapEvaluation(item: EvaluationRecord): SecurityPolicyEvaluationItem {
  return {
    id: item.id,
    tenant_id: item.tenantId,
    request_id: item.requestId,
    trace_id: item.traceId,
    subject: normalizeJsonObjectOutput(item.subject) ?? {},
    resource: normalizeJsonObjectOutput(item.resource) ?? {},
    action: item.action,
    decision: normalizeDecision(item.decision),
    matched_policy_id: item.matchedPolicyId,
    matched_policy_code: item.matchedPolicyCode,
    matched_policy_name: item.matchedPolicy?.name ?? null,
    reason: item.reason,
    context: normalizeJsonObjectOutput(item.context),
    created_at: item.createdAt.toISOString(),
    created_by: item.operator
      ? {
          id: item.operator.id,
          name: item.operator.name,
          email: item.operator.email,
        }
      : null,
  };
}

function mapDedicatedSecurityEvent(item: DedicatedSecurityEventRecord): SecurityCenterEventDetail {
  const source = normalizeDedicatedSecurityEventSource(item.source);
  const severity = normalizeSecurityRiskLevel(item.severity);
  const traceId = item.traceId;

  return {
    id: item.id,
    source,
    title: item.title,
    reason: item.reason,
    resource_type: item.resourceType,
    resource_id: item.resourceId,
    action: item.action,
    matched_code: item.matchedCode,
    path: item.path,
    method: item.method,
    status_code: item.statusCode,
    request_id: item.requestId,
    trace_id: traceId,
    occurred_at: item.occurredAt.toISOString(),
    severity,
    has_trace: Boolean(traceId),
    source_record_type: normalizeSecurityEventRecordType(item.sourceRecordType),
    source_record_id: item.sourceRecordId,
    subject: normalizeJsonObjectOutput(item.subject),
    resource: normalizeJsonObjectOutput(item.resource),
    context: normalizeJsonObjectOutput(item.context),
    request_summary: normalizeJsonObjectOutput(item.requestSummary),
    matched_policy: item.matchedPolicyId || item.matchedPolicyCode || item.matchedPolicyName
      ? {
          id: item.matchedPolicyId,
          code: item.matchedPolicyCode,
          name: item.matchedPolicyName,
        }
      : null,
    operator: item.user
      ? {
          id: item.user.id,
          name: item.user.name,
          email: item.user.email,
        }
      : null,
    ip: item.ip,
    user_agent: item.userAgent,
    error_message: item.errorMessage,
  };
}

function mapOperationDenial(item: OperationSecurityEventRecord): SecurityCenterEventDetail {
  const summary = normalizeJsonObjectOutput(item.requestSummary);
  const source = normalizeDenialSource(summary?.guard_source);
  const traceId = stringValue(summary?.trace_id);

  return {
    id: `operation:${item.id}`,
    source,
    title: `${denialSourceLabel(summary?.guard_source)} 拒绝`,
    reason: item.errorMessage ?? '安全访问被拒绝',
    resource_type: stringValue(summary?.resource_type),
    resource_id: stringValue(summary?.resource_id),
    action: stringValue(summary?.action),
    matched_code: stringValue(summary?.matched_code),
    path: item.path,
    method: item.method,
    status_code: item.statusCode,
    request_id: item.requestId,
    trace_id: traceId,
    occurred_at: item.createdAt.toISOString(),
    severity: securityEventSeverity(item.statusCode, source),
    has_trace: Boolean(traceId),
    source_record_type: 'operation_log',
    source_record_id: item.id,
    subject: normalizeJsonObjectOutput(summary?.subject),
    resource: normalizeJsonObjectOutput(summary?.resource),
    context: normalizeJsonObjectOutput(summary?.context),
    request_summary: summary,
    matched_policy: summary?.matched_code
      ? {
          id: null,
          code: stringValue(summary.matched_code),
          name: null,
        }
      : null,
    operator: item.user
      ? {
          id: item.user.id,
          name: item.user.name,
          email: item.user.email,
        }
      : null,
    ip: item.ip,
    user_agent: item.userAgent,
    error_message: item.errorMessage,
  };
}

function mapPolicyDenial(
  item: PolicySecurityEventRecord,
): SecurityCenterEventDetail {
  const resource = normalizeJsonObjectOutput(item.resource);
  const context = normalizeJsonObjectOutput(item.context);
  const traceId = item.traceId;

  return {
    id: `policy:${item.id}`,
    source: 'SECURITY_POLICY',
    title: '安全策略拒绝',
    reason: item.reason,
    resource_type: stringValue(resource?.resource_type ?? resource?.type),
    resource_id: stringValue(resource?.id),
    action: item.action,
    matched_code: item.matchedPolicyCode ?? item.matchedPolicy?.code ?? null,
    path: stringValue(context?.path) ?? '/security-policies/evaluations',
    method: stringValue(context?.method) ?? 'EVALUATE',
    status_code: 403,
    request_id: item.requestId,
    trace_id: traceId,
    occurred_at: item.createdAt.toISOString(),
    severity: 'MEDIUM',
    has_trace: Boolean(traceId),
    source_record_type: 'security_policy_evaluation',
    source_record_id: item.id,
    subject: normalizeJsonObjectOutput(item.subject),
    resource,
    context,
    request_summary: null,
    matched_policy: item.matchedPolicyId || item.matchedPolicyCode || item.matchedPolicy
      ? {
          id: item.matchedPolicyId,
          code: item.matchedPolicyCode ?? item.matchedPolicy?.code ?? null,
          name: item.matchedPolicy?.name ?? null,
        }
      : null,
    operator: item.operator
      ? {
          id: item.operator.id,
          name: item.operator.name,
          email: item.operator.email,
        }
      : null,
    ip: stringValue(context?.ip),
    user_agent: stringValue(context?.user_agent),
    error_message: item.reason,
  };
}

function mapPlatformSecurityEvent(item: PlatformSecurityEventRecord): SecurityCenterEventDetail {
  const payload = normalizeJsonObjectOutput(item.payloadJson);
  const filter = normalizeJsonObjectOutput(payload?.filter);
  const exportedCount = typeof payload?.exported_count === 'number' ? payload.exported_count : 0;

  return {
    id: `platform:${item.id}`,
    source: 'APPROVAL_WORKBENCH',
    title: '审批工作台导出',
    reason: item.summary ?? `统一安全审批工作台导出 ${exportedCount} 条记录。`,
    resource_type: item.resourceType,
    resource_id: item.resourceId,
    action: 'export',
    matched_code: stringValue(filter?.type ?? filter?.status ?? filter?.risk_domain),
    path: '/security-center/approval-workbench/export',
    method: 'GET',
    status_code: item.status === 'SUCCESS' ? 200 : 500,
    request_id: item.requestId ?? '',
    trace_id: item.traceId,
    occurred_at: item.occurredAt.toISOString(),
    severity: exportedCount >= 1000 ? 'MEDIUM' : 'LOW',
    has_trace: Boolean(item.traceId),
    source_record_type: 'platform_event',
    source_record_id: item.id,
    subject: item.user
      ? {
          user_id: item.user.id,
          name: item.user.name,
          email: item.user.email,
        }
      : null,
    resource: {
      resource_type: item.resourceType,
      resource_id: item.resourceId,
    },
    context: filter
      ? {
          filter,
          exported_count: exportedCount,
        }
      : {
          exported_count: exportedCount,
        },
    request_summary: payload,
    matched_policy: null,
    operator: item.user
      ? {
          id: item.user.id,
          name: item.user.name,
          email: item.user.email,
        }
      : null,
    ip: null,
    user_agent: null,
    error_message: item.status === 'SUCCESS' ? null : item.summary,
  };
}

function stripEventDetail(event: SecurityCenterEventDetail): SecurityCenterEventListItem {
  return {
    id: event.id,
    source: event.source,
    title: event.title,
    reason: event.reason,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    action: event.action,
    matched_code: event.matched_code,
    path: event.path,
    method: event.method,
    status_code: event.status_code,
    request_id: event.request_id,
    trace_id: event.trace_id,
    occurred_at: event.occurred_at,
    severity: event.severity,
    has_trace: event.has_trace,
    source_record_type: event.source_record_type,
    source_record_id: event.source_record_id,
  };
}

function stripSecurityCenterDenial(event: SecurityCenterEventDetail): SecurityCenterDenialItem {
  const { severity, has_trace, source_record_type, source_record_id, ...denial } = stripEventDetail(event);
  void severity;
  void has_trace;
  void source_record_type;
  void source_record_id;
  return denial;
}

function normalizeDenialSource(value: unknown): SecurityCenterDenialItem['source'] {
  if (value === 'DATA_SCOPE' || value === 'RESOURCE_ACL' || value === 'SECURITY_POLICY') return value;
  return 'OPERATION';
}

function denialSourceLabel(value: unknown) {
  switch (normalizeDenialSource(value)) {
    case 'DATA_SCOPE':
      return '数据权限';
    case 'RESOURCE_ACL':
      return '资源授权';
    case 'SECURITY_POLICY':
      return '安全策略';
    case 'OPERATION':
      return '操作审计';
  }
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function normalizeEventSource(value: string | undefined): SecurityCenterEventSource | null {
  if (
    value === 'DATA_SCOPE' ||
    value === 'RESOURCE_ACL' ||
    value === 'SECURITY_POLICY' ||
    value === 'OPERATION' ||
    value === 'APPROVAL_WORKBENCH'
  ) {
    return value;
  }
  return null;
}

function normalizeDedicatedSecurityEventSource(value: string): SecurityCenterEventSource {
  if (
    value === 'DATA_SCOPE' ||
    value === 'RESOURCE_ACL' ||
    value === 'SECURITY_POLICY' ||
    value === 'OPERATION' ||
    value === 'APPROVAL_WORKBENCH'
  ) {
    return value;
  }
  return 'OPERATION';
}

function normalizeSecurityEventRecordType(value: string): SecurityCenterEventListItem['source_record_type'] {
  if (
    value === 'security_event' ||
    value === 'operation_log' ||
    value === 'security_policy_evaluation' ||
    value === 'platform_event'
  ) {
    return value;
  }
  return 'security_event';
}

function normalizeEventWindow(value: string | undefined): SecurityCenterEventWindow {
  if (value === '1h' || value === '7d' || value === '30d') return value;
  return '24h';
}

function eventWindowStart(window: SecurityCenterEventWindow) {
  const now = new Date();
  if (window === '1h') {
    now.setHours(now.getHours() - 1);
    return now;
  }
  if (window === '7d') {
    now.setDate(now.getDate() - 7);
    return now;
  }
  if (window === '30d') {
    now.setDate(now.getDate() - 30);
    return now;
  }
  now.setHours(now.getHours() - 24);
  return now;
}

function securityEventSeverity(
  statusCode: number,
  source: SecurityCenterEventSource,
): SecurityCenterRiskLevel {
  if (statusCode >= 500) return 'HIGH';
  if (source === 'SECURITY_POLICY' || source === 'RESOURCE_ACL') return 'MEDIUM';
  return 'LOW';
}

function normalizeDecision(value: string): SecurityPolicyDecision {
  if (value === 'ALLOW' || value === 'DENY' || value === 'NO_MATCH') return value;
  return 'NO_MATCH';
}

function normalizeJsonObjectOutput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function configChangePathFilters(): Prisma.OperationLogWhereInput[] {
  return ['agents', 'model-providers', 'models', 'prompt-templates', 'knowledge-bases', 'tools', 'users', 'tenants'].map(
    (prefix) => ({
      path: {
        contains: prefix,
      },
    }),
  );
}

function normalizeMonitorModule(module: string): MonitorModule {
  if (
    module === 'agent' ||
    module === 'prompt' ||
    module === 'model' ||
    module === 'knowledge' ||
    module === 'tool' ||
    module === 'conversation' ||
    module === 'user' ||
    module === 'tenant' ||
    module === 'auth' ||
    module === 'system'
  ) {
    return module;
  }

  if (module.includes('agent')) return 'agent';
  if (module.includes('prompt')) return 'prompt';
  if (module.includes('model')) return 'model';
  if (module.includes('knowledge')) return 'knowledge';
  if (module.includes('tool')) return 'tool';
  if (module.includes('conversation')) return 'conversation';
  if (module.includes('user')) return 'user';
  if (module.includes('tenant')) return 'tenant';
  if (module.includes('auth')) return 'auth';

  return 'system';
}

function ratioPercent(success: number, total: number) {
  if (total === 0) return 100;
  return Number(((success / total) * 100).toFixed(1));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return sorted[index] ?? null;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
