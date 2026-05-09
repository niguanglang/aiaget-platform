import assert from 'node:assert/strict';
import test from 'node:test';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.CONTROL_API_INTERNAL_BASE_URL ??= 'http://control-api.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

type SecurityApprovalWorkbenchServiceCtor = typeof import('./security-approval-workbench.service').SecurityApprovalWorkbenchService;

test('approval workbench aggregates tool, policy, audit archive, and security archive approvals', async () => {
  const service = createService();

  const result = await service.list(buildUser(), { page: 1, page_size: 20 });

  assert.equal(result.total, 7);
  assert.deepEqual(
    result.items.map((item) => item.type).sort(),
    [
      'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE',
      'APPROVAL_AUDIT_ARCHIVE_DELETE',
      'NOTIFICATION_POLICY',
      'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE',
      'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE',
      'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE',
      'TOOL_CALL',
    ],
  );
  assert.equal(result.items.find((item) => item.type === 'TOOL_CALL')?.risk_domain, 'TOOL');
  assert.equal(result.items.find((item) => item.type === 'NOTIFICATION_POLICY')?.risk_domain, 'POLICY');
  assert.equal(result.items.find((item) => item.type === 'APPROVAL_AUDIT_ARCHIVE_DELETE')?.risk_domain, 'AUDIT_ARCHIVE');
  assert.equal(result.items.find((item) => item.type === 'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE')?.risk_domain, 'OPERATION_ALERT');
});

test('approval workbench filters, returns detail timeline, and forwards review decisions', async () => {
  const calls: Array<{ service: string; id: string; note: string | null }> = [];
  const service = createService({ calls });

  const filtered = await service.list(buildUser(), { page: 1, page_size: 20, risk_domain: 'AUDIT_ARCHIVE' });
  assert.equal(filtered.total, 4);
  assert.ok(filtered.items.every((item) => item.risk_domain === 'AUDIT_ARCHIVE'));

  const detail = await service.get(buildUser(), 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE:platform-sla-request');
  assert.equal(detail.type, 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE');
  assert.equal(detail.metadata.archive_file_name, 'sla.csv');
  assert.equal(detail.timeline.length, 1);

  await service.review(buildUser(), 'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE:platform-sla-request', {
    decision: 'APPROVE',
    decision_note: '同意删除 SLA 死信归档',
  });

  assert.deepEqual(calls, [
    {
      service: 'sla.approve',
      id: 'platform-sla-request',
      note: '同意删除 SLA 死信归档',
    },
  ]);
});

test('approval workbench includes recovery audit archive delete approvals and forwards decisions', async () => {
  const calls: Array<{ service: string; id: string; note: string | null }> = [];
  const service = createService({ calls });

  const filtered = await service.list(buildUser(), {
    page: 1,
    page_size: 20,
    type: 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE',
  });
  assert.equal(filtered.total, 1);
  assert.equal(filtered.items[0]?.risk_domain, 'AUDIT_ARCHIVE');
  assert.equal(filtered.items[0]?.source_module, '通知任务自愈审计归档');

  const detail = await service.get(buildUser(), 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE:platform-recovery-request');
  assert.equal(detail.type, 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE');
  assert.equal(detail.metadata.archive_file_name, 'recovery.csv');
  assert.equal(detail.timeline.length, 1);

  await service.review(buildUser(), 'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE:platform-recovery-request', {
    decision: 'REJECT',
    decision_note: '自愈审计归档仍需留存',
  });

  assert.deepEqual(calls, [
    {
      service: 'recovery.reject',
      id: 'platform-recovery-request',
      note: '自愈审计归档仍需留存',
    },
  ]);
});

test('approval workbench includes agent team report archive delete approvals and forwards decisions', async () => {
  const calls: Array<{ service: string; id: string; note: string | null }> = [];
  const service = createService({ calls });

  const filtered = await service.list(buildUser(), {
    page: 1,
    page_size: 20,
    type: 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE',
  });
  assert.equal(filtered.total, 1);
  assert.equal(filtered.items[0]?.risk_domain, 'AUDIT_ARCHIVE');
  assert.equal(filtered.items[0]?.source_module, '团队运行报告归档');

  const detail = await service.get(buildUser(), 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE:team-request-event');
  assert.equal(detail.type, 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE');
  assert.equal(detail.metadata.archive_file_name, 'team.csv');
  assert.equal(detail.timeline.length, 1);

  await service.review(buildUser(), 'AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE:team-request-event', {
    decision: 'APPROVE',
    decision_note: '允许删除团队运行报告归档',
  });

  assert.deepEqual(calls, [
    {
      service: 'team.approve',
      id: 'team-request-event',
      note: '允许删除团队运行报告归档',
    },
  ]);
});

test('approval workbench export limits filtered csv and records an audit event with filters', async () => {
  const recordedEvents: PlatformEventInput[] = [];
  const service = createService({ recordedEvents });

  const csv = await service.exportCsv(buildUser(), {
    page: 1,
    page_size: 20,
    risk_domain: 'AUDIT_ARCHIVE',
    keyword: 'recovery',
  });

  assert.match(csv, /"审批ID","来源ID","审批类型"/);
  assert.match(csv, /"NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE:platform-recovery-request"/);
  assert.match(csv, /"recovery.csv"/);
  assert.equal(recordedEvents.length, 1);
  assert.equal(recordedEvents[0]?.eventType, 'platform.security.approval_workbench.exported');
  assert.equal(recordedEvents[0]?.resourceType, 'SECURITY_APPROVAL_WORKBENCH');
  assert.equal(recordedEvents[0]?.payloadJson.exported_count, 1);
  assert.deepEqual(recordedEvents[0]?.payloadJson.filter, {
    keyword: 'recovery',
    type: null,
    status: null,
    risk_domain: 'AUDIT_ARCHIVE',
  });
});

function createService(
  input: {
    calls?: Array<{ service: string; id: string; note: string | null }>;
    recordedEvents?: PlatformEventInput[];
  } = {},
) {
  const calls = input.calls ?? [];
  const recordedEvents = input.recordedEvents ?? [];
  const SecurityApprovalWorkbenchService = getServiceCtor();
  return new SecurityApprovalWorkbenchService(
    buildPrisma() as never,
    {
      approve: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'tool.approve', id, note: payload.decision_note ?? null });
      },
      reject: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'tool.reject', id, note: payload.decision_note ?? null });
      },
      approveArchiveDeleteApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'audit.approve', id, note: payload.decision_note ?? null });
      },
      rejectArchiveDeleteApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'audit.reject', id, note: payload.decision_note ?? null });
      },
    } as never,
    {
      approveRunReportArchiveDeleteApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'team.approve', id, note: payload.decision_note ?? null });
      },
      rejectRunReportArchiveDeleteApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'team.reject', id, note: payload.decision_note ?? null });
      },
    } as never,
    {
      approveNotificationPolicyApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'policy.approve', id, note: payload.decision_note ?? null });
      },
      rejectNotificationPolicyApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'policy.reject', id, note: payload.decision_note ?? null });
      },
    } as never,
    {
      approveOperationAlertNotificationArchiveApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'operation.approve', id, note: payload.decision_note ?? null });
      },
      rejectOperationAlertNotificationArchiveApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'operation.reject', id, note: payload.decision_note ?? null });
      },
      approveNotificationTaskRecoveryAuditArchiveApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'recovery.approve', id, note: payload.decision_note ?? null });
      },
      rejectNotificationTaskRecoveryAuditArchiveApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'recovery.reject', id, note: payload.decision_note ?? null });
      },
    } as never,
    {
      approveDeadLetterAuditArchiveApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'sla.approve', id, note: payload.decision_note ?? null });
      },
      rejectDeadLetterAuditArchiveApproval: async (_user: unknown, id: string, payload: { decision_note?: string | null }) => {
        calls.push({ service: 'sla.reject', id, note: payload.decision_note ?? null });
      },
    } as never,
    {
      recordEvent: async (event: PlatformEventInput) => {
        recordedEvents.push(event);
        return { id: `event-${recordedEvents.length}` };
      },
    } as never,
  );
}

