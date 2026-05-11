import assert from 'node:assert/strict';
import test from 'node:test';

import { SecurityOperationAlertSlaService } from './security-operation-alert-sla.service';

test('SLA notification retry overview separates retryable items from dead letters', async () => {
  const prisma = buildPrisma({
    settings: [
      { key: 'operation_alert_sla_notification_auto_retry_enabled', value: true },
      { key: 'operation_alert_sla_notification_retry_backoff_seconds', value: 60 },
      { key: 'operation_alert_sla_notification_max_retry_count', value: 3 },
      { key: 'operation_alert_sla_notification_retry_batch_size', value: 5 },
      { key: 'operation_alert_sla_notification_lookback_hours', value: 24 },
    ],
    events: [
      buildSlaNotificationEvent('failed-old', 'FAILED', { deliveredAt: minutesAgo(15), retryCount: 0 }),
      buildSlaNotificationEvent('partial-old', 'PARTIAL', { deliveredAt: minutesAgo(10), retryCount: 1 }),
      buildSlaNotificationEvent('failed-recent', 'FAILED', { deliveredAt: secondsAgo(10), retryCount: 0 }),
      buildSlaNotificationEvent('failed-dead-letter', 'FAILED', { deliveredAt: minutesAgo(30), retryCount: 3 }),
    ],
  });
  const service = new SecurityOperationAlertSlaService(prisma as never, buildSecurityCenter() as never, buildStorage() as never);

  const overview = await service.getNotificationRetryOverview(buildUser());

  assert.equal(overview.summary.pending_auto_retry_count, 2);
  assert.equal(overview.summary.dead_letter_count, 1);
  assert.deepEqual(overview.retryable_items.map((item) => item.notification_event_id), ['failed-old', 'partial-old']);
  assert.deepEqual(overview.dead_letter_items.map((item) => item.notification_event_id), ['failed-dead-letter']);
  assert.match(overview.dead_letter_items[0]?.dead_letter_reason ?? '', /最大重试次数 3 次/);
});

test('SLA retry and dead letter items expose persistent replay fields', async () => {
  const prisma = buildPrisma({
    settings: [
      { key: 'operation_alert_sla_notification_auto_retry_enabled', value: true },
      { key: 'operation_alert_sla_notification_retry_backoff_seconds', value: 60 },
      { key: 'operation_alert_sla_notification_max_retry_count', value: 3 },
      { key: 'operation_alert_sla_notification_retry_batch_size', value: 5 },
      { key: 'operation_alert_sla_notification_lookback_hours', value: 24 },
    ],
    events: [
      buildSlaNotificationEvent('failed-old', 'FAILED', {
        deliveredAt: minutesAgo(15),
        retryCount: 0,
        dedupeKey: 'sla-retry-dedupe-1',
        replayKey: 'sla-retry-replay-1',
      }),
      buildSlaNotificationEvent('failed-dead-letter', 'FAILED', {
        deliveredAt: minutesAgo(30),
        retryCount: 3,
        dedupeKey: 'sla-dead-letter-dedupe-1',
        replayKey: 'sla-dead-letter-replay-1',
      }),
    ],
  });
  const service = new SecurityOperationAlertSlaService(prisma as never, buildSecurityCenter() as never, buildStorage() as never);

  const retryOverview = await service.getNotificationRetryOverview(buildUser());
  const deadLetterOverview = await service.getDeadLetterOverview(buildUser());

  assert.equal(retryOverview.retryable_items[0]?.source_system, 'security_center');
  assert.equal(retryOverview.retryable_items[0]?.source_id, 'source-failed-old');
  assert.equal(retryOverview.retryable_items[0]?.dedupe_key, 'sla-retry-dedupe-1');
  assert.equal(retryOverview.retryable_items[0]?.request_id, 'request-failed-old');
  assert.equal(retryOverview.retryable_items[0]?.trace_id, 'trace-failed-old');
  assert.equal(retryOverview.retryable_items[0]?.replay_key, 'sla-retry-replay-1');

  assert.equal(deadLetterOverview.items[0]?.source_system, 'security_center');
  assert.equal(deadLetterOverview.items[0]?.source_id, 'source-failed-dead-letter');
  assert.equal(deadLetterOverview.items[0]?.dedupe_key, 'sla-dead-letter-dedupe-1');
  assert.equal(deadLetterOverview.items[0]?.request_id, 'request-failed-dead-letter');
  assert.equal(deadLetterOverview.items[0]?.trace_id, 'trace-failed-dead-letter');
  assert.equal(deadLetterOverview.items[0]?.replay_key, 'sla-dead-letter-replay-1');
  assert.equal(deadLetterOverview.items[0]?.latest_action, null);
});

