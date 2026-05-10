import assert from 'node:assert/strict';
import test from 'node:test';

test('audit events include billing platform events and search payload fields', async () => {
  const { AuditService } = await import('./audit.service');
  const service = new AuditService(buildPrisma() as never);

  const result = await service.listEvents(buildUser(), {
    page: 1,
    page_size: 20,
    window: '7d',
    source_type: 'billing',
    keyword: 'ADJ-20260718-0002',
  } as never);

  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.source_type, 'billing');
  assert.match(result.items[0]?.summary ?? '', /华中设计院/);
  assert.equal(result.items[0]?.request_id, 'trace-1');
});

function buildPrisma() {
  return {
    $transaction: async (queries: Array<Promise<unknown>>) => Promise.all(queries),
    loginLog: {
      findMany: async () => [],
    },
    operationLog: {
      findMany: async () => [],
    },
    approvalAuditEvent: {
      findMany: async () => [],
    },
    platformEvent: {
      findMany: async () => [
        {
          id: 'platform-event-1',
          tenantId: 'tenant-1',
          userId: 'user-1',
          resourceType: 'BILLING_ADJUSTMENT',
          resourceId: 'billing-adjustment-1',
          requestId: 'request-1',
          traceId: 'trace-1',
          eventSource: 'billing',
          eventType: 'billing.adjustment.created',
          status: 'SUCCESS',
          severity: 'INFO',
          summary: '创建成交入账调账单 ADJ-20260718-0002',
          payloadJson: {
            adjustment_no: 'ADJ-20260718-0002',
            opportunity_name: '华中设计院二期续约扩展机会',
            customer_name: '华中设计院',
          },
          occurredAt: new Date(),
          sourceSystem: 'billing',
          sourceId: 'billing-adjustment-1',
          user: {
            email: 'operator@example.test',
          },
        },
      ],
    },
  };
}

function buildUser() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'admin@example.test',
    roles: [],
    permissions: ['security:audit:view'],
    requestId: 'request-1',
    traceId: 'trace-1',
  };
}