function getServiceCtor(): SecurityApprovalWorkbenchServiceCtor {
  // Loaded after test env vars are set because transitive AgentTeams imports require Runtime env at module init.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./security-approval-workbench.service').SecurityApprovalWorkbenchService as SecurityApprovalWorkbenchServiceCtor;
}

type PlatformEventInput = {
  eventType: string;
  resourceType: string;
  payloadJson: {
    exported_count?: number;
    filter?: Record<string, unknown>;
  };
} & Record<string, unknown>;

function buildPrisma() {
  return {
    toolApprovalRequest: {
      findMany: async () => [buildToolApproval()],
    },
    systemSettingSnapshot: {
      findMany: async () => [buildNotificationPolicyApproval()],
    },
    approvalAuditEvent: {
      findMany: async (args: { where: { sourceType: string } }) => {
        if (args.where.sourceType === 'APPROVAL_AUDIT_ARCHIVE') {
          return [buildApprovalAuditEvent('audit-request', 'APPROVAL_AUDIT_ARCHIVE', 'DELETE_REQUESTED', 'audit.csv')];
        }
        if (args.where.sourceType === 'AGENT_TEAM_RUN_REPORT_ARCHIVE') {
          return [buildApprovalAuditEvent('team-request', 'AGENT_TEAM_RUN_REPORT_ARCHIVE', 'DELETE_REQUESTED', 'team.csv')];
        }
        return [];
      },
    },
    platformEvent: {
      findMany: async (args: { where: { eventType: { in: string[] } } }) => {
        const eventTypes = args.where.eventType.in;
        if (eventTypes.includes('platform.security.approval_operation_alert_notification.archive.delete_requested')) {
          return [buildPlatformArchiveEvent('platform-operation-request', 'platform.security.approval_operation_alert_notification.archive.delete_requested', 'operation.csv')];
        }
        if (eventTypes.includes('platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_requested')) {
          return [buildPlatformArchiveEvent('platform-sla-request', 'platform.security.approval_operation_alert_sla.dead_letter_audit_archive.delete_requested', 'sla.csv')];
        }
        if (eventTypes.includes('platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested')) {
          return [
            buildPlatformArchiveEvent(
              'platform-recovery-request',
              'platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested',
              'recovery.csv',
            ),
          ];
        }
        return [];
      },
    },
  };
}

