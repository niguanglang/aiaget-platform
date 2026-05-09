import assert from 'node:assert/strict';
import test from 'node:test';

import type { RequestWithContext } from '../types/request-context';
import { SecurityEventService } from './security-event.service';

test('recordDeny writes operation log, dedicated security event, and platform event', async () => {
  const createdAt = new Date('2026-05-08T09:00:00.000Z');
  const calls: string[] = [];
  const prisma = {
    operationLog: {
      create: async (args: { data: Record<string, unknown> }) => {
        calls.push('operation');
        assert.equal(args.data.tenantId, 'tenant-1');
        assert.equal(args.data.module, 'security');
        assert.equal(args.data.action, 'deny');
        return {
          id: 'operation-1',
          createdAt,
        };
      },
    },
    securityEvent: {
      upsert: async (args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        calls.push('security_event');
        assert.deepEqual(args.where, {
          tenantId_sourceRecordType_sourceRecordId: {
            tenantId: 'tenant-1',
            sourceRecordType: 'operation_log',
            sourceRecordId: 'operation-1',
          },
        });
        assert.equal(args.create.source, 'RESOURCE_ACL');
        assert.equal(args.create.title, '资源授权拒绝');
        assert.equal(args.create.reason, '未授权调用工具');
        assert.equal(args.create.resourceType, 'TOOL');
        assert.equal(args.create.resourceId, 'tool-1');
        assert.equal(args.create.action, 'tool:call:execute');
        assert.equal(args.create.matchedCode, 'tool:call:execute');
        assert.equal(args.create.path, '/api/v1/tools/tool-1/execute');
        assert.equal(args.create.method, 'POST');
        assert.equal(args.create.statusCode, 403);
        assert.equal(args.create.traceId, 'trace-1');
        assert.equal(args.create.severity, 'LOW');
        assert.equal(args.create.sourceRecordType, 'operation_log');
        assert.equal(args.create.sourceRecordId, 'operation-1');
        assert.equal(args.create.occurredAt, createdAt);
        assert.deepEqual(args.create.subject, { user_id: 'user-1' });
        assert.deepEqual(args.create.resource, { resource_type: 'TOOL', id: 'tool-1' });
        assert.deepEqual(args.update, {
          reason: '未授权调用工具',
          resourceType: 'TOOL',
          resourceId: 'tool-1',
          action: 'tool:call:execute',
          matchedCode: 'tool:call:execute',
          traceId: 'trace-1',
          severity: 'LOW',
          subject: { user_id: 'user-1' },
          resource: { resource_type: 'TOOL', id: 'tool-1' },
          context: { guard: 'ResourceAclGuard' },
          requestSummary: args.create.requestSummary,
          errorMessage: '未授权调用工具',
        });
      },
    },
  };
  const platformEvents = {
    recordEvent: async (event: { eventType: string; sourceId: string }) => {
      calls.push('platform_event');
      assert.equal(event.eventType, 'security.access.denied');
      assert.equal(event.sourceId, 'operation-1');
    },
  };
  const service = new SecurityEventService(prisma as never, platformEvents as never);

  await service.recordDeny(buildRequest(), {
    source: 'RESOURCE_ACL',
    resourceType: 'TOOL',
    resourceId: 'tool-1',
    action: 'tool:call:execute',
    matchedCode: 'tool:call:execute',
    reason: '未授权调用工具',
    subject: { user_id: 'user-1' },
    resource: { resource_type: 'TOOL', id: 'tool-1' },
    context: { guard: 'ResourceAclGuard' },
  });

  assert.deepEqual(calls, ['operation', 'security_event', 'platform_event']);
});

function buildRequest(): RequestWithContext {
  return {
    user: {
      id: 'user-1',
      tenantId: 'tenant-1',
      departmentId: 'department-1',
      email: 'admin@example.test',
      roles: [],
      permissions: [],
    },
    method: 'POST',
    originalUrl: '/api/v1/tools/tool-1/execute',
    path: '/tools/tool-1/execute',
    requestId: 'request-1',
    traceId: 'trace-1',
    spanId: 'span-1',
    parentSpanId: 'parent-span-1',
    traceparent: '00-trace-1-span-1-01',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'node:test',
    },
  } as unknown as RequestWithContext;
}
