import assert from 'node:assert/strict';
import test from 'node:test';

import { ToolsService } from './tools.service';

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  departmentId: 'dept-1',
  email: 'operator@example.test',
  roles: [],
  roleIds: [],
  permissions: ['tool:call:log:view'],
};

test('tool call logs are tenant-isolated, filterable, paginated, and mapped to the shared contract', async () => {
  const captured: Array<Record<string, unknown>> = [];
  const createdAt = new Date('2026-05-12T10:30:00.000Z');
  const prisma = {
    toolCallLog: {
      findMany: async (args: Record<string, unknown>) => {
        captured.push({ operation: 'findMany', ...args });
        return [
          {
            id: 'log-1',
            tenantId: 'tenant-1',
            toolId: 'tool-1',
            triggerSource: 'RUNTIME',
            status: 'FAILED',
            requestUrl: 'https://api.example.test/customers',
            requestMethod: 'POST',
            requestHeaders: { 'x-request-id': 'trace-1' },
            requestBody: { customer_id: 'customer-1' },
            responseStatus: 502,
            responseHeaders: { 'content-type': 'application/json' },
            responseBody: { error: 'upstream failed' },
            latencyMs: 321,
            errorMessage: 'upstream failed',
            createdAt,
            createdBy: 'user-1',
            tool: {
              id: 'tool-1',
              name: '客户资料同步',
              code: 'customer_sync',
            },
            operator: {
              id: 'user-1',
              name: '运营管理员',
              email: 'operator@example.test',
            },
            approvalRequest: {
              id: 'approval-1',
              status: 'REJECTED',
            },
          },
        ];
      },
      count: async (args: Record<string, unknown>) => {
        captured.push({ operation: 'count', ...args });
        return 1;
      },
    },
    $transaction: async (operations: Array<Promise<unknown>>) => Promise.all(operations),
  };
  const dataScopeQuery = {
    buildWhere: async () => ({
      applied: true,
      reason: 'test tool scope',
      where: {
        createdBy: 'user-1',
      },
    }),
  };
  const service = new ToolsService(prisma as never, dataScopeQuery as never, {} as never);

  const result = await service.listLogs(currentUser, {
    page: 2,
    page_size: 10,
    keyword: 'customer',
    tool_id: 'tool-1',
    status: 'FAILED',
    trigger_source: 'RUNTIME',
    approval_status: 'REJECTED',
    request_method: 'POST',
    date_from: '2026-05-01T00:00:00.000Z',
    date_to: '2026-05-12T23:59:59.999Z',
  });

  assert.equal(result.page, 2);
  assert.equal(result.page_size, 10);
  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.id, 'log-1');
  assert.equal(result.items[0]?.tool_id, 'tool-1');
  assert.equal(result.items[0]?.tool_name, '客户资料同步');
  assert.equal(result.items[0]?.tool_code, 'customer_sync');
  assert.equal(result.items[0]?.trigger_source, 'RUNTIME');
  assert.equal(result.items[0]?.status, 'FAILED');
  assert.equal(result.items[0]?.approval_request_id, 'approval-1');
  assert.equal(result.items[0]?.approval_status, 'REJECTED');
  assert.equal(result.items[0]?.request_headers?.['x-request-id'], 'trace-1');
  assert.deepEqual(result.items[0]?.request_body, { customer_id: 'customer-1' });
  assert.equal(result.items[0]?.response_status, 502);
  assert.equal(result.items[0]?.created_at, '2026-05-12T10:30:00.000Z');
  assert.equal(result.items[0]?.created_by?.email, 'operator@example.test');

  const findMany = captured.find((entry) => entry.operation === 'findMany');
  const count = captured.find((entry) => entry.operation === 'count');
  assert.ok(findMany, 'missing findMany call');
  assert.ok(count, 'missing count call');
  assert.deepEqual(findMany.where, count.where);
  assert.deepEqual(findMany.include, { tool: true, operator: true, approvalRequest: true });
  assert.deepEqual(findMany.orderBy, { createdAt: 'desc' });
  assert.equal(findMany.skip, 10);
  assert.equal(findMany.take, 10);

  assert.deepEqual(findMany.where, {
    tenantId: 'tenant-1',
    toolId: 'tool-1',
    status: 'FAILED',
    triggerSource: 'RUNTIME',
    approvalRequest: {
      status: 'REJECTED',
    },
    requestMethod: 'POST',
    createdAt: {
      gte: new Date('2026-05-01T00:00:00.000Z'),
      lte: new Date('2026-05-12T23:59:59.999Z'),
    },
    OR: [
      { requestUrl: { contains: 'customer', mode: 'insensitive' } },
      { errorMessage: { contains: 'customer', mode: 'insensitive' } },
      { tool: { name: { contains: 'customer', mode: 'insensitive' } } },
      { tool: { code: { contains: 'customer', mode: 'insensitive' } } },
      { operator: { email: { contains: 'customer', mode: 'insensitive' } } },
    ],
    AND: [
      {
        tool: {
          createdBy: 'user-1',
        },
      },
    ],
  });
});