test('SLA notification auto retry records retries and task event without retrying dead letters', async () => {
  const prisma = buildPrisma({
    settings: [
      { key: 'operation_alert_sla_notification_auto_retry_enabled', value: true },
      { key: 'operation_alert_sla_notification_retry_backoff_seconds', value: 60 },
      { key: 'operation_alert_sla_notification_max_retry_count', value: 3 },
      { key: 'operation_alert_sla_notification_retry_batch_size', value: 5 },
      { key: 'operation_alert_sla_notification_lookback_hours', value: 24 },
    ],
    events: [
      buildSlaNotificationEvent('failed-old', 'FAILED', { deliveredAt: minutesAgo(15), retryCount: 0 }),
      buildSlaNotificationEvent('partial-old', 'PARTIAL', { deliveredAt: minutesAgo(10), retryCount: 1 }),
      buildSlaNotificationEvent('failed-dead-letter', 'FAILED', { deliveredAt: minutesAgo(30), retryCount: 3 }),
    ],
  });
  const service = new SecurityOperationAlertSlaService(prisma as never, buildSecurityCenter() as never, buildStorage() as never);

  const result = await service.runNotificationAutoRetry(buildUser());

  assert.equal(result.task, 'AUTO_RETRY');
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.scanned_count, 3);
  assert.equal(result.retried_count, 2);
  assert.equal(result.success_count, 2);
  assert.equal(result.dead_letter_count, 1);
  assert.deepEqual(
    prisma.createdEvents
      .filter((event) => event.data.eventType === 'platform.security.approval_operation_alert_sla.notification_sent')
      .map((event) => event.data.payloadJson.retried_from_event_id),
    ['failed-old', 'partial-old'],
  );
  assert.equal(
    prisma.createdEvents.at(-1)?.data.eventType,
    'platform.security.approval_operation_alert_sla.notification_retry.manual_scan',
  );
  assert.equal(prisma.createdEvents.at(-1)?.data.payloadJson.dead_letter_count, 1);
});

test('SLA dead letter requeue records disposition event and replacement delivery', async () => {
  const prisma = buildPrisma({
    settings: [
      { key: 'operation_alert_sla_notification_max_retry_count', value: 3 },
      { key: 'operation_alert_sla_notification_retry_backoff_seconds', value: 60 },
      { key: 'operation_alert_sla_notification_lookback_hours', value: 24 },
    ],
    events: [
      buildSlaNotificationEvent('failed-dead-letter', 'FAILED', { deliveredAt: minutesAgo(30), retryCount: 3 }),
    ],
  });
  const service = new SecurityOperationAlertSlaService(prisma as never, buildSecurityCenter() as never, buildStorage() as never);

  const result = await service.handleDeadLetter(buildUser(), 'failed-dead-letter', {
    action: 'REQUEUE',
    note: '修复 Webhook 后重新投递',
  });

  assert.equal(result.notification_event_id, 'failed-dead-letter');
  assert.equal(result.action, 'REQUEUE');
  assert.equal(result.disposition_status, 'REQUEUED');
  assert.match(result.delivery_event_id ?? '', /^event-/);
  assert.equal(prisma.createdEvents.at(-1)?.data.eventType, 'platform.security.approval_operation_alert_sla.dead_letter_action');
  assert.equal(prisma.createdEvents.at(-1)?.data.payloadJson.delivery_event_id, result.delivery_event_id);
});

