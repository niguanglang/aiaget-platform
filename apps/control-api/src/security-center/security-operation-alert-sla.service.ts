import { BadRequestException, Inject, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';

import type {
  PaginatedResult,
  SecurityCenterOperationalAlert,
  CreateSecurityOperationAlertSlaDeadLetterAuditArchiveResult,
  SecurityOperationAlertNotificationChannel,
  SecurityOperationAlertNotificationStatus,
  SecurityOperationAlertSlaDeadLetterAction,
  SecurityOperationAlertSlaDeadLetterActionResult,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview,
  SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem,
  SecurityOperationAlertSlaDeadLetterAuditArchiveItem,
  SecurityOperationAlertSlaDeadLetterAuditArchiveListResult,
  SecurityOperationAlertSlaDeadLetterAuditItem,
  SecurityOperationAlertSlaDeadLetterDispositionStatus,
  SecurityOperationAlertSlaDeadLetterItem,
  SecurityOperationAlertSlaDeadLetterOverview,
  SecurityOperationAlertSlaItem,
  SecurityOperationAlertSlaNotificationItem,
  SecurityOperationAlertSlaNotificationOverview,
  SecurityOperationAlertSlaNotificationRetryOverview,
  SecurityOperationAlertSlaNotificationRetryTaskRunResult,
  SecurityOperationAlertSlaNotificationResult,
  SecurityOperationAlertSlaOverview,
  SecurityOperationAlertSlaSubscriptionPolicy,
  SecurityOperationAlertSlaStatus,
  SecurityOperationAlertSlaTaskRunResult,
  StorageDownloadUrlResult,
} from '@aiaget/shared-types';

import type { AuthenticatedUser } from '../common/types/request-context';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { ReviewToolApprovalDto } from '../approvals/dto/review-tool-approval.dto';
import type { ListSecurityOperationAlertSlaDeadLetterAuditsDto } from './dto/list-security-operation-alert-sla-dead-letter-audits.dto';
import { SecurityCenterService } from './security-center.service';

const ENV_POLICY = normalizePolicy({
  enabled: process.env.SECURITY_OPERATION_ALERT_SLA_ENABLED !== 'false',
  scanIntervalMs: clampInteger(process.env.SECURITY_OPERATION_ALERT_SLA_TASK_INTERVAL_MS, 10_000, 3_600_000, 60_000),
  dueMinutes: clampInteger(process.env.SECURITY_OPERATION_ALERT_SLA_DUE_MINUTES, 5, 10_080, 120),
  warningMinutes: clampInteger(process.env.SECURITY_OPERATION_ALERT_SLA_WARNING_MINUTES, 1, 10_080, 30),
  autoEscalateEnabled: process.env.SECURITY_OPERATION_ALERT_SLA_AUTO_ESCALATE_ENABLED !== 'false',
  lookbackHours: clampInteger(process.env.SECURITY_OPERATION_ALERT_SLA_LOOKBACK_HOURS, 1, 720, 24),
  source: 'ENVIRONMENT' as const,
});
const ENV_SUBSCRIPTION_POLICY = {
  enabled: process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_ENABLED !== 'false',
  channels: normalizeNotificationChannels(process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_CHANNELS?.split(',')),
  defaultTargets: normalizeTargetList(process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_DEFAULT_TARGETS, [
    '安全管理员',
  ]),
  highRiskTargets: normalizeTargetList(process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_HIGH_RISK_TARGETS, [
    '租户管理员',
    '安全管理员',
    '审计员',
  ]),
  archiveTargets: normalizeTargetList(process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_ARCHIVE_TARGETS, [
    '安全管理员',
    '审计员',
  ]),
  source: 'ENVIRONMENT' as const,
};
const ENV_NOTIFICATION_RETRY_POLICY = {
  autoRetryEnabled: process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_RETRY_ENABLED !== 'false',
  retryIntervalMs: clampInteger(process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_RETRY_INTERVAL_MS, 10_000, 3_600_000, 60_000),
  retryBatchSize: clampInteger(process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_RETRY_BATCH_SIZE, 1, 30, 8),
  maxRetryCount: clampInteger(process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_MAX_RETRY_COUNT, 1, 10, 3),
  retryBackoffSeconds: clampInteger(process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_RETRY_BACKOFF_SECONDS, 1, 3600, 60),
  lookbackHours: clampInteger(process.env.SECURITY_OPERATION_ALERT_SLA_NOTIFICATION_RETRY_LOOKBACK_HOURS, 1, 720, 24),
  source: 'ENVIRONMENT' as const,
};
const TASK_REQUEST_ID_PREFIX = 'security_operation_alert_sla_task';
const SECURITY_OPERATION_ALERT_SLA_WEBHOOK_TIMEOUT_MS = 5000;
const DEAD_LETTER_AUDIT_ARCHIVE_PREFIX = 'audit-archives/security-sla-dead-letter-audits';
const DEAD_LETTER_AUDIT_ARCHIVE_DOWNLOAD_EXPIRES_IN = 300;

interface OperationAlertSlaPolicy {
  enabled: boolean;
  scanIntervalMs: number;
  dueMinutes: number;
  warningMinutes: number;
  autoEscalateEnabled: boolean;
  lookbackHours: number;
  source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
}

interface OperationAlertSlaSubscriptionPolicyInternal {
  enabled: boolean;
  channels: SecurityOperationAlertNotificationChannel[];
  defaultTargets: string[];
  highRiskTargets: string[];
  archiveTargets: string[];
  source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
}

interface OperationAlertSlaNotificationRetryPolicy {
  autoRetryEnabled: boolean;
  retryIntervalMs: number;
  retryBatchSize: number;
  maxRetryCount: number;
  retryBackoffSeconds: number;
  lookbackHours: number;
  source: 'SYSTEM_SETTING' | 'ENVIRONMENT';
}

@Injectable()
export class SecurityOperationAlertSlaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SecurityOperationAlertSlaService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastTickAt: Date | null = null;
  private retryRunning = false;
  private lastRetryTickAt: Date | null = null;
  private lastAutoEscalationResult: SecurityOperationAlertSlaTaskRunResult | null = null;
  private lastNotificationResult: SecurityOperationAlertSlaNotificationResult | null = null;
  private lastNotificationRetryResult: SecurityOperationAlertSlaNotificationRetryTaskRunResult | null = null;
  private lastDeadLetterActionResult: SecurityOperationAlertSlaDeadLetterActionResult | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SecurityCenterService) private readonly securityCenter: SecurityCenterService,
    @Inject(StorageService) private readonly storageService: StorageService,
  ) {}

  onModuleInit() {
    if (!ENV_POLICY.enabled && !ENV_NOTIFICATION_RETRY_POLICY.autoRetryEnabled) return;

    this.timer = setInterval(() => {
      void this.runScheduledTick().catch((error) => {
        const message = error instanceof Error ? error.message : '审批与归档告警 SLA 定时任务失败。';
        this.logger.warn(message);
      });
    }, Math.min(ENV_POLICY.scanIntervalMs, ENV_NOTIFICATION_RETRY_POLICY.retryIntervalMs));
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async getOverview(currentUser: AuthenticatedUser): Promise<SecurityOperationAlertSlaOverview> {
    const policy = await this.loadPolicy(currentUser.tenantId);
    const alerts = await this.securityCenter.listCurrentOperationAlerts(currentUser);
    const autoEscalations = await this.loadAutoEscalationEvents(currentUser.tenantId);
    const items = buildSlaItems(alerts, autoEscalations, policy);

    return {
      generated_at: new Date().toISOString(),
      scheduler_enabled: policy.enabled && policy.autoEscalateEnabled,
      running: this.running,
      last_tick_at: this.lastTickAt?.toISOString() ?? null,
      next_tick_after_seconds: policy.enabled && policy.autoEscalateEnabled ? Math.ceil(policy.scanIntervalMs / 1000) : null,
      policy: mapPolicy(policy),
      summary: buildSlaSummary(items),
      items,
      last_auto_escalation_result: this.lastAutoEscalationResult,
    };
  }

  async runEscalation(currentUser: AuthenticatedUser): Promise<SecurityOperationAlertSlaTaskRunResult> {
    const result = await this.runEscalationForTenant(currentUser.tenantId, {
      userId: currentUser.id,
      requestId: currentUser.requestId ?? buildRequestId('manual_escalation'),
      traceId: currentUser.traceId ?? null,
    });
    await this.recordTaskEvent(
      currentUser.tenantId,
      currentUser.id,
      'platform.security.approval_operation_alert_sla.manual_escalation_scan',
      result,
      currentUser.requestId ?? null,
      currentUser.traceId ?? null,
    );

    return result;
  }

  async getNotificationOverview(currentUser: AuthenticatedUser): Promise<SecurityOperationAlertSlaNotificationOverview> {
    const [slaOverview, subscriptionPolicy, notifications, webhookConfigured] = await Promise.all([
      this.getOverview(currentUser),
      this.loadSubscriptionPolicy(currentUser.tenantId),
      this.loadSlaNotificationItems(currentUser.tenantId),
      this.hasExternalWebhook(currentUser.tenantId),
    ]);
    const notifiedAlertIds = new Set(notifications.map((item) => item.alert_id));
    const pendingOverdue = slaOverview.items.filter(
      (item) => item.sla_status === 'OVERDUE' && item.status !== 'CLOSED' && !notifiedAlertIds.has(item.alert_id),
    );

    return {
      generated_at: new Date().toISOString(),
      policy: mapSubscriptionPolicy(subscriptionPolicy, webhookConfigured),
      summary: buildNotificationSummary(notifications, pendingOverdue.length),
      items: notifications,
      last_notification_result: this.lastNotificationResult,
    };
  }

  async notifyOverdue(currentUser: AuthenticatedUser): Promise<SecurityOperationAlertSlaNotificationResult> {
    const result = await this.notifyOverdueForTenant(currentUser.tenantId, {
      userId: currentUser.id,
      requestId: currentUser.requestId ?? buildRequestId('manual_notify_overdue'),
      traceId: currentUser.traceId ?? null,
    });

    return result;
  }

  async getNotificationRetryOverview(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaNotificationRetryOverview> {
    const policy = await this.loadNotificationRetryPolicy(currentUser.tenantId);
    const notifications = await this.loadRecentSlaNotificationItems(currentUser.tenantId, policy);
    const retryableItems = eligibleSlaNotificationRetries(notifications, policy);
    const deadLetterItems = deadLetterSlaNotifications(notifications, policy);
    const oldestRetryableAt = retryableItems
      .map((item) => item.delivered_at)
      .sort((left, right) => Date.parse(left) - Date.parse(right))[0];
    const lastDeadLetterAt = deadLetterItems
      .map((item) => item.delivered_at)
      .sort((left, right) => Date.parse(right) - Date.parse(left))[0];

    return {
      generated_at: new Date().toISOString(),
      scheduler_enabled: policy.autoRetryEnabled,
      running: this.retryRunning,
      last_tick_at: this.lastRetryTickAt?.toISOString() ?? null,
      next_tick_after_seconds: policy.autoRetryEnabled ? Math.ceil(policy.retryIntervalMs / 1000) : null,
      policy: mapNotificationRetryPolicy(policy),
      summary: {
        pending_auto_retry_count: retryableItems.length,
        failed_notification_count: notifications.filter((item) => item.status === 'FAILED').length,
        partial_notification_count: notifications.filter((item) => item.status === 'PARTIAL').length,
        retried_notification_count: notifications.filter((item) => item.retry_count > 0 || item.retried_from_event_id).length,
        dead_letter_count: deadLetterItems.length,
        oldest_retryable_at: oldestRetryableAt ?? null,
        last_dead_letter_at: lastDeadLetterAt ?? null,
      },
      retryable_items: retryableItems.slice(0, policy.retryBatchSize * 2),
      dead_letter_items: deadLetterItems.slice(0, 20),
      last_auto_retry_result: this.lastNotificationRetryResult,
    };
  }

  async runNotificationAutoRetry(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaNotificationRetryTaskRunResult> {
    return this.runNotificationAutoRetryForTenant(currentUser.tenantId, {
      userId: currentUser.id,
      requestId: currentUser.requestId ?? buildRequestId('manual_sla_notification_retry'),
      traceId: currentUser.traceId ?? null,
      eventType: 'platform.security.approval_operation_alert_sla.notification_retry.manual_scan',
    });
  }

  async retryNotification(
    currentUser: AuthenticatedUser,
    notificationEventId: string,
  ): Promise<SecurityOperationAlertSlaNotificationItem> {
    return this.retrySlaNotificationEvent(currentUser.tenantId, notificationEventId, {
      userId: currentUser.id,
      requestId: currentUser.requestId ?? buildRequestId('manual_sla_notification_retry_event'),
      traceId: currentUser.traceId ?? null,
    });
  }

  async getDeadLetterOverview(currentUser: AuthenticatedUser): Promise<SecurityOperationAlertSlaDeadLetterOverview> {
    const policy = await this.loadNotificationRetryPolicy(currentUser.tenantId);
    const notifications = await this.loadRecentSlaNotificationItems(currentUser.tenantId, policy);
    const actionEvents = await this.loadDeadLetterActionEvents(currentUser.tenantId);
    const items = applyDeadLetterActions(deadLetterSlaNotifications(notifications, policy), actionEvents);
    const oldestOpenAt = items
      .filter((item) => item.disposition_status === 'OPEN' || item.disposition_status === 'CLAIMED')
      .map((item) => item.delivered_at)
      .sort((left, right) => Date.parse(left) - Date.parse(right))[0];
    const lastActionAt = items
      .map((item) => item.handled_at)
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => Date.parse(right) - Date.parse(left))[0];

    return {
      generated_at: new Date().toISOString(),
      summary: {
        total_count: items.length,
        open_count: items.filter((item) => item.disposition_status === 'OPEN').length,
        claimed_count: items.filter((item) => item.disposition_status === 'CLAIMED').length,
        requeued_count: items.filter((item) => item.disposition_status === 'REQUEUED').length,
        closed_count: items.filter((item) => item.disposition_status === 'CLOSED').length,
        oldest_open_at: oldestOpenAt ?? null,
        last_action_at: lastActionAt ?? null,
      },
      items,
      last_action_result: this.lastDeadLetterActionResult,
    };
  }

  async handleDeadLetter(
    currentUser: AuthenticatedUser,
    notificationEventId: string,
    input: {
      action: SecurityOperationAlertSlaDeadLetterAction;
      note?: string | null;
    },
  ): Promise<SecurityOperationAlertSlaDeadLetterActionResult> {
    const policy = await this.loadNotificationRetryPolicy(currentUser.tenantId);
    const event = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId: currentUser.tenantId,
        id: notificationEventId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert_sla.notification_sent',
      },
    });

    if (!event) {
      throw new NotFoundException('审批与归档告警 SLA 死信事件不存在。');
    }

    const notification = markSlaNotificationDeadLetter(mapSlaNotificationEvent(event), policy);
    if (!notification.dead_lettered) {
      throw new BadRequestException('该 SLA 通知尚未进入死信，不需要执行死信处置。');
    }

    let deliveryEventId: string | null = null;
    if (input.action === 'REQUEUE') {
      const retryEvent = await this.requeueDeadLetterNotification(currentUser.tenantId, notification, {
        userId: currentUser.id,
        requestId: currentUser.requestId ?? buildRequestId('manual_sla_dead_letter_requeue'),
        traceId: currentUser.traceId ?? null,
      });
      deliveryEventId = retryEvent.notification_event_id;
    }

    const result = await this.recordDeadLetterActionEvent(currentUser.tenantId, currentUser.id, notification, {
      action: input.action,
      note: input.note ?? null,
      deliveryEventId,
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
    });
    this.lastDeadLetterActionResult = result;

    return result;
  }

  async listDeadLetterAudits(
    currentUser: AuthenticatedUser,
    query: ListSecurityOperationAlertSlaDeadLetterAuditsDto,
  ): Promise<PaginatedResult<SecurityOperationAlertSlaDeadLetterAuditItem>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.page_size ?? 8);
    const items = await this.loadFilteredDeadLetterAuditItems(currentUser.tenantId, query);

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      page_size: pageSize,
      total: items.length,
    };
  }

  async exportDeadLetterAudits(
    currentUser: AuthenticatedUser,
    query: ListSecurityOperationAlertSlaDeadLetterAuditsDto,
  ): Promise<string> {
    const items = await this.loadFilteredDeadLetterAuditItems(currentUser.tenantId, query);

    return buildDeadLetterAuditCsv(items);
  }

  async createDeadLetterAuditArchive(
    currentUser: AuthenticatedUser,
    query: ListSecurityOperationAlertSlaDeadLetterAuditsDto,
  ): Promise<CreateSecurityOperationAlertSlaDeadLetterAuditArchiveResult> {
    const csv = await this.exportDeadLetterAudits(currentUser, query);
    const createdAt = new Date();
    const archiveKey = `${DEAD_LETTER_AUDIT_ARCHIVE_PREFIX}/${createdAt.toISOString().replace(/[:.]/g, '-')}.csv`;
    const item = await this.storageService.putTenantObject({
      tenantId: currentUser.tenantId,
      key: archiveKey,
      body: `\uFEFF${csv}`,
      contentType: 'text/csv; charset=utf-8',
      metadata: {
        archive_type: 'security_sla_dead_letter_audit',
        created_by: currentUser.id,
        action: query.action ?? '',
        disposition_status: query.disposition_status ?? '',
        keyword: query.keyword ?? '',
      },
    });

    return {
      item: mapDeadLetterAuditArchive(item),
    };
  }

  async listDeadLetterAuditArchives(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveListResult> {
    const items = (await this.storageService.listTenantObjects({
      tenantId: currentUser.tenantId,
      prefix: DEAD_LETTER_AUDIT_ARCHIVE_PREFIX,
      limit: 100,
    })).map(mapDeadLetterAuditArchive);

    return {
      items,
      total: items.length,
      summary: {
        archive_count: items.length,
        total_size_bytes: items.reduce((sum, item) => sum + item.size_bytes, 0),
      },
    };
  }

  async getDeadLetterAuditArchiveDownloadUrl(
    currentUser: AuthenticatedUser,
    archiveId: string,
  ): Promise<StorageDownloadUrlResult> {
    const key = deadLetterAuditArchiveKeyFromId(archiveId);

    return this.storageService.getTenantObjectDownloadUrl(
      currentUser.tenantId,
      key,
      DEAD_LETTER_AUDIT_ARCHIVE_DOWNLOAD_EXPIRES_IN,
    );
  }

  async deleteDeadLetterAuditArchive(
    currentUser: AuthenticatedUser,
    archiveId: string,
  ): Promise<{ success: boolean; approval_id: string }> {
    const key = deadLetterAuditArchiveKeyFromId(archiveId);
    const sourceId = deadLetterAuditArchiveSourceIdFromKey(key);
    const existing = await this.findPendingDeadLetterAuditArchiveDeleteApproval(currentUser.tenantId, sourceId);

    if (existing) {
      return {
        success: true,
        approval_id: existing.id,
      };
    }

    const event = await this.recordDeadLetterAuditArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId,
      eventType: 'DELETE_REQUESTED',
      status: 'WARNING',
      severity: 'WARN',
      summary: 'SLA 死信审计归档删除待审批',
      note: '删除归档属于高危审计操作，已进入审批队列。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_id: archiveId,
        archive_key: key,
        archive_file_name: key.split('/').at(-1) ?? key,
      },
    });

    return {
      success: true,
      approval_id: event.id,
    };
  }

  async getDeadLetterAuditArchiveApprovalOverview(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview> {
    const items = await this.listDeadLetterAuditArchiveApprovals(currentUser);

    return {
      pending_count: items.filter((item) => item.status === 'PENDING').length,
      approved_count: items.filter((item) => item.status === 'APPROVED').length,
      rejected_count: items.filter((item) => item.status === 'REJECTED').length,
      applied_count: items.filter((item) => item.status === 'APPLIED').length,
    };
  }

  async listDeadLetterAuditArchiveApprovals(
    currentUser: AuthenticatedUser,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[]> {
    const events = await this.loadDeadLetterAuditArchiveDeleteEvents(currentUser.tenantId);
    return buildDeadLetterAuditArchiveDeleteApprovals(events);
  }

  async getDeadLetterAuditArchiveApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail> {
    const events = await this.loadDeadLetterAuditArchiveDeleteEvents(currentUser.tenantId);
    const item = buildDeadLetterAuditArchiveDeleteApprovals(events).find((approval) => approval.id === approvalId);

    if (!item) {
      throw new NotFoundException('SLA 死信审计归档删除审批不存在。');
    }

    return {
      ...item,
      audit_timeline: events
        .filter((event) => event.source_id === item.archive_id)
        .sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at)),
    };
  }

  async approveDeadLetterAuditArchiveApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    dto: ReviewToolApprovalDto,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail> {
    const detail = await this.getDeadLetterAuditArchiveApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('只有待审批的 SLA 死信审计归档删除申请可以批准。');
    }

    await this.recordDeadLetterAuditArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId: detail.archive_id,
      eventType: 'APPROVED',
      status: 'SUCCESS',
      severity: 'INFO',
      summary: 'SLA 死信审计归档删除已批准',
      note: nullableText(dto.decision_note),
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
        archive_size_bytes: detail.archive_size_bytes,
      },
    });

    await this.storageService.deleteTenantObject(currentUser.tenantId, detail.archive_key);

    await this.recordDeadLetterAuditArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId: detail.archive_id,
      eventType: 'DELETE_APPLIED',
      status: 'SUCCESS',
      severity: 'INFO',
      summary: 'SLA 死信审计归档删除已生效',
      note: '归档文件已从对象存储删除。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
        archive_size_bytes: detail.archive_size_bytes,
      },
    });

    return this.getDeadLetterAuditArchiveApproval(currentUser, approvalId);
  }

  async rejectDeadLetterAuditArchiveApproval(
    currentUser: AuthenticatedUser,
    approvalId: string,
    dto: ReviewToolApprovalDto,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDetail> {
    const detail = await this.getDeadLetterAuditArchiveApproval(currentUser, approvalId);
    if (detail.status !== 'PENDING') {
      throw new BadRequestException('只有待审批的 SLA 死信审计归档删除申请可以拒绝。');
    }

    await this.recordDeadLetterAuditArchiveEvent({
      tenantId: currentUser.tenantId,
      userId: currentUser.id,
      sourceId: detail.archive_id,
      eventType: 'REJECTED',
      status: 'WARNING',
      severity: 'WARN',
      summary: 'SLA 死信审计归档删除已拒绝',
      note: nullableText(dto.decision_note) ?? '归档删除申请已拒绝。',
      requestId: currentUser.requestId ?? null,
      traceId: currentUser.traceId ?? null,
      payload: {
        archive_key: detail.archive_key,
        archive_file_name: detail.archive_file_name,
        archive_size_bytes: detail.archive_size_bytes,
      },
    });

    return this.getDeadLetterAuditArchiveApproval(currentUser, approvalId);
  }

  private async loadFilteredDeadLetterAuditItems(
    tenantId: string,
    query: ListSecurityOperationAlertSlaDeadLetterAuditsDto,
  ) {
    const keyword = query.keyword?.trim().toLowerCase();

    const events = await this.loadDeadLetterActionEvents(tenantId);
    return events
      .map(mapDeadLetterAuditEvent)
      .filter((item): item is SecurityOperationAlertSlaDeadLetterAuditItem => Boolean(item))
      .filter((item) => !query.alert_category || item.alert_category === query.alert_category)
      .filter((item) => !query.action || item.action === query.action)
      .filter((item) => !query.disposition_status || item.disposition_status === query.disposition_status)
      .filter((item) => {
        if (!keyword) return true;
        return [
          item.event_id,
          item.notification_event_id,
          item.alert_id,
          item.alert_category,
          item.title,
          item.note,
          item.delivery_event_id,
          item.handled_by,
          item.request_id,
          item.trace_id,
        ].some((value) => value?.toLowerCase().includes(keyword));
      });
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
        if (policy.enabled && policy.autoEscalateEnabled) {
          this.lastAutoEscalationResult = await this.runEscalationForTenant(tenant.id, {
            userId: null,
            requestId: buildRequestId('scheduled_escalation'),
            traceId: null,
          });
          this.lastNotificationResult = await this.notifyOverdueForTenant(tenant.id, {
            userId: null,
            requestId: buildRequestId('scheduled_notify_overdue'),
            traceId: null,
          });
        }

        const retryPolicy = await this.loadNotificationRetryPolicy(tenant.id);
        if (!retryPolicy.autoRetryEnabled || this.retryRunning) continue;
        this.retryRunning = true;
        this.lastRetryTickAt = new Date();
        try {
          this.lastNotificationRetryResult = await this.runNotificationAutoRetryForTenant(tenant.id, {
            userId: null,
            requestId: buildRequestId('scheduled_sla_notification_retry'),
            traceId: null,
            eventType: 'platform.security.approval_operation_alert_sla.notification_retry.finished',
          });
        } finally {
          this.retryRunning = false;
        }
      }
    } finally {
      this.running = false;
    }
  }

  private async runEscalationForTenant(
    tenantId: string,
    context: {
      userId: string | null;
      requestId: string;
      traceId: string | null;
    },
  ): Promise<SecurityOperationAlertSlaTaskRunResult> {
    const startedAt = new Date();
    const policy = await this.loadPolicy(tenantId);
    if (!policy.enabled || !policy.autoEscalateEnabled) {
      return this.storeResult(buildTaskResult(startedAt, { skipped_count: 1 }));
    }

    const systemUser = buildSystemUser(tenantId, context.requestId);
    const alerts = await this.securityCenter.listCurrentOperationAlerts(systemUser);
    const autoEscalations = await this.loadAutoEscalationEvents(tenantId);
    const items = buildSlaItems(alerts, autoEscalations, policy);
    const candidates = items.filter((item) => item.sla_status === 'OVERDUE' && item.status !== 'ESCALATED' && item.status !== 'CLOSED');
    let escalatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let errorMessage: string | null = null;

    for (const item of candidates) {
      try {
        const alreadyEscalated = await this.prisma.platformEvent.findFirst({
          where: {
            tenantId,
            eventSource: 'security_center',
            resourceType: 'security_operation_alert',
            resourceId: item.alert_id,
            eventType: 'platform.security.approval_operation_alert.escalated',
          },
          select: {
            id: true,
          },
        });
        if (alreadyEscalated) {
          skippedCount += 1;
          continue;
        }

        await this.recordAutoEscalationEvent(tenantId, context.userId, item, context.requestId, context.traceId);
        escalatedCount += 1;
      } catch (error) {
        failedCount += 1;
        errorMessage = errorMessage ?? (error instanceof Error ? error.message : '审批与归档告警 SLA 自动升级失败。');
      }
    }

    const result = buildTaskResult(startedAt, {
      scanned_count: items.length,
      escalated_count: escalatedCount,
      skipped_count: skippedCount,
      failed_count: failedCount,
      error_message: errorMessage,
    });
    await this.recordTaskEvent(
      tenantId,
      context.userId,
      'platform.security.approval_operation_alert_sla.auto_escalation_finished',
      result,
      context.requestId,
      context.traceId,
    );

    return this.storeResult(result);
  }

  private async notifyOverdueForTenant(
    tenantId: string,
    context: {
      userId: string | null;
      requestId: string;
      traceId: string | null;
    },
  ): Promise<SecurityOperationAlertSlaNotificationResult> {
    const startedAt = new Date();
    const subscriptionPolicy = await this.loadSubscriptionPolicy(tenantId);
    if (!subscriptionPolicy.enabled) {
      return this.storeNotificationResult(buildNotificationResult(startedAt, { skipped_count: 1 }));
    }

    const systemUser = buildSystemUser(tenantId, context.requestId);
    const slaOverview = await this.getOverview(systemUser);
    const previousNotifications = await this.loadSlaNotificationItems(tenantId);
    const notifiedAlertIds = new Set(previousNotifications.map((item) => item.alert_id));
    const candidates = slaOverview.items.filter(
      (item) => item.sla_status === 'OVERDUE' && item.status !== 'CLOSED' && !notifiedAlertIds.has(item.alert_id),
    );
    const webhookUrl = subscriptionPolicy.channels.includes('WEBHOOK')
      ? await this.loadExternalWebhookUrl(tenantId)
      : null;
    let notifiedCount = 0;
    let sentCount = 0;
    let partialCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let errorMessage: string | null = null;

    for (const item of candidates) {
      const targets = slaNotificationTargets(item, subscriptionPolicy);
      try {
        const result = await this.recordSlaNotificationEvent({
          tenantId,
          userId: context.userId,
          item,
          targets,
          channels: subscriptionPolicy.channels,
          webhookUrl,
          requestId: context.requestId,
          traceId: context.traceId,
        });
        notifiedCount += 1;
        if (result.status === 'SENT') sentCount += 1;
        if (result.status === 'PARTIAL') partialCount += 1;
        if (result.status === 'FAILED') failedCount += 1;
        if (result.status === 'SKIPPED') skippedCount += 1;
      } catch (error) {
        failedCount += 1;
        errorMessage = errorMessage ?? (error instanceof Error ? error.message : '审批与归档告警 SLA 超时通知投递失败。');
      }
    }

    const result = buildNotificationResult(startedAt, {
      scanned_count: slaOverview.items.length,
      notified_count: notifiedCount,
      sent_count: sentCount,
      partial_count: partialCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      error_message: errorMessage,
    });
    await this.recordSlaNotificationTaskEvent(tenantId, context.userId, result, context.requestId, context.traceId);

    return this.storeNotificationResult(result);
  }

  private async loadPolicy(tenantId: string): Promise<OperationAlertSlaPolicy> {
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

    return normalizePolicy({
      enabled: booleanSetting(values.get('operation_alert_sla_enabled'), ENV_POLICY.enabled),
      scanIntervalMs: clampInteger(values.get('operation_alert_sla_scan_interval_ms'), 10_000, 3_600_000, ENV_POLICY.scanIntervalMs),
      dueMinutes: clampInteger(values.get('operation_alert_sla_due_minutes'), 5, 10_080, ENV_POLICY.dueMinutes),
      warningMinutes: clampInteger(values.get('operation_alert_sla_warning_minutes'), 1, 10_080, ENV_POLICY.warningMinutes),
      autoEscalateEnabled: booleanSetting(values.get('operation_alert_sla_auto_escalate_enabled'), ENV_POLICY.autoEscalateEnabled),
      lookbackHours: clampInteger(values.get('operation_alert_sla_lookback_hours'), 1, 720, ENV_POLICY.lookbackHours),
      source: 'SYSTEM_SETTING',
    });
  }

  private async loadSubscriptionPolicy(tenantId: string): Promise<OperationAlertSlaSubscriptionPolicyInternal> {
    const setting = await this.prisma.systemSetting.findFirst({
      where: {
        tenantId,
        category: 'NOTIFICATION',
        key: 'operation_alert_sla_subscription_policy',
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        value: true,
      },
    });
    const payload = jsonObjectOrNull(setting?.value ?? null);
    if (!payload) return ENV_SUBSCRIPTION_POLICY;

    return {
      enabled: booleanSetting(payload.enabled, ENV_SUBSCRIPTION_POLICY.enabled),
      channels: normalizeNotificationChannels(Array.isArray(payload.channels) ? payload.channels : undefined),
      defaultTargets: normalizeTargetArray(payload.default_targets, ENV_SUBSCRIPTION_POLICY.defaultTargets),
      highRiskTargets: normalizeTargetArray(payload.high_risk_targets, ENV_SUBSCRIPTION_POLICY.highRiskTargets),
      archiveTargets: normalizeTargetArray(payload.archive_targets, ENV_SUBSCRIPTION_POLICY.archiveTargets),
      source: 'SYSTEM_SETTING',
    };
  }

  private async loadAutoEscalationEvents(tenantId: string) {
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        resourceType: 'security_operation_alert',
        eventType: 'platform.security.approval_operation_alert.escalated',
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 1000,
    });

    return events.filter((event) => {
      const payload = jsonObjectOrNull(event.payloadJson);
      return payload?.auto_escalated === true;
    });
  }

  private storeResult(result: SecurityOperationAlertSlaTaskRunResult) {
    this.lastAutoEscalationResult = result;
    return result;
  }

  private storeNotificationResult(result: SecurityOperationAlertSlaNotificationResult) {
    this.lastNotificationResult = result;
    return result;
  }

  private storeNotificationRetryResult(result: SecurityOperationAlertSlaNotificationRetryTaskRunResult) {
    this.lastNotificationRetryResult = result;
    return result;
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

  private async hasExternalWebhook(tenantId: string) {
    return Boolean(await this.loadExternalWebhookUrl(tenantId));
  }

  private async loadSlaNotificationItems(tenantId: string): Promise<SecurityOperationAlertSlaNotificationItem[]> {
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert_sla.notification_sent',
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 100,
    });

    return events.map(mapSlaNotificationEvent);
  }

  private async loadRecentSlaNotificationItems(
    tenantId: string,
    policy: OperationAlertSlaNotificationRetryPolicy,
  ): Promise<SecurityOperationAlertSlaNotificationItem[]> {
    const since = new Date(Date.now() - policy.lookbackHours * 60 * 60 * 1000);
    const events = await this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert_sla.notification_sent',
        occurredAt: {
          gte: since,
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 300,
    });

    return events.map((event) => markSlaNotificationDeadLetter(mapSlaNotificationEvent(event), policy));
  }

  private async loadDeadLetterActionEvents(tenantId: string) {
    return this.prisma.platformEvent.findMany({
      where: {
        tenantId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert_sla.dead_letter_action',
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: 500,
    });
  }

  private async loadDeadLetterAuditArchiveDeleteEvents(
    tenantId: string,
  ): Promise<SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem[]> {
    const events = await this.prisma.platformEvent.findMany({
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

    return events.map(mapDeadLetterAuditArchiveApprovalEvent);
  }

  private async findPendingDeadLetterAuditArchiveDeleteApproval(tenantId: string, sourceId: string) {
    const events = (await this.loadDeadLetterAuditArchiveDeleteEvents(tenantId)).filter((event) => event.source_id === sourceId);
    const approval = buildDeadLetterAuditArchiveDeleteApprovals(events)[0] ?? null;
    return approval?.status === 'PENDING' ? approval : null;
  }

  private async recordDeadLetterAuditArchiveEvent(input: {
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
      DELETE_REQUESTED: 'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_requested',
      APPROVED: 'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_approved',
      REJECTED: 'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_rejected',
      DELETE_APPLIED: 'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_applied',
    } satisfies Record<typeof input.eventType, string>;

    return this.prisma.platformEvent.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        actorType: input.userId ? 'USER' : 'SYSTEM',
        resourceType: 'SECURITY_OPERATION_ALERT_SLA_DEAD_LETTER_AUDIT_ARCHIVE',
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

  private async recordSlaNotificationEvent(input: {
    tenantId: string;
    userId: string | null;
    item: SecurityOperationAlertSlaItem;
    targets: string[];
    channels: SecurityOperationAlertNotificationChannel[];
    webhookUrl: string | null;
    requestId: string;
    traceId: string | null;
    retryCount?: number;
    retriedFromEventId?: string | null;
  }): Promise<SecurityOperationAlertSlaNotificationItem> {
    const deliveredAt = new Date();
    const webhookSkipped = input.channels.includes('WEBHOOK') && !input.webhookUrl;
    const webhookResult = input.webhookUrl
      ? await deliverSlaNotificationWebhook(input.webhookUrl, input.item, input.targets)
      : null;
    const status = notificationStatus(input.channels, webhookResult, webhookSkipped);
    const message = slaNotificationMessage(status, input.channels, webhookSkipped);
    const event = await this.prisma.platformEvent.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        actorType: input.userId ? 'USER' : 'SYSTEM',
        resourceType: 'security_operation_alert',
        resourceId: input.item.alert_id,
        requestId: input.requestId,
        traceId: input.traceId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert_sla.notification_sent',
        status: status === 'FAILED' ? 'FAILED' : status === 'SKIPPED' ? 'SKIPPED' : 'SUCCESS',
        severity: status === 'FAILED' ? 'WARN' : 'INFO',
        securityLevel: 'INTERNAL',
        billable: false,
        summary: message,
        payloadJson: {
          alert_id: input.item.alert_id,
          alert_category: input.item.alert_category,
          title: input.item.title,
          severity: input.item.severity,
          metric: input.item.metric,
          href: input.item.href,
          sla_status: input.item.sla_status,
          overdue_minutes: input.item.overdue_minutes,
          due_at: input.item.due_at,
          status,
          channels: input.channels,
          targets: input.targets,
          webhook_status: webhookResult?.status ?? null,
          webhook_error: webhookResult?.error ?? null,
          retry_count: input.retryCount ?? 0,
          retried_from_event_id: input.retriedFromEventId ?? null,
          dead_lettered: false,
          dead_letter_reason: null,
          delivered_at: deliveredAt.toISOString(),
        },
        occurredAt: deliveredAt,
        sourceSystem: 'security_center',
        sourceId: `approval-operation-alert-sla-notify:${input.item.alert_id}:${deliveredAt.toISOString()}`,
        dedupeKey: null,
      },
    });

    return mapSlaNotificationEvent(event);
  }

  private async retrySlaNotificationEvent(
    tenantId: string,
    notificationEventId: string,
    context: {
      userId: string | null;
      requestId: string;
      traceId: string | null;
    },
  ): Promise<SecurityOperationAlertSlaNotificationItem> {
    const policy = await this.loadNotificationRetryPolicy(tenantId);
    const event = await this.prisma.platformEvent.findFirst({
      where: {
        tenantId,
        id: notificationEventId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert_sla.notification_sent',
      },
    });

    if (!event) {
      throw new NotFoundException('审批与归档告警 SLA 通知事件不存在。');
    }

    const notification = markSlaNotificationDeadLetter(mapSlaNotificationEvent(event), policy);
    if (!isRetryableSlaNotification(notification.status)) {
      throw new BadRequestException('只有失败或部分成功的 SLA 超时通知可以重试。');
    }
    if (notification.dead_lettered) {
      throw new BadRequestException(notification.dead_letter_reason ?? '该 SLA 超时通知已进入死信，需要人工处理。');
    }

    const item = notificationItemToSlaItem(notification);
    const webhookUrl = notification.channels.includes('WEBHOOK')
      ? await this.loadExternalWebhookUrl(tenantId)
      : null;

    return this.recordSlaNotificationEvent({
      tenantId,
      userId: context.userId,
      item,
      targets: notification.targets,
      channels: notification.channels.length ? notification.channels : ['IN_APP', 'WEBHOOK'],
      webhookUrl,
      requestId: context.requestId,
      traceId: context.traceId,
      retryCount: notification.retry_count + 1,
      retriedFromEventId: notification.notification_event_id,
    });
  }

  private async requeueDeadLetterNotification(
    tenantId: string,
    notification: SecurityOperationAlertSlaNotificationItem,
    context: {
      userId: string | null;
      requestId: string;
      traceId: string | null;
    },
  ): Promise<SecurityOperationAlertSlaNotificationItem> {
    const item = notificationItemToSlaItem(notification);
    const webhookUrl = notification.channels.includes('WEBHOOK')
      ? await this.loadExternalWebhookUrl(tenantId)
      : null;

    return this.recordSlaNotificationEvent({
      tenantId,
      userId: context.userId,
      item,
      targets: notification.targets,
      channels: notification.channels.length ? notification.channels : ['IN_APP', 'WEBHOOK'],
      webhookUrl,
      requestId: context.requestId,
      traceId: context.traceId,
      retryCount: 0,
      retriedFromEventId: notification.notification_event_id,
    });
  }

  private async runNotificationAutoRetryForTenant(
    tenantId: string,
    context: {
      userId: string | null;
      requestId: string;
      traceId: string | null;
      eventType: string;
    },
  ): Promise<SecurityOperationAlertSlaNotificationRetryTaskRunResult> {
    if (this.retryRunning && context.userId) {
      return this.storeNotificationRetryResult(buildNotificationRetryResult(new Date(), { skipped_count: 1 }));
    }

    const startedAt = new Date();
    const policy = await this.loadNotificationRetryPolicy(tenantId);
    if (!policy.autoRetryEnabled) {
      return this.storeNotificationRetryResult(buildNotificationRetryResult(startedAt, { skipped_count: 1 }));
    }

    if (context.userId) {
      this.retryRunning = true;
      this.lastRetryTickAt = new Date();
    }

    try {
      const notifications = await this.loadRecentSlaNotificationItems(tenantId, policy);
      const retryable = eligibleSlaNotificationRetries(notifications, policy).slice(0, policy.retryBatchSize);
      const deadLetters = deadLetterSlaNotifications(notifications, policy);
      let retriedCount = 0;
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      let errorMessage: string | null = null;

      for (const notification of retryable) {
        try {
          const result = await this.retrySlaNotificationEvent(tenantId, notification.notification_event_id, {
            userId: context.userId,
            requestId: context.requestId,
            traceId: context.traceId,
          });
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
          errorMessage = errorMessage ?? (error instanceof Error ? error.message : '审批与归档告警 SLA 通知自动重试失败。');
        }
      }

      const result = buildNotificationRetryResult(startedAt, {
        scanned_count: notifications.length,
        retried_count: retriedCount,
        success_count: successCount,
        failed_count: failedCount,
        skipped_count: skippedCount,
        dead_letter_count: deadLetters.length,
        error_message: errorMessage,
      });
      await this.recordSlaNotificationRetryTaskEvent(
        tenantId,
        context.userId,
        context.eventType,
        result,
        context.requestId,
        context.traceId,
      );

      return this.storeNotificationRetryResult(result);
    } finally {
      if (context.userId) {
        this.retryRunning = false;
      }
    }
  }

  private async recordAutoEscalationEvent(
    tenantId: string,
    userId: string | null,
    item: SecurityOperationAlertSlaItem,
    requestId: string,
    traceId: string | null,
  ) {
    const occurredAt = new Date();
    await this.prisma.platformEvent.create({
      data: {
        tenantId,
        userId,
        actorType: userId ? 'USER' : 'SYSTEM',
        resourceType: 'security_operation_alert',
        resourceId: item.alert_id,
        requestId,
        traceId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert.escalated',
        status: 'SUCCESS',
        severity: 'WARN',
        securityLevel: 'INTERNAL',
        billable: false,
        summary: `审批与归档告警 SLA 超时自动升级：${item.title}`,
        payloadJson: {
          alert_id: item.alert_id,
          alert_category: item.alert_category,
          title: item.title,
          severity: item.severity,
          metric: item.metric,
          href: item.href,
          action: 'ESCALATE',
          status: 'ESCALATED',
          note: `SLA 已超时 ${item.overdue_minutes} 分钟，系统自动升级。`,
          auto_escalated: true,
          triggered_at: item.triggered_at,
          due_at: item.due_at,
          overdue_minutes: item.overdue_minutes,
          occurred_at: occurredAt.toISOString(),
        },
        occurredAt,
        sourceSystem: 'security_center',
        sourceId: `approval-operation-alert-sla:${item.alert_id}:${occurredAt.toISOString()}`,
        dedupeKey: null,
      },
    });
  }

  private async recordTaskEvent(
    tenantId: string,
    userId: string | null,
    eventType: string,
    result: SecurityOperationAlertSlaTaskRunResult,
    requestId: string | null,
    traceId: string | null,
  ) {
    await this.prisma.platformEvent.create({
      data: {
        tenantId,
        userId,
        actorType: userId ? 'USER' : 'SYSTEM',
        resourceType: 'security_operation_alert_sla_task',
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

  private async recordSlaNotificationTaskEvent(
    tenantId: string,
    userId: string | null,
    result: SecurityOperationAlertSlaNotificationResult,
    requestId: string | null,
    traceId: string | null,
  ) {
    await this.prisma.platformEvent.create({
      data: {
        tenantId,
        userId,
        actorType: userId ? 'USER' : 'SYSTEM',
        resourceType: 'security_operation_alert_sla_notification_task',
        requestId,
        traceId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert_sla.notification_finished',
        status: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
        severity: result.status === 'FAILED' ? 'WARN' : 'INFO',
        securityLevel: 'INTERNAL',
        billable: false,
        summary: notificationTaskSummary(result),
        payloadJson: result as unknown as Prisma.InputJsonObject,
        sourceSystem: 'security_center',
        sourceId: 'sla_notification',
      },
    });
  }

  private async recordSlaNotificationRetryTaskEvent(
    tenantId: string,
    userId: string | null,
    eventType: string,
    result: SecurityOperationAlertSlaNotificationRetryTaskRunResult,
    requestId: string | null,
    traceId: string | null,
  ) {
    await this.prisma.platformEvent.create({
      data: {
        tenantId,
        userId,
        actorType: userId ? 'USER' : 'SYSTEM',
        resourceType: 'security_operation_alert_sla_notification_retry_task',
        requestId,
        traceId,
        eventSource: 'security_center',
        eventType,
        status: result.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
        severity: result.status === 'FAILED' || result.dead_letter_count > 0 ? 'WARN' : 'INFO',
        securityLevel: 'INTERNAL',
        billable: false,
        summary: notificationRetryTaskSummary(result),
        payloadJson: result as unknown as Prisma.InputJsonObject,
        sourceSystem: 'security_center',
        sourceId: result.task.toLowerCase(),
      },
    });
  }

  private async recordDeadLetterActionEvent(
    tenantId: string,
    userId: string | null,
    notification: SecurityOperationAlertSlaNotificationItem,
    input: {
      action: SecurityOperationAlertSlaDeadLetterAction;
      note: string | null;
      deliveryEventId: string | null;
      requestId: string | null;
      traceId: string | null;
    },
  ): Promise<SecurityOperationAlertSlaDeadLetterActionResult> {
    const occurredAt = new Date();
    const dispositionStatus = deadLetterDispositionFromAction(input.action);
    const event = await this.prisma.platformEvent.create({
      data: {
        tenantId,
        userId,
        actorType: userId ? 'USER' : 'SYSTEM',
        resourceType: 'security_operation_alert_sla_dead_letter',
        resourceId: notification.notification_event_id,
        requestId: input.requestId,
        traceId: input.traceId,
        eventSource: 'security_center',
        eventType: 'platform.security.approval_operation_alert_sla.dead_letter_action',
        status: 'SUCCESS',
        severity: input.action === 'CLOSE' ? 'INFO' : 'WARN',
        securityLevel: 'INTERNAL',
        billable: false,
        summary: deadLetterActionSummary(input.action, notification.title),
        payloadJson: {
          notification_event_id: notification.notification_event_id,
          alert_id: notification.alert_id,
          alert_category: notification.alert_category,
          title: notification.title,
          action: input.action,
          disposition_status: dispositionStatus,
          note: input.note,
          delivery_event_id: input.deliveryEventId,
          handled_by: userId,
          handled_at: occurredAt.toISOString(),
        },
        occurredAt,
        sourceSystem: 'security_center',
        sourceId: `approval-operation-alert-sla-dead-letter:${notification.notification_event_id}:${input.action}:${occurredAt.toISOString()}`,
        dedupeKey: null,
      },
    });

    return {
      notification_event_id: notification.notification_event_id,
      action: input.action,
      disposition_status: dispositionStatus,
      note: input.note,
      delivery_event_id: input.deliveryEventId,
      handled_by: userId,
      handled_at: event.occurredAt.toISOString(),
    };
  }

  private async loadNotificationRetryPolicy(
    tenantId: string,
  ): Promise<OperationAlertSlaNotificationRetryPolicy> {
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
    if (settings.length === 0) return ENV_NOTIFICATION_RETRY_POLICY;

    const values = new Map(settings.map((setting) => [setting.key, setting.value]));

    return {
      autoRetryEnabled: booleanSetting(
        values.get('operation_alert_sla_notification_auto_retry_enabled'),
        ENV_NOTIFICATION_RETRY_POLICY.autoRetryEnabled,
      ),
      retryIntervalMs: clampInteger(
        values.get('operation_alert_sla_notification_retry_interval_ms'),
        10_000,
        3_600_000,
        ENV_NOTIFICATION_RETRY_POLICY.retryIntervalMs,
      ),
      retryBatchSize: clampInteger(
        values.get('operation_alert_sla_notification_retry_batch_size'),
        1,
        30,
        ENV_NOTIFICATION_RETRY_POLICY.retryBatchSize,
      ),
      maxRetryCount: clampInteger(
        values.get('operation_alert_sla_notification_max_retry_count'),
        1,
        10,
        ENV_NOTIFICATION_RETRY_POLICY.maxRetryCount,
      ),
      retryBackoffSeconds: clampInteger(
        values.get('operation_alert_sla_notification_retry_backoff_seconds'),
        1,
        3600,
        ENV_NOTIFICATION_RETRY_POLICY.retryBackoffSeconds,
      ),
      lookbackHours: clampInteger(
        values.get('operation_alert_sla_notification_lookback_hours'),
        1,
        720,
        ENV_NOTIFICATION_RETRY_POLICY.lookbackHours,
      ),
      source: 'SYSTEM_SETTING',
    };
  }
}

function buildSlaItems(
  alerts: SecurityCenterOperationalAlert[],
  autoEscalations: Array<{ resourceId: string | null; occurredAt: Date }>,
  policy: OperationAlertSlaPolicy,
): SecurityOperationAlertSlaItem[] {
  const now = Date.now();
  const autoMap = latestAutoEscalationMap(autoEscalations);

  return alerts
    .map((alert) => {
      const triggeredAt = new Date(alert.triggered_at);
      const dueAt = new Date(triggeredAt.getTime() + policy.dueMinutes * 60 * 1000);
      const warningAt = new Date(dueAt.getTime() - policy.warningMinutes * 60 * 1000);
      const autoEscalatedAt = autoMap.get(alert.id)?.toISOString() ?? null;
      const slaStatus: SecurityOperationAlertSlaStatus = alert.status === 'CLOSED'
        ? 'CLOSED'
        : now >= dueAt.getTime()
          ? 'OVERDUE'
          : now >= warningAt.getTime()
            ? 'WARNING'
            : 'WITHIN_SLA';

      return {
        alert_id: alert.id,
        alert_category: operationAlertSlaCategory(alert.id),
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        href: alert.href,
        metric: alert.metric,
        status: alert.status,
        sla_status: slaStatus,
        triggered_at: alert.triggered_at,
        due_at: dueAt.toISOString(),
        warning_at: warningAt.toISOString(),
        minutes_remaining: Math.max(0, Math.ceil((dueAt.getTime() - now) / 60_000)),
        overdue_minutes: Math.max(0, Math.ceil((now - dueAt.getTime()) / 60_000)),
        auto_escalated: Boolean(autoEscalatedAt),
        auto_escalated_at: autoEscalatedAt,
        last_action: alert.last_action,
        last_note: alert.last_note,
        updated_at: alert.updated_at,
      };
    })
    .sort((left, right) => Date.parse(left.due_at) - Date.parse(right.due_at));
}

function buildSlaSummary(items: SecurityOperationAlertSlaItem[]): SecurityOperationAlertSlaOverview['summary'] {
  const openDueItems = items.filter((item) => item.sla_status !== 'CLOSED' && item.sla_status !== 'OVERDUE');
  const nextDueAt = openDueItems.map((item) => item.due_at).sort((left, right) => Date.parse(left) - Date.parse(right))[0];

  return {
    total_count: items.length,
    within_sla_count: items.filter((item) => item.sla_status === 'WITHIN_SLA').length,
    warning_count: items.filter((item) => item.sla_status === 'WARNING').length,
    overdue_count: items.filter((item) => item.sla_status === 'OVERDUE').length,
    closed_count: items.filter((item) => item.sla_status === 'CLOSED').length,
    auto_escalated_count: items.filter((item) => item.auto_escalated).length,
    next_due_at: nextDueAt ?? null,
  };
}

function latestAutoEscalationMap(events: Array<{ resourceId: string | null; occurredAt: Date }>) {
  const map = new Map<string, Date>();
  for (const event of events) {
    if (!event.resourceId) continue;
    const current = map.get(event.resourceId);
    if (!current || event.occurredAt > current) {
      map.set(event.resourceId, event.occurredAt);
    }
  }
  return map;
}

function mapPolicy(policy: OperationAlertSlaPolicy): SecurityOperationAlertSlaOverview['policy'] {
  return {
    enabled: policy.enabled,
    scan_interval_ms: policy.scanIntervalMs,
    due_minutes: policy.dueMinutes,
    warning_minutes: policy.warningMinutes,
    auto_escalate_enabled: policy.autoEscalateEnabled,
    lookback_hours: policy.lookbackHours,
    source: policy.source,
  };
}

function normalizePolicy(policy: OperationAlertSlaPolicy): OperationAlertSlaPolicy {
  return {
    ...policy,
    warningMinutes: Math.min(policy.warningMinutes, Math.max(1, policy.dueMinutes - 1)),
  };
}

function buildTaskResult(
  startedAt: Date,
  input: Partial<Omit<SecurityOperationAlertSlaTaskRunResult, 'task' | 'status' | 'started_at' | 'finished_at'>> = {},
): SecurityOperationAlertSlaTaskRunResult {
  const failedCount = input.failed_count ?? 0;
  const activityCount = (input.scanned_count ?? 0) + (input.escalated_count ?? 0) + (input.skipped_count ?? 0);

  return {
    task: 'AUTO_ESCALATE',
    status: failedCount > 0 ? 'FAILED' : activityCount > 0 ? 'SUCCESS' : 'SKIPPED',
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    scanned_count: input.scanned_count ?? 0,
    escalated_count: input.escalated_count ?? 0,
    skipped_count: input.skipped_count ?? 0,
    failed_count: failedCount,
    error_message: input.error_message ?? null,
  };
}

function taskSummary(result: SecurityOperationAlertSlaTaskRunResult) {
  return `审批与归档告警 SLA 扫描完成：扫描 ${result.scanned_count} 条，升级 ${result.escalated_count} 条，跳过 ${result.skipped_count} 条，失败 ${result.failed_count} 条。`;
}

function buildNotificationResult(
  startedAt: Date,
  input: Partial<Omit<SecurityOperationAlertSlaNotificationResult, 'status' | 'started_at' | 'finished_at'>> = {},
): SecurityOperationAlertSlaNotificationResult {
  const failedCount = input.failed_count ?? 0;
  const activityCount = (input.scanned_count ?? 0) + (input.notified_count ?? 0) + (input.skipped_count ?? 0);

  return {
    status: failedCount > 0 ? 'FAILED' : activityCount > 0 ? 'SUCCESS' : 'SKIPPED',
    started_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    scanned_count: input.scanned_count ?? 0,
    notified_count: input.notified_count ?? 0,
    sent_count: input.sent_count ?? 0,
    partial_count: input.partial_count ?? 0,
    failed_count: failedCount,
    skipped_count: input.skipped_count ?? 0,
    error_message: input.error_message ?? null,
  };
}

function notificationTaskSummary(result: SecurityOperationAlertSlaNotificationResult) {
  return `审批与归档告警 SLA 超时通知完成：扫描 ${result.scanned_count} 条，通知 ${result.notified_count} 条，成功 ${result.sent_count} 条，失败 ${result.failed_count} 条。`;
}

function buildNotificationRetryResult(
  startedAt: Date,
  input: Partial<Omit<SecurityOperationAlertSlaNotificationRetryTaskRunResult, 'task' | 'status' | 'started_at' | 'finished_at'>> = {},
): SecurityOperationAlertSlaNotificationRetryTaskRunResult {
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
    dead_letter_count: input.dead_letter_count ?? 0,
    error_message: input.error_message ?? null,
  };
}

function notificationRetryTaskSummary(result: SecurityOperationAlertSlaNotificationRetryTaskRunResult) {
  return `审批与归档告警 SLA 通知自动重试完成：扫描 ${result.scanned_count} 条，重试 ${result.retried_count} 条，成功 ${result.success_count} 条，失败 ${result.failed_count} 条，死信 ${result.dead_letter_count} 条。`;
}

function mapSubscriptionPolicy(
  policy: OperationAlertSlaSubscriptionPolicyInternal,
  webhookConfigured: boolean,
): SecurityOperationAlertSlaSubscriptionPolicy {
  return {
    enabled: policy.enabled,
    channels: policy.channels,
    default_targets: policy.defaultTargets,
    high_risk_targets: policy.highRiskTargets,
    archive_targets: policy.archiveTargets,
    webhook_configured: webhookConfigured,
    source: policy.source,
  };
}

function mapNotificationRetryPolicy(
  policy: OperationAlertSlaNotificationRetryPolicy,
): SecurityOperationAlertSlaNotificationRetryOverview['policy'] {
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

function buildNotificationSummary(
  items: SecurityOperationAlertSlaNotificationItem[],
  pendingOverdueCount: number,
): SecurityOperationAlertSlaNotificationOverview['summary'] {
  const lastDeliveredAt = items
    .map((item) => item.delivered_at)
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];

  return {
    pending_overdue_count: pendingOverdueCount,
    sent_count: items.filter((item) => item.status === 'SENT').length,
    partial_count: items.filter((item) => item.status === 'PARTIAL').length,
    failed_count: items.filter((item) => item.status === 'FAILED').length,
    skipped_count: items.filter((item) => item.status === 'SKIPPED').length,
    total_count: items.length,
    last_delivered_at: lastDeliveredAt ?? null,
  };
}

function mapSlaNotificationEvent(event: Prisma.PlatformEventGetPayload<object>): SecurityOperationAlertSlaNotificationItem {
  const payload = jsonObjectOrNull(event.payloadJson);
  const channels = normalizeNotificationChannels(Array.isArray(payload?.channels) ? payload.channels : undefined);
  const targets = Array.isArray(payload?.targets)
    ? payload.targets.filter((item): item is string => typeof item === 'string')
    : [];
  const status = normalizeNotificationStatus(payload?.status);

  return {
    notification_event_id: event.id,
    alert_id: typeof payload?.alert_id === 'string' ? payload.alert_id : event.resourceId ?? '',
    alert_category: normalizeOperationAlertSlaCategory(payload?.alert_category, payload?.alert_id, event.resourceId),
    title: typeof payload?.title === 'string' ? payload.title : 'SLA 超时通知',
    status,
    channels,
    targets,
    webhook_status: typeof payload?.webhook_status === 'number' ? payload.webhook_status : null,
    webhook_error: typeof payload?.webhook_error === 'string' ? payload.webhook_error : null,
    retry_count: typeof payload?.retry_count === 'number' ? payload.retry_count : 0,
    retried_from_event_id: typeof payload?.retried_from_event_id === 'string' ? payload.retried_from_event_id : null,
    dead_lettered: payload?.dead_lettered === true,
    dead_letter_reason: typeof payload?.dead_letter_reason === 'string' ? payload.dead_letter_reason : null,
    delivered_at: typeof payload?.delivered_at === 'string' ? payload.delivered_at : event.occurredAt.toISOString(),
    created_at: event.createdAt.toISOString(),
    message: event.summary ?? slaNotificationMessage(status, channels, false),
  };
}

function isRetryableSlaNotification(status: SecurityOperationAlertNotificationStatus) {
  return status === 'FAILED' || status === 'PARTIAL';
}

function markSlaNotificationDeadLetter(
  item: SecurityOperationAlertSlaNotificationItem,
  policy: OperationAlertSlaNotificationRetryPolicy,
): SecurityOperationAlertSlaNotificationItem {
  if (!isRetryableSlaNotification(item.status) || item.retry_count < policy.maxRetryCount) return item;

  return {
    ...item,
    dead_lettered: true,
    dead_letter_reason: `已达到最大重试次数 ${policy.maxRetryCount} 次，需要人工检查 Webhook 或订阅策略。`,
  };
}

function eligibleSlaNotificationRetries(
  items: SecurityOperationAlertSlaNotificationItem[],
  policy: OperationAlertSlaNotificationRetryPolicy,
) {
  const backoffAt = Date.now() - policy.retryBackoffSeconds * 1000;

  return items
    .map((item) => markSlaNotificationDeadLetter(item, policy))
    .filter((item) => isRetryableSlaNotification(item.status))
    .filter((item) => !item.dead_lettered)
    .filter((item) => item.retry_count < policy.maxRetryCount)
    .filter((item) => Date.parse(item.delivered_at) <= backoffAt)
    .sort((left, right) => Date.parse(left.delivered_at) - Date.parse(right.delivered_at));
}

function deadLetterSlaNotifications(
  items: SecurityOperationAlertSlaNotificationItem[],
  policy: OperationAlertSlaNotificationRetryPolicy,
) {
  return items
    .map((item) => markSlaNotificationDeadLetter(item, policy))
    .filter((item) => item.dead_lettered)
    .sort((left, right) => Date.parse(right.delivered_at) - Date.parse(left.delivered_at));
}

function applyDeadLetterActions(
  items: SecurityOperationAlertSlaNotificationItem[],
  actionEvents: Prisma.PlatformEventGetPayload<object>[],
): SecurityOperationAlertSlaDeadLetterItem[] {
  const actionMap = latestDeadLetterActionMap(actionEvents);

  return items
    .map((item) => {
      const action = actionMap.get(item.notification_event_id);
      if (!action) return deadLetterItemWithDisposition(item, null);
      return deadLetterItemWithDisposition(item, action);
    })
    .sort((left, right) => {
      const leftActive = left.disposition_status === 'OPEN' || left.disposition_status === 'CLAIMED';
      const rightActive = right.disposition_status === 'OPEN' || right.disposition_status === 'CLAIMED';
      if (leftActive !== rightActive) return leftActive ? -1 : 1;
      return Date.parse(right.delivered_at) - Date.parse(left.delivered_at);
    });
}

function latestDeadLetterActionMap(actionEvents: Prisma.PlatformEventGetPayload<object>[]) {
  const map = new Map<string, Prisma.PlatformEventGetPayload<object>>();
  for (const event of actionEvents) {
    const payload = jsonObjectOrNull(event.payloadJson);
    const notificationEventId = typeof payload?.notification_event_id === 'string'
      ? payload.notification_event_id
      : event.resourceId;
    if (!notificationEventId) continue;
    const current = map.get(notificationEventId);
    if (!current || event.occurredAt > current.occurredAt) {
      map.set(notificationEventId, event);
    }
  }
  return map;
}

function deadLetterItemWithDisposition(
  item: SecurityOperationAlertSlaNotificationItem,
  actionEvent: Prisma.PlatformEventGetPayload<object> | null,
): SecurityOperationAlertSlaDeadLetterItem {
  const payload = jsonObjectOrNull(actionEvent?.payloadJson ?? null);
  const action = normalizeDeadLetterAction(payload?.action);
  const dispositionStatus = normalizeDeadLetterDisposition(payload?.disposition_status, action);

  return {
    ...item,
    disposition_status: dispositionStatus,
    disposition_action: action,
    disposition_note: typeof payload?.note === 'string' ? payload.note : null,
    disposition_event_id: actionEvent?.id ?? null,
    handled_by: typeof payload?.handled_by === 'string' ? payload.handled_by : actionEvent?.userId ?? null,
    handled_at: typeof payload?.handled_at === 'string' ? payload.handled_at : actionEvent?.occurredAt.toISOString() ?? null,
  };
}

function normalizeDeadLetterAction(value: unknown): SecurityOperationAlertSlaDeadLetterAction | null {
  if (value === 'CLAIM' || value === 'REQUEUE' || value === 'CLOSE') return value;
  return null;
}

function normalizeDeadLetterDisposition(
  value: unknown,
  action: SecurityOperationAlertSlaDeadLetterAction | null,
): SecurityOperationAlertSlaDeadLetterDispositionStatus {
  if (value === 'OPEN' || value === 'CLAIMED' || value === 'REQUEUED' || value === 'CLOSED') return value;
  if (action) return deadLetterDispositionFromAction(action);
  return 'OPEN';
}

function deadLetterDispositionFromAction(
  action: SecurityOperationAlertSlaDeadLetterAction,
): SecurityOperationAlertSlaDeadLetterDispositionStatus {
  if (action === 'CLAIM') return 'CLAIMED';
  if (action === 'REQUEUE') return 'REQUEUED';
  return 'CLOSED';
}

function deadLetterActionSummary(action: SecurityOperationAlertSlaDeadLetterAction, title: string) {
  if (action === 'CLAIM') return `认领 SLA 通知死信：${title}`;
  if (action === 'REQUEUE') return `重新投递 SLA 通知死信：${title}`;
  return `关闭 SLA 通知死信：${title}`;
}

function buildDeadLetterAuditCsv(items: SecurityOperationAlertSlaDeadLetterAuditItem[]) {
  const rows = [
    [
      '事件ID',
      '通知事件ID',
      '告警ID',
      '来源分类',
      '标题',
      '动作',
      '处置状态',
      '备注',
      '投递事件ID',
      '操作人',
      '请求ID',
      'Trace ID',
      '发生时间',
    ],
    ...items.map((item) => [
      item.event_id,
      item.notification_event_id,
      item.alert_id ?? '',
      operationAlertSlaCategoryLabel(item.alert_category),
      item.title,
      deadLetterActionLabel(item.action),
      deadLetterDispositionLabel(item.disposition_status),
      item.note ?? '',
      item.delivery_event_id ?? '',
      item.handled_by ?? '',
      item.request_id ?? '',
      item.trace_id ?? '',
      item.occurred_at,
    ]),
  ];

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function deadLetterActionLabel(action: SecurityOperationAlertSlaDeadLetterAction) {
  if (action === 'CLAIM') return '认领';
  if (action === 'REQUEUE') return '重新投递';
  return '关闭';
}

function deadLetterDispositionLabel(status: SecurityOperationAlertSlaDeadLetterDispositionStatus) {
  if (status === 'OPEN') return '待处理';
  if (status === 'CLAIMED') return '已认领';
  if (status === 'REQUEUED') return '已重投';
  return '已关闭';
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function mapDeadLetterAuditArchive(item: {
  key: string;
  relative_key: string;
  file_name: string;
  folder: string;
  size_bytes: number;
  etag: string | null;
  last_modified: string | null;
}): SecurityOperationAlertSlaDeadLetterAuditArchiveItem {
  return {
    id: Buffer.from(item.key, 'utf8').toString('base64url'),
    key: item.key,
    file_name: item.file_name,
    folder: item.folder,
    size_bytes: item.size_bytes,
    etag: item.etag,
    last_modified: item.last_modified,
    download_expires_in: DEAD_LETTER_AUDIT_ARCHIVE_DOWNLOAD_EXPIRES_IN,
  };
}

function deadLetterAuditArchiveKeyFromId(archiveId: string) {
  const key = Buffer.from(archiveId, 'base64url').toString('utf8');
  if (!key.startsWith(`${DEAD_LETTER_AUDIT_ARCHIVE_PREFIX}/`)) {
    throw new BadRequestException('无效的 SLA 死信审计归档 ID。');
  }
  return key;
}

function deadLetterAuditArchiveSourceIdFromKey(key: string) {
  return uuidFromText(`security-sla-dead-letter-audit-archive:${key}`);
}

function buildDeadLetterAuditArchiveDeleteApprovals(
  events: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem[],
): SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[] {
  const groups = new Map<string, SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem[]>();

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
        status: deadLetterAuditArchiveApprovalStatus({ applied, approved, rejected }),
        reason: request.note,
        requested_by: request.actor,
        reviewed_by: latestDecision?.actor ?? null,
        requested_at: request.occurred_at,
        reviewed_at: latestDecision?.occurred_at ?? null,
      };
    })
    .filter((item): item is SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem => Boolean(item))
    .sort((left, right) => Date.parse(right.requested_at) - Date.parse(left.requested_at));
}

function deadLetterAuditArchiveApprovalStatus(input: {
  applied: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem | null;
  approved: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem | null;
  rejected: SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem | null;
}): SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem['status'] {
  if (input.applied) return 'APPLIED';
  if (input.rejected) return 'REJECTED';
  if (input.approved) return 'APPROVED';
  return 'PENDING';
}

function mapDeadLetterAuditArchiveApprovalEvent(
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
): SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalTimelineItem {
  const payload = jsonObjectOrNull(event.payloadJson);
  const archiveKey = typeof payload?.archive_key === 'string' ? payload.archive_key : '';

  return {
    event_id: event.id,
    source_id: event.sourceId ?? event.resourceId ?? '',
    event_type: normalizeDeadLetterAuditArchiveApprovalEventType(payload?.event_type, event.eventType),
    status: event.status,
    title: event.summary ?? 'SLA 死信审计归档操作',
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

function normalizeDeadLetterAuditArchiveApprovalEventType(value: unknown, eventType: string) {
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

function mapDeadLetterAuditEvent(
  event: Prisma.PlatformEventGetPayload<object>,
): SecurityOperationAlertSlaDeadLetterAuditItem | null {
  const payload = jsonObjectOrNull(event.payloadJson);
  const action = normalizeDeadLetterAction(payload?.action);
  if (!action) return null;

  return {
    event_id: event.id,
    notification_event_id: typeof payload?.notification_event_id === 'string'
      ? payload.notification_event_id
      : event.resourceId ?? '',
    alert_id: typeof payload?.alert_id === 'string' ? payload.alert_id : null,
    alert_category: normalizeOperationAlertSlaCategory(payload?.alert_category, payload?.alert_id, event.resourceId),
    title: typeof payload?.title === 'string' ? payload.title : event.summary ?? 'SLA 死信处置',
    action,
    disposition_status: normalizeDeadLetterDisposition(payload?.disposition_status, action),
    note: typeof payload?.note === 'string' ? payload.note : null,
    delivery_event_id: typeof payload?.delivery_event_id === 'string' ? payload.delivery_event_id : null,
    handled_by: typeof payload?.handled_by === 'string' ? payload.handled_by : event.userId ?? null,
    request_id: event.requestId,
    trace_id: event.traceId,
    occurred_at: event.occurredAt.toISOString(),
  };
}

function notificationItemToSlaItem(
  item: SecurityOperationAlertSlaNotificationItem,
): SecurityOperationAlertSlaItem {
  return {
    alert_id: item.alert_id,
    alert_category: item.alert_category,
    title: item.title,
    description: item.message,
    severity: 'MEDIUM',
    href: '/security',
    metric: 'SLA 超时通知重试',
    status: 'OPEN',
    sla_status: 'OVERDUE',
    triggered_at: item.delivered_at,
    due_at: item.delivered_at,
    warning_at: item.delivered_at,
    minutes_remaining: 0,
    overdue_minutes: Math.max(0, Math.ceil((Date.now() - Date.parse(item.delivered_at)) / 60_000)),
    auto_escalated: false,
    auto_escalated_at: null,
    last_action: null,
    last_note: null,
    updated_at: item.delivered_at,
  };
}

function slaNotificationTargets(
  item: SecurityOperationAlertSlaItem,
  policy: OperationAlertSlaSubscriptionPolicyInternal,
) {
  if (item.severity === 'HIGH') return uniqueStrings(policy.highRiskTargets);
  if (item.alert_id.includes('archive')) return uniqueStrings(policy.archiveTargets);
  return uniqueStrings(policy.defaultTargets);
}

function normalizeNotificationChannels(
  channels: unknown[] | undefined,
): SecurityOperationAlertNotificationChannel[] {
  const allowed: SecurityOperationAlertNotificationChannel[] = ['IN_APP', 'WEBHOOK'];
  const requested = channels?.length ? channels : allowed;
  const normalized = requested.filter((channel): channel is SecurityOperationAlertNotificationChannel =>
    typeof channel === 'string' && allowed.includes(channel as SecurityOperationAlertNotificationChannel),
  );

  return Array.from(new Set(normalized));
}

function normalizeNotificationStatus(value: unknown): SecurityOperationAlertNotificationStatus {
  if (value === 'SENT' || value === 'PARTIAL' || value === 'SKIPPED' || value === 'FAILED') return value;
  return 'FAILED';
}

function notificationStatus(
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

function slaNotificationMessage(
  status: SecurityOperationAlertNotificationStatus,
  channels: SecurityOperationAlertNotificationChannel[],
  webhookSkipped: boolean,
) {
  if (status === 'SENT') return '审批与归档告警 SLA 超时通知已投递。';
  if (status === 'PARTIAL') {
    return webhookSkipped ? '站内 SLA 超时通知已记录，外部 Webhook 未配置。' : '站内 SLA 超时通知已记录，外部 Webhook 投递失败。';
  }
  if (status === 'SKIPPED') return '审批与归档告警 SLA 超时通知已跳过，未配置可用投递渠道。';

  return channels.includes('WEBHOOK') ? '外部 Webhook SLA 超时通知投递失败。' : '审批与归档告警 SLA 超时通知投递失败。';
}

async function deliverSlaNotificationWebhook(
  webhookUrl: string,
  item: SecurityOperationAlertSlaItem,
  targets: string[],
): Promise<{ status: number | null; ok: boolean; error: string | null }> {
  const body = JSON.stringify({
    event: 'platform.security.approval_operation_alert_sla.notification',
    alert_id: item.alert_id,
    alert_category: item.alert_category,
    severity: item.severity,
    title: item.title,
    metric: item.metric,
    href: item.href,
    sla_status: item.sla_status,
    overdue_minutes: item.overdue_minutes,
    due_at: item.due_at,
    targets,
    created_at: new Date().toISOString(),
  });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'AIAGET-Security-SLA-Alerts/1.0',
      },
      body,
      signal: AbortSignal.timeout(SECURITY_OPERATION_ALERT_SLA_WEBHOOK_TIMEOUT_MS),
    });
    const text = await safeResponseText(response);

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

async function safeResponseText(response: Response) {
  try {
    const text = await response.text();
    return text.slice(0, 1200);
  } catch {
    return null;
  }
}

function normalizeTargetList(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  return uniqueStrings(value.split(',').map((item) => item.trim()).filter(Boolean));
}

function normalizeTargetArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  return uniqueStrings(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0));
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function booleanSetting(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) return fallback;

  return Math.min(Math.max(numberValue, min), max);
}

function buildRequestId(source: string) {
  return `${TASK_REQUEST_ID_PREFIX}_${source}_${Date.now()}`;
}

function normalizeOperationAlertSlaCategory(
  value: unknown,
  alertId: unknown,
  fallbackAlertId: string | null,
) {
  if (typeof value === 'string' && value.trim()) return value;
  const normalizedAlertId = typeof alertId === 'string' && alertId.trim() ? alertId : fallbackAlertId;
  return normalizedAlertId ? operationAlertSlaCategory(normalizedAlertId) : null;
}

function operationAlertSlaCategory(alertId: string) {
  if (alertId === 'operation-alert-notification-task-sla-dead-letter-failure-source') {
    return 'SLA_DEAD_LETTER_ARCHIVE_DELETE';
  }
  if (alertId === 'operation-alert-notification-task-agent-team-report-archive-failure-source') {
    return 'AGENT_TEAM_REPORT_ARCHIVE_DELETE';
  }
  if (alertId === 'operation-alert-notification-task-recovery-archive-failure-source') {
    return 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE';
  }
  if (alertId === 'operation-alert-notification-task-mixed-failure-source') {
    return 'NOTIFICATION_TASK_MIXED_FAILURE_SOURCE';
  }
  if (
    alertId === 'operation-alert-notification-task-failure-risk' ||
    alertId === 'operation-alert-notification-task-consecutive-failure'
  ) {
    return 'NOTIFICATION_TASK';
  }
  if (alertId === 'agent-team-report-archive-delete-pending' || alertId === 'agent-team-report-archive-delete-rejected-risk') {
    return 'AGENT_TEAM_REPORT_ARCHIVE_DELETE';
  }
  if (alertId === 'sla-dead-letter-archive-delete-pending' || alertId === 'sla-dead-letter-archive-delete-rejected-risk') {
    return 'SLA_DEAD_LETTER_ARCHIVE_DELETE';
  }
  if (
    alertId === 'notification-task-recovery-audit-archive-delete-pending' ||
    alertId === 'notification-task-recovery-audit-archive-delete-rejected-risk'
  ) {
    return 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE';
  }
  if (alertId.includes('archive')) return 'ARCHIVE_OPERATION';
  if (alertId.includes('notification')) return 'NOTIFICATION_POLICY';
  if (alertId.includes('runtime')) return 'RUNTIME_APPROVAL';
  return 'SECURITY_OPERATION';
}

function operationAlertSlaCategoryLabel(category: string | null) {
  if (category === 'SLA_DEAD_LETTER_ARCHIVE_DELETE') return 'SLA 死信归档删除';
  if (category === 'AGENT_TEAM_REPORT_ARCHIVE_DELETE') return '团队报告归档删除';
  if (category === 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE') return '自愈归档删除';
  if (category === 'NOTIFICATION_TASK_MIXED_FAILURE_SOURCE') return '多来源失败';
  if (category === 'NOTIFICATION_TASK') return '通知任务风险';
  if (category === 'ARCHIVE_OPERATION') return '归档运营';
  if (category === 'NOTIFICATION_POLICY') return '通知策略';
  if (category === 'RUNTIME_APPROVAL') return '运行时审批';
  if (category === 'SECURITY_OPERATION') return '运营告警';
  return '未分类';
}

function buildSystemUser(tenantId: string, requestId: string): AuthenticatedUser {
  return {
    id: 'system-security-operation-alert-sla-task',
    tenantId,
    email: 'system@aiaget.local',
    roles: ['system'],
    permissions: ['security:rule:view'],
    requestId,
  };
}

function jsonObjectOrNull(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
