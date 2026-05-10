import assert from 'node:assert/strict';
import test from 'node:test';

import { SecurityCenterService } from './security-center.service';

test('listEvents reads dedicated security_event rows before legacy aggregate sources', async () => {
  const occurredAt = new Date('2026-05-08T08:00:00.000Z');
  const prisma = {
    securityEvent: {
      findMany: async () => [
        {
          id: 'event-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          source: 'RESOURCE_ACL',
          title: '资源授权拒绝',
          reason: '未授权使用该 Agent',
          resourceType: 'AGENT',
          resourceId: 'agent-1',
          action: 'agent:agent:use',
          matchedCode: 'agent:agent:use',
          path: '/api/v1/agents/agent-1/chat',
          method: 'POST',
          statusCode: 403,
          requestId: 'request-1',
          traceId: 'trace-1',
          severity: 'HIGH',
          sourceRecordType: 'operation_log',
          sourceRecordId: 'operation-1',
          subject: { user_id: 'user-1' },
          resource: { resource_type: 'AGENT', id: 'agent-1' },
          context: { guard: 'ResourceAclGuard' },
          requestSummary: { trace_id: 'trace-1' },
          matchedPolicyId: null,
          matchedPolicyCode: 'agent:agent:use',
          matchedPolicyName: null,
          ip: '127.0.0.1',
          userAgent: 'node:test',
          errorMessage: '未授权使用该 Agent',
          occurredAt,
          createdAt: occurredAt,
          user: {
            id: 'user-1',
            name: '管理员',
            email: 'admin@example.test',
          },
        },
      ],
    },
    $transaction: async () => {
      throw new Error('legacy aggregate should not be queried when security_event has rows');
    },
  };
  const service = new SecurityCenterService(prisma as never, null as never);

  const result = await service.listEvents(buildUser(), { page: 1, page_size: 20, window: '24h' });

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.id, 'event-1');
  assert.equal(result.items[0]?.source_record_type, 'operation_log');
  assert.equal(result.items[0]?.has_trace, true);
  assert.equal(result.items[0]?.title, '资源授权拒绝');
});

test('getEvent resolves dedicated security_event detail by stable event id', async () => {
  const occurredAt = new Date('2026-05-08T08:00:00.000Z');
  const prisma = {
    securityEvent: {
      findFirst: async (args: { where: { tenantId: string; id: string } }) => {
        assert.equal(args.where.tenantId, 'tenant-1');
        assert.equal(args.where.id, 'event-1');
        return {
          id: 'event-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          source: 'SECURITY_POLICY',
          title: '安全策略拒绝',
          reason: '命中高危工具策略',
          resourceType: 'TOOL',
          resourceId: 'tool-1',
          action: 'tool:call:execute',
          matchedCode: 'deny-high-risk-tool',
          path: '/api/v1/tools/tool-1/execute',
          method: 'POST',
          statusCode: 403,
          requestId: 'request-1',
          traceId: null,
          severity: 'MEDIUM',
          sourceRecordType: 'security_policy_evaluation',
          sourceRecordId: 'evaluation-1',
          subject: { user_id: 'user-1' },
          resource: { resource_type: 'TOOL', id: 'tool-1' },
          context: { risk: 'HIGH' },
          requestSummary: null,
          matchedPolicyId: 'policy-1',
          matchedPolicyCode: 'deny-high-risk-tool',
          matchedPolicyName: '高危工具阻断',
          ip: null,
          userAgent: null,
          errorMessage: '命中高危工具策略',
          occurredAt,
          createdAt: occurredAt,
          user: {
            id: 'user-1',
            name: '管理员',
            email: 'admin@example.test',
          },
        };
      },
    },
  };
  const service = new SecurityCenterService(prisma as never, null as never);

  const detail = await service.getEvent(buildUser(), 'event-1');

  assert.equal(detail.id, 'event-1');
  assert.equal(detail.source, 'SECURITY_POLICY');
  assert.equal(detail.source_record_id, 'evaluation-1');
  assert.deepEqual(detail.matched_policy, {
    id: 'policy-1',
    code: 'deny-high-risk-tool',
    name: '高危工具阻断',
  });
  assert.equal(detail.has_trace, false);
});