test('SLA dead letter audit archive deletion is reusable and applies object deletion after approval', async () => {
  const archiveKey = 'audit-archives/security-sla-dead-letter-audits/2026-05-08T10-00-00-000Z.csv';
  const archiveId = Buffer.from(archiveKey, 'utf8').toString('base64url');
  const prisma = buildPrisma();
  const storage = buildStorage();
  const service = new SecurityOperationAlertSlaService(prisma as never, buildSecurityCenter() as never, storage as never);

  const first = await service.deleteDeadLetterAuditArchive(buildUser(), archiveId);
  const second = await service.deleteDeadLetterAuditArchive(buildUser(), archiveId);
  const pending = await service.getDeadLetterAuditArchiveApproval(buildUser(), first.approval_id);

  assert.equal(first.approval_id, second.approval_id);
  assert.equal(pending.status, 'PENDING');
  assert.equal(pending.archive_key, archiveKey);
  assert.equal(pending.audit_timeline.length, 1);

  const approved = await service.approveDeadLetterAuditArchiveApproval(buildUser(), first.approval_id, {
    decision_note: '确认删除 SLA 死信归档',
  });

  assert.equal(approved.status, 'APPLIED');
  assert.deepEqual(storage.deletedKeys, [archiveKey]);
  assert.deepEqual(
    prisma.createdEvents
      .filter((event) => event.data.resourceType === 'SECURITY_OPERATION_ALERT_SLA_DEAD_LETTER_AUDIT_ARCHIVE')
      .map((event) => event.data.payloadJson.event_type),
    ['DELETE_REQUESTED', 'APPROVED', 'DELETE_APPLIED'],
  );
});

function buildPrisma(input: { settings?: Array<{ key: string; value: unknown }>; events?: PlatformEventRecord[] } = {}) {
  const events: PlatformEventRecord[] = [...(input.events ?? [])];
  const createdEvents: Array<{ data: PlatformEventData }> = [];

  return {
    createdEvents,
    systemSetting: {
      findMany: async () => input.settings ?? [],
      findFirst: async (args: { where: { key?: string } }) => {
        const setting = input.settings?.find((item) => item.key === args.where.key);
        return setting ? { value: setting.value } : null;
      },
    },
    platformEvent: {
      findMany: async (args: { where: PlatformEventWhere }) => filterEvents(events, args.where),
      findFirst: async (args: { where: PlatformEventWhere }) => filterEvents(events, args.where)[0] ?? null,
      create: async (args: { data: PlatformEventData }) => {
        createdEvents.push(args);
        const event = normalizeCreatedEvent(`event-${createdEvents.length}`, args.data);
        events.push(event);
        return event;
      },
    },
  };
}

function buildSecurityCenter() {
  return {
    listCurrentOperationAlerts: async () => [],
  };
}

function buildStorage() {
  const deletedKeys: string[] = [];

  return {
    deletedKeys,
    deleteTenantObject: async (_tenantId: string, key: string) => {
      deletedKeys.push(key);
    },
  };
}

function buildSlaNotificationEvent(
  id: string,
  status: 'FAILED' | 'PARTIAL' | 'SENT' | 'SKIPPED',
  input: { deliveredAt: string; retryCount: number; dedupeKey?: string | null; replayKey?: string | null },
): PlatformEventRecord {
  return {
    id,
    tenantId: 'tenant-1',
    userId: 'user-1',
    resourceType: 'security_operation_alert',
    resourceId: `alert-${id}`,
    requestId: `request-${id}`,
    traceId: `trace-${id}`,
    eventSource: 'security_center',
    eventType: 'platform.security.approval_operation_alert_sla.notification_sent',
    status: status === 'FAILED' ? 'FAILED' : 'SUCCESS',
    severity: status === 'FAILED' ? 'WARN' : 'INFO',
    summary: 'SLA 超时通知',
    payloadJson: {
      alert_id: `alert-${id}`,
      alert_category: 'SLA_DEAD_LETTER_ARCHIVE_DELETE',
      title: `SLA 通知 ${id}`,
      severity: 'HIGH',
      metric: '1 个',
      href: '/security/alerts',
      sla_status: 'OVERDUE',
      overdue_minutes: 20,
      due_at: input.deliveredAt,
      status,
      channels: ['IN_APP'],
      targets: ['安全管理员'],
      webhook_status: null,
      webhook_error: null,
      retry_count: input.retryCount,
      retried_from_event_id: null,
      dead_lettered: false,
      dead_letter_reason: null,
      dedupe_key: input.dedupeKey ?? null,
      replay_key: input.replayKey ?? null,
      delivered_at: input.deliveredAt,
    },
    occurredAt: new Date(input.deliveredAt),
    createdAt: new Date(input.deliveredAt),
    sourceSystem: 'security_center',
    sourceId: `source-${id}`,
    dedupeKey: input.dedupeKey ?? null,
    user: buildActor('user-1', '申请人'),
  };
}