function buildToolApproval() {
  const createdAt = new Date('2026-05-08T08:00:00.000Z');
  return {
    id: 'tool-approval-1',
    tenantId: 'tenant-1',
    toolId: 'tool-1',
    toolCallLogId: 'tool-call-1',
    agentId: 'agent-1',
    conversationId: 'conversation-1',
    triggerSource: 'RUNTIME',
    status: 'PENDING',
    reason: '高危工具调用需要审批',
    requestedBy: 'user-1',
    reviewedBy: null,
    decisionNote: null,
    reviewedAt: null,
    createdAt,
    updatedAt: createdAt,
    tool: {
      id: 'tool-1',
      name: '重启服务',
      code: 'restart_service',
      riskLevel: 'HIGH',
    },
    agent: {
      id: 'agent-1',
      name: '运维助手',
    },
    conversation: {
      id: 'conversation-1',
      title: '排障会话',
    },
    requester: buildActor('user-1', '申请人'),
    reviewer: null,
    toolCallLog: {
      id: 'tool-call-1',
      requestMethod: 'POST',
      requestUrl: 'https://ops.example.test/restart',
      status: 'PENDING_APPROVAL',
    },
  };
}

function buildNotificationPolicyApproval() {
  const createdAt = new Date('2026-05-08T08:01:00.000Z');
  return {
    id: 'snapshot-1',
    tenantId: 'tenant-1',
    settingId: 'setting-1',
    settingKey: 'operation_alert_sla_notification_auto_retry_enabled',
    settingName: 'SLA 通知自动重试',
    version: 2,
    action: 'UPDATE',
    previousValue: { enabled: false },
    nextValue: { enabled: true },
    previousStatus: 'ACTIVE',
    nextStatus: 'ACTIVE',
    approvalStatus: 'PENDING',
    approvalRequestId: 'snapshot-approval-1',
    rollbackFromSnapshotId: null,
    rollbackCount: 0,
    impactLevel: 'HIGH',
    impactSummary: '开启 SLA 通知自动重试会影响告警触达策略。',
    createdBy: 'user-1',
    createdAt,
    creator: buildActor('user-1', '申请人'),
  };
}

function buildApprovalAuditEvent(sourceId: string, sourceType: string, eventType: string, fileName: string) {
  return {
    id: `${sourceId}-event`,
    tenantId: 'tenant-1',
    sourceType,
    sourceId,
    eventType,
    eventStatus: 'INFO',
    title: '归档删除已申请',
    note: '删除审计归档',
    requestId: 'request-archive',
    traceId: 'trace-archive',
    metadata: {
      archive_id: sourceId,
      archive_key: `audit/${fileName}`,
      archive_file_name: fileName,
      archive_size_bytes: 1024,
      source_id: sourceId,
    },
    actorId: 'user-1',
    occurredAt: new Date('2026-05-08T08:02:00.000Z'),
    actor: buildActor('user-1', '申请人'),
  };
}

function buildPlatformArchiveEvent(id: string, eventType: string, fileName: string) {
  return {
    id,
    tenantId: 'tenant-1',
    departmentId: null,
    userId: 'user-1',
    resourceType: 'SECURITY_APPROVAL_ARCHIVE',
    resourceId: id,
    requestId: 'request-platform',
    traceId: 'trace-platform',
    eventSource: 'security_center',
    eventType,
    status: 'SUCCESS',
    severity: 'INFO',
    summary: '归档删除已申请',
    payloadJson: {
      event_type: 'DELETE_REQUESTED',
      note: '删除安全归档',
      archive_id: id,
      archive_key: `security/${fileName}`,
      archive_file_name: fileName,
      archive_size_bytes: 2048,
    },
    occurredAt: new Date('2026-05-08T08:03:00.000Z'),
    user: buildActor('user-1', '申请人'),
  };
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
    departmentId: 'department-1',
    email: 'user-1@example.test',
    roles: [],
    permissions: ['security:approval:view', 'security:approval:handle'],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}
