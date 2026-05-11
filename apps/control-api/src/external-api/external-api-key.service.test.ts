import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import { HttpException, HttpStatus } from '@nestjs/common';
import type { RequestWithContext } from '../common/types/request-context';

test('atomically reserves daily API key quota and rejects when the conditional update does not match', async () => {
  const { ExternalApiKeyService } = await import('./external-api-key.service');
  const updateManyCalls: Array<Record<string, unknown>> = [];
  const service = new ExternalApiKeyService(
    {
      apiKey: {
        findUnique: async () => buildKey(),
        updateMany: async (args: Record<string, unknown>) => {
          updateManyCalls.push(args);
          return { count: 0 };
        },
        update: async () => {
          throw new Error('markUsed should use an atomic conditional update');
        },
      },
    } as never,
    null as never,
    null as never,
    null as never,
  );

  await assert.rejects(
    () => service.markUsed('key-1'),
    (error) => error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS,
  );

  assert.equal(updateManyCalls.length, 1);
  const call = updateManyCalls[0] as { where?: Record<string, unknown>; data?: Record<string, unknown> };
  assert.equal(call.where?.id, 'key-1');
  assert.equal(call.where?.status, 'ACTIVE');
  assert.equal(call.data?.lastUsedAt instanceof Date, true);
  assert.equal(call.data?.quotaResetDate instanceof Date, true);
  assert.deepEqual(call.data?.usedCountToday, { increment: 1 });
});

test('reserves daily API key quota after stale quota date has already been reset by another request', async () => {
  const { ExternalApiKeyService } = await import('./external-api-key.service');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const updateManyCalls: Array<Record<string, unknown>> = [];
  const service = new ExternalApiKeyService(
    {
      apiKey: {
        findUnique: async () => buildKey({ usedCountToday: 99, quotaResetDate: yesterday }),
        updateMany: async (args: Record<string, unknown>) => {
          updateManyCalls.push(args);
          return { count: updateManyCalls.length === 1 ? 0 : 1 };
        },
        update: async () => {
          throw new Error('markUsed should use conditional updateMany reservations');
        },
      },
    } as never,
    null as never,
    null as never,
    null as never,
  );

  await service.markUsed('key-1');

  assert.equal(updateManyCalls.length, 2);
  const firstCall = updateManyCalls[0] as { data?: Record<string, unknown> };
  assert.equal(firstCall.data?.usedCountToday, 1);
  const secondCall = updateManyCalls[1] as { where?: Record<string, unknown>; data?: Record<string, unknown> };
  assert.deepEqual(secondCall.where?.usedCountToday, { lt: 10 });
  assert.deepEqual(secondCall.data?.usedCountToday, { increment: 1 });
});

test('shares API key minute rate limit through the database across service instances', async () => {
  const { ExternalApiKeyService } = await import('./external-api-key.service');
  const key = buildKey({ rateLimitPerMinute: 1 });
  const rateLimitBuckets = new Map<string, { count: number }>();
  const prisma = {
    apiKey: {
      findFirst: async () => key,
    },
    user: {
      findFirst: async () => buildOwner(),
    },
    externalApiKeyRateLimitWindow: {
      upsert: async (args: {
        where: { apiKeyId_windowStart: { apiKeyId: string; windowStart: Date } };
        create: { apiKeyId: string; count: number };
        update: { count: { increment: number } };
      }) => {
        const bucketKey = `${args.where.apiKeyId_windowStart.apiKeyId}:${args.where.apiKeyId_windowStart.windowStart.toISOString()}`;
        const bucket = rateLimitBuckets.get(bucketKey) ?? { count: 0 };
        bucket.count += bucket.count === 0 ? args.create.count : args.update.count.increment;
        rateLimitBuckets.set(bucketKey, bucket);
        return {
          count: bucket.count,
        };
      },
      deleteMany: async () => ({ count: 0 }),
    },
    agent: {
      count: async () => 1,
    },
    resourceAcl: {
      findMany: async () => [],
    },
  };
  const firstInstance = new ExternalApiKeyService(
    prisma as never,
    { buildWhere: async () => ({ where: null }) } as never,
    { canAccess: async () => true } as never,
    { recordDeny: async () => undefined } as never,
  );
  const secondInstance = new ExternalApiKeyService(
    prisma as never,
    { buildWhere: async () => ({ where: null }) } as never,
    { canAccess: async () => true } as never,
    { recordDeny: async () => undefined } as never,
  );

  await firstInstance.authenticate(buildRequest(), 'agent-1', { stream: false });
  await assert.rejects(
    () => secondInstance.authenticate(buildRequest(), 'agent-1', { stream: false }),
    (error) => error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS,
  );
  assert.equal(rateLimitBuckets.size, 1);
  assert.equal(Array.from(rateLimitBuckets.values())[0]?.count, 2);
});

function buildRequest(): RequestWithContext {
  return {
    headers: {
      'x-api-key': 'test-api-key',
    },
    method: 'POST',
    path: '/external/agents/agent-1/chat',
    ip: '127.0.0.1',
    requestId: randomUUID(),
    traceId: randomUUID().replace(/-/g, ''),
  } as unknown as RequestWithContext;
}

function buildOwner() {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    departmentId: 'dept-1',
    email: 'operator@example.test',
    status: 'ACTIVE',
    userRoles: [
      {
        role: {
          id: 'role-1',
          code: 'operator',
          rolePermissions: [
            { permission: { code: 'system:api_key:invoke' } },
            { permission: { code: 'conversation:chat:manage' } },
            { permission: { code: 'agent:agent:use' } },
          ],
        },
      },
    ],
  };
}

function buildKey(overrides: Record<string, unknown> = {}) {
  return {
    id: 'key-1',
    tenantId: 'tenant-1',
    name: 'External key',
    keyPrefix: 'ak_test',
    keyHash: 'hash',
    status: 'ACTIVE',
    scopes: ['external:agent:chat'],
    allowedAgentIds: [],
    ipAllowlist: [],
    rateLimitPerMinute: 60,
    dailyQuota: 10,
    usedCountToday: 9,
    quotaResetDate: new Date(),
    allowStream: true,
    webhookEnabled: false,
    webhookUrl: null,
    webhookEvents: ['agent.run.completed'],
    webhookSecretEncrypted: null,
    webhookLastStatus: null,
    webhookLastError: null,
    webhookLastSentAt: null,
    expiresAt: null,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: null,
    ...overrides,
  };
}