test('getEvent resolves approval workbench export context fields from platform event payload', async () => {
  const occurredAt = new Date('2026-05-08T08:00:00.000Z');
  const prisma = {
    securityEvent: {
      findFirst: async () => null,
    },
    platformEvent: {
      findFirst: async (args: { where: { tenantId: string; id: string; eventType: string } }) => {
        assert.equal(args.where.tenantId, 'tenant-1');
        assert.equal(args.where.id, 'export-1');
        assert.equal(args.where.eventType, 'platform.security.approval_workbench.exported');
        return {
          id: 'export-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          resourceType: 'SECURITY_APPROVAL_WORKBENCH',
          resourceId: 'approval-workbench',
          requestId: 'request-export',
          traceId: 'trace-export',
          eventSource: 'security_center',
          eventType: 'platform.security.approval_workbench.exported',
          status: 'SUCCESS',
          severity: 'INFO',
          summary: '统一安全审批工作台导出完成',
          payloadJson: {
            exported_count: 1,
            filter: { type: 'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE' },
            exported_fields: ['审批ID', '通知筛选来源', '通知筛选状态', '通知筛选关键词'],
            notification_archive_filter_fields: ['通知筛选来源', '通知筛选状态', '通知筛选关键词'],
          },
          occurredAt,
          createdAt: occurredAt,
          user: {
            id: 'user-1',
            name: '管理员',
            email: 'admin@example.test',
          },
        };
      },
    },
  };
  const service = new SecurityCenterService(prisma as never, null as never);

  const detail = await service.getEvent(buildUser(), 'platform:export-1');

  assert.equal(detail.source, 'APPROVAL_WORKBENCH');
  assert.deepEqual(detail.context?.exported_fields, ['审批ID', '通知筛选来源', '通知筛选状态', '通知筛选关键词']);
  assert.deepEqual(detail.context?.notification_archive_filter_fields, [
    '通知筛选来源',
    '通知筛选状态',
    '通知筛选关键词',
  ]);
  assert.deepEqual(detail.request_summary?.notification_archive_filter_fields, [
    '通知筛选来源',
    '通知筛选状态',
    '通知筛选关键词',
  ]);
});

test('listEvents exposes approval workbench export field ledger counts without full field arrays', async () => {
  const occurredAt = new Date('2026-05-08T08:00:00.000Z');
  const prisma = {
    securityEvent: {
      findMany: async () => [],
    },
    operationLog: {
      findMany: async () => [],
    },
    securityPolicyEvaluation: {
      findMany: async () => [],
    },
    platformEvent: {
      findMany: async () => [
        {
          id: 'export-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          resourceType: 'SECURITY_APPROVAL_WORKBENCH',
          resourceId: 'approval-workbench',
          requestId: 'request-export',
          traceId: 'trace-export',
          eventSource: 'security_center',
          eventType: 'platform.security.approval_workbench.exported',
          status: 'SUCCESS',
          severity: 'INFO',
          summary: '统一安全审批工作台导出完成',
          payloadJson: {
            exported_count: 1,
            filter: { status: 'PENDING' },
            exported_fields: ['审批ID', '审批类型', '通知筛选来源'],
            notification_archive_filter_fields: ['通知筛选来源', '通知筛选状态'],
          },
          occurredAt,
          createdAt: occurredAt,
          user: {
            id: 'user-1',
            name: '管理员',
            email: 'admin@example.test',
          },
        },
      ],
    },
    $transaction: async (queries: Array<Promise<unknown>>) => Promise.all(queries),
  };
  const service = new SecurityCenterService(prisma as never, null as never);

  const result = await service.listEvents(buildUser(), { page: 1, page_size: 20, window: '24h' });

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.has_export_field_ledger, true);
  assert.equal(result.items[0]?.exported_field_count, 3);
  assert.equal(result.items[0]?.notification_archive_filter_field_count, 2);
  assert.equal('exported_fields' in (result.items[0] as unknown as Record<string, unknown>), false);
  assert.equal('notification_archive_filter_fields' in (result.items[0] as unknown as Record<string, unknown>), false);
});

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'admin@example.test',
    roles: [],
    permissions: ['security:rule:view'],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}