function normalizeCreatedEvent(id: string, data: PlatformEventData): PlatformEventRecord {
  return {
    id,
    tenantId: data.tenantId,
    userId: data.userId ?? null,
    resourceType: data.resourceType,
    resourceId: data.resourceId ?? null,
    requestId: data.requestId ?? null,
    traceId: data.traceId ?? null,
    eventSource: data.eventSource,
    eventType: data.eventType,
    status: data.status,
    severity: data.severity,
    summary: data.summary ?? null,
    payloadJson: data.payloadJson ?? {},
    occurredAt: data.occurredAt ?? new Date(),
    createdAt: data.createdAt ?? data.occurredAt ?? new Date(),
    sourceSystem: data.sourceSystem ?? null,
    sourceId: data.sourceId ?? null,
    dedupeKey: data.dedupeKey ?? null,
    user: data.userId ? buildActor(data.userId, '申请人') : null,
  };
}

function filterEvents(events: PlatformEventRecord[], where: PlatformEventWhere) {
  return events
    .filter((event) => !where.tenantId || event.tenantId === where.tenantId)
    .filter((event) => !where.id || event.id === where.id)
    .filter((event) => !where.eventSource || event.eventSource === where.eventSource)
    .filter((event) => matchesEventType(event, where.eventType))
    .filter((event) => !where.resourceType || event.resourceType === where.resourceType)
    .filter((event) => !where.resourceId || event.resourceId === where.resourceId)
    .filter((event) => !where.occurredAt?.gte || event.occurredAt >= where.occurredAt.gte)
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}

function matchesEventType(event: PlatformEventRecord, eventType: unknown) {
  if (!eventType) return true;
  if (typeof eventType === 'string') return event.eventType === eventType;
  if (typeof eventType === 'object' && eventType && 'in' in eventType) {
    return Array.isArray(eventType.in) && eventType.in.includes(event.eventType);
  }
  return true;
}

function buildActor(id: string, name: string) {
  return {
    id,
    name,
    email: `${id}@example.test`,
  };
}

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'security@example.test',
    roles: [],
    permissions: ['security:rule:view', 'security:approval:handle'],
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

type PlatformEventRecord = {
  id: string;
  tenantId: string;
  userId: string | null;
  resourceType: string;
  resourceId: string | null;
  requestId: string | null;
  traceId: string | null;
  eventSource: string;
  eventType: string;
  status: string;
  severity: string;
  summary: string | null;
  payloadJson: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;
  sourceSystem: string | null;
  sourceId: string | null;
  dedupeKey: string | null;
  user?: ReturnType<typeof buildActor> | null;
};

type PlatformEventWhere = {
  tenantId?: string;
  id?: string;
  eventSource?: string;
  eventType?: string | { in?: string[] };
  resourceType?: string;
  resourceId?: string;
  occurredAt?: { gte?: Date };
};

type PlatformEventData = {
  tenantId: string;
  userId?: string | null;
  resourceType: string;
  resourceId?: string | null;
  requestId?: string | null;
  traceId?: string | null;
  eventSource: string;
  eventType: string;
  status: string;
  severity: string;
  summary?: string | null;
  payloadJson: Record<string, unknown>;
  occurredAt?: Date;
  createdAt?: Date;
  sourceSystem?: string | null;
  sourceId?: string | null;
  dedupeKey?: string | null;
};
