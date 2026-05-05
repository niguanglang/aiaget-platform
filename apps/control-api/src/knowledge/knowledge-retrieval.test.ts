import assert from 'node:assert/strict';
import test from 'node:test';

import type { AuthenticatedUser } from '../common/types/request-context';

test('retrieveAgentReferences skips bindings whose knowledge base is not active and non-deleted', async () => {
  process.env.RUNTIME_BASE_URL = 'http://runtime.example.com';
  process.env.RUNTIME_INTERNAL_TOKEN = 'test-runtime-token';
  const { KnowledgeService } = await import('./knowledge.service');
  const calls: unknown[] = [];
  const prisma = createPrismaStub(calls, []);
  const service = new KnowledgeService(
    prisma as never,
    null as never,
    { registerRunner() {}, recoverRunnableTasks: async () => undefined } as never,
    { searchSegments: async () => ({ backend: 'POSTGRES_FALLBACK', index: null, error_message: null, scores: new Map() }) } as never,
    { searchSegments: async () => ({ backend: 'POSTGRES_FALLBACK', collection: null, error_message: null, scores: new Map() }) } as never,
    null as never,
  );

  const result = await service.retrieveAgentReferences(
    currentUser,
    'agent-1',
    'refund policy',
  );

  assert.deepEqual(result.references, []);
  assert.deepEqual(calls, [{
    type: 'binding_where',
    tenantId: 'tenant-1',
    agentId: 'agent-1',
    deletedAt: null,
  }, {
    type: 'knowledge_where',
    tenantId: 'tenant-1',
    id: {
      in: ['knowledge-archived'],
    },
    deletedAt: null,
    status: 'ACTIVE',
  }]);
});

test('retrieveAgentReferences constrains segment lookup to active non-deleted knowledge base', async () => {
  process.env.RUNTIME_BASE_URL = 'http://runtime.example.com';
  process.env.RUNTIME_INTERNAL_TOKEN = 'test-runtime-token';
  const { KnowledgeService } = await import('./knowledge.service');
  const calls: unknown[] = [];
  const prisma = createPrismaStub(calls, [{ id: 'knowledge-active' }]);
  const service = new KnowledgeService(
    prisma as never,
    null as never,
    { registerRunner() {}, recoverRunnableTasks: async () => undefined } as never,
    { searchSegments: async () => ({ backend: 'POSTGRES_FALLBACK', index: null, error_message: null, scores: new Map() }) } as never,
    { searchSegments: async () => ({ backend: 'POSTGRES_FALLBACK', collection: null, error_message: null, scores: new Map() }) } as never,
    null as never,
  );

  await service.retrieveAgentReferences(
    currentUser,
    'agent-1',
    'refund policy',
  );

  assert.deepEqual(calls.find((call) => isCall(call, 'segment_where')), {
    type: 'segment_where',
    tenantId: 'tenant-1',
    knowledgeId: 'knowledge-active',
    deletedAt: null,
    knowledge: {
      deletedAt: null,
      status: 'ACTIVE',
    },
  });
});

const currentUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'operator@example.com',
  roles: [],
  permissions: [],
} satisfies AuthenticatedUser;

function createPrismaStub(calls: unknown[], activeKnowledgeBases: Array<{ id: string }>) {
  return {
    agentKnowledgeBinding: {
      findMany: async (args: { where: unknown }) => {
        calls.push({ type: 'binding_where', ...objectValue(args.where) });
        return [{
          id: 'binding-1',
          tenantId: 'tenant-1',
          agentId: 'agent-1',
          knowledgeId: activeKnowledgeBases.length > 0 ? 'knowledge-active' : 'knowledge-archived',
          weight: 100,
          recallTopK: 5,
          deletedAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }];
      },
    },
    knowledgeBase: {
      findMany: async (args: { where: unknown }) => {
        calls.push({ type: 'knowledge_where', ...objectValue(args.where) });
        return activeKnowledgeBases;
      },
    },
    knowledgeSegment: {
      findMany: async (args: { where: unknown }) => {
        calls.push({ type: 'segment_where', ...objectValue(args.where) });
        return [];
      },
    },
    knowledgeRecallLog: {
      create: async () => {
        calls.push({ type: 'recall_log_create' });
      },
    },
    modelConfig: {
      findFirst: async () => null,
    },
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}

function isCall(value: unknown, type: string) {
  return Boolean(value && typeof value === 'object' && 'type' in value && value.type === type);
}
