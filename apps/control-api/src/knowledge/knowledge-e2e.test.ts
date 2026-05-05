import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';

import type { AuthenticatedUser } from '../common/types/request-context';

process.env.RUNTIME_BASE_URL ??= 'http://runtime.example.test';
process.env.RUNTIME_INTERNAL_TOKEN ??= 'test-runtime-internal-token';

test('knowledge pipeline uploads, processes, recalls, reprocesses, and stops recalling after archive', async () => {
  const { KnowledgeService } = await import('./knowledge.service');
  const store = createStore();
  const prisma = createPrismaStub(store);
  const storageService = createStorageStub(store);
  const dispatcher = createDispatcherStub(store);
  const openSearch = createSearchStub('OpenSearch');
  const qdrant = createSearchStub('Qdrant');
  const dataScopeQuery = {
    buildWhere: async () => ({ where: {} }),
  };

  const service = new KnowledgeService(
    prisma as never,
    storageService as never,
    dispatcher as never,
    openSearch as never,
    qdrant as never,
    dataScopeQuery as never,
  );

  const currentUser = {
    id: 'user-1',
    tenantId: 'tenant-1',
    departmentId: 'dept-ops',
    email: 'operator@example.com',
    roles: ['agent_admin'],
    permissions: ['knowledge:base:manage', 'knowledge:base:view'],
  } satisfies AuthenticatedUser;

  store.users.set(currentUser.id, {
    id: currentUser.id,
    tenantId: currentUser.tenantId,
    name: 'Operator',
    email: currentUser.email,
    deletedAt: null,
  });

  const created = await service.create(currentUser, {
    name: 'Ops Knowledge Base',
    code: 'ops_knowledge',
    visibility: 'PRIVATE',
    description: 'Operations playbook',
  });

  const knowledgeId = created.id;
  store.agentKnowledgeBindings.push({
    id: 'binding-1',
    tenantId: currentUser.tenantId,
    agentId: 'agent-ops',
    knowledgeId,
    weight: 100,
    recallTopK: 5,
    deletedAt: null,
    createdAt: new Date('2026-05-05T00:00:00.000Z'),
  });

  const uploaded = await service.uploadDocument(currentUser, knowledgeId, {
    title: 'Refund and escalation policy',
    source_type: 'TEXT',
    content: 'Refund policy covers approvals and escalation paths for enterprise billing cases.',
  });

  assert.equal(uploaded.documents.length, 1);
  assert.equal(uploaded.tasks.length, 1);
  assert.equal(uploaded.tasks[0]?.status, 'PENDING');
  assert.deepEqual(dispatcher.enqueuedTaskIds, ['task-1']);

  const firstTaskId = store.knowledgeEmbeddingTasks[0]?.id;
  const documentId = store.knowledgeDocuments[0]?.id;
  assert.ok(firstTaskId);
  assert.ok(documentId);

  await service.runWorkflowTask(firstTaskId);

  const processedDocument = await service.getDocument(currentUser, knowledgeId, documentId);
  assert.equal(processedDocument.status, 'READY');
  assert.equal(processedDocument.segment_count, 1);
  assert.equal(processedDocument.token_count > 0, true);
  assert.equal(processedDocument.segments[0]?.vector_backend, 'POSTGRES_FALLBACK');
  assert.equal(processedDocument.segments[0]?.keyword_backend, 'POSTGRES_FALLBACK');
  assert.equal(processedDocument.segments[0]?.metadata?.qdrant_indexed_count, 0);
  assert.equal(processedDocument.segments[0]?.metadata?.opensearch_indexed_count, 0);

  const firstRecall = await service.retrieveAgentReferences(currentUser, 'agent-ops', 'refund policy');
  assert.equal(firstRecall.references.length > 0, true);
  assert.equal(firstRecall.references[0]?.title, 'Refund and escalation policy');
  assert.equal(store.knowledgeRecallLogs.length, 1);

  const reprocessed = await service.reprocessDocument(currentUser, knowledgeId, documentId);
  assert.equal(reprocessed.tasks.filter((task) => task.task_type === 'PROCESS').length, 2);
  assert.deepEqual(dispatcher.enqueuedTaskIds, ['task-1', 'task-2']);

  const secondTaskId = store.knowledgeEmbeddingTasks.find((task) => task.id !== firstTaskId)?.id;
  assert.ok(secondTaskId);

  await service.runWorkflowTask(secondTaskId);

  const reprocessedDocument = await service.getDocument(currentUser, knowledgeId, documentId);
  assert.equal(reprocessedDocument.status, 'READY');
  assert.equal(reprocessedDocument.segment_count, 1);
  assert.equal(reprocessedDocument.segments[0]?.keyword_backend, 'POSTGRES_FALLBACK');
  assert.equal(reprocessedDocument.segments[0]?.vector_backend, 'POSTGRES_FALLBACK');

  const secondRecall = await service.retrieveAgentReferences(currentUser, 'agent-ops', 'refund policy');
  assert.equal(secondRecall.references.length > 0, true);
  assert.equal(store.knowledgeRecallLogs.length, 2);

  await service.remove(currentUser, knowledgeId);

  const archivedRecall = await service.retrieveAgentReferences(currentUser, 'agent-ops', 'refund policy');
  assert.deepEqual(archivedRecall.references, []);
  assert.equal(store.knowledgeRecallLogs.length, 2);
  assert.equal(store.knowledgeBases.get(knowledgeId)?.status, 'ARCHIVED');
});

function createStore() {
  return {
    users: new Map<string, StoredUser>(),
    knowledgeBases: new Map<string, KnowledgeBaseRow>(),
    knowledgeDocuments: [] as KnowledgeDocumentRow[],
    knowledgeSegments: [] as KnowledgeSegmentRow[],
    knowledgeEmbeddingTasks: [] as KnowledgeTaskRow[],
    agentKnowledgeBindings: [] as AgentKnowledgeBindingRow[],
    knowledgeRecallLogs: [] as KnowledgeRecallLogRow[],
    platformEvents: [] as unknown[],
    counters: {
      knowledgeBase: 0,
      knowledgeDocument: 0,
      knowledgeSegment: 0,
      knowledgeTask: 0,
      recallLog: 0,
      storageUpload: 0,
    },
  };
}

function createPrismaStub(store: ReturnType<typeof createStore>) {
  return {
    $transaction: async (items: Array<Promise<unknown> | unknown>) => Promise.all(items),
    user: {
      findFirst: async (args: { where: { id?: string; tenantId?: string; deletedAt?: null } }) => {
        const row = [...store.users.values()].find((candidate) =>
          matchesId(candidate.id, args.where.id) &&
          matchesId(candidate.tenantId, args.where.tenantId) &&
          candidate.deletedAt === args.where.deletedAt,
        );
        return row ? { ...row } : null;
      },
    },
    knowledgeBase: {
      create: async (args: { data: Partial<KnowledgeBaseRow> }) => {
        const row = buildKnowledgeBaseRow(store, args.data);
        store.knowledgeBases.set(row.id, row);
        return buildKnowledgeBaseRecord(store, row);
      },
      findFirst: async (args: { where: KnowledgeBaseWhere }) => {
        const row = [...store.knowledgeBases.values()].find((candidate) => matchesKnowledgeBase(candidate, args.where));
        return row ? buildKnowledgeBaseRecord(store, row) : null;
      },
      findMany: async (args: { where: KnowledgeBaseWhere }) => {
        return [...store.knowledgeBases.values()]
          .filter((candidate) => matchesKnowledgeBase(candidate, args.where))
          .map((row) => ({ id: row.id }));
      },
      update: async (args: { where: { id: string }; data: Partial<KnowledgeBaseRow> }) => {
        const row = store.knowledgeBases.get(args.where.id);
        if (!row) throw new Error(`Missing knowledge base ${args.where.id}`);
        Object.assign(row, normalizeKnowledgeBaseUpdate(args.data), { updatedAt: new Date() });
        return buildKnowledgeBaseRecord(store, row);
      },
    },
    knowledgeDocument: {
      create: async (args: { data: Partial<KnowledgeDocumentRow> }) => {
        const row = buildKnowledgeDocumentRow(store, args.data);
        store.knowledgeDocuments.push(row);
        return buildKnowledgeDocumentRecord(store, row);
      },
      findFirst: async (args: { where: KnowledgeDocumentWhere }) => {
        const row = store.knowledgeDocuments.find((candidate) => matchesKnowledgeDocument(candidate, args.where));
        return row ? buildKnowledgeDocumentRecord(store, row) : null;
      },
      findMany: async (args: { where: KnowledgeDocumentWhere }) => {
        return store.knowledgeDocuments
          .filter((candidate) => matchesKnowledgeDocument(candidate, args.where))
          .map((row) => buildKnowledgeDocumentRecord(store, row));
      },
      update: async (args: { where: { id: string }; data: Partial<KnowledgeDocumentRow> }) => {
        const row = store.knowledgeDocuments.find((candidate) => candidate.id === args.where.id);
        if (!row) throw new Error(`Missing knowledge document ${args.where.id}`);
        Object.assign(row, normalizeKnowledgeDocumentUpdate(args.data), { updatedAt: new Date() });
        return buildKnowledgeDocumentRecord(store, row);
      },
      updateMany: async (args: { where: KnowledgeDocumentWhere; data: Partial<KnowledgeDocumentRow> }) => {
        let count = 0;
        for (const row of store.knowledgeDocuments) {
          if (!matchesKnowledgeDocument(row, args.where)) continue;
          Object.assign(row, normalizeKnowledgeDocumentUpdate(args.data), { updatedAt: new Date() });
          count += 1;
        }
        return { count };
      },
    },
    knowledgeSegment: {
      findMany: async (args: { where: KnowledgeSegmentWhere }) => {
        return store.knowledgeSegments
          .filter((candidate) => matchesKnowledgeSegment(candidate, args.where))
          .map((row) => buildKnowledgeSegmentRecord(store, row));
      },
      createMany: async (args: { data: Array<Partial<KnowledgeSegmentRow>> }) => {
        for (const input of args.data) {
          store.knowledgeSegments.push(buildKnowledgeSegmentRow(store, input));
        }
        return { count: args.data.length };
      },
      deleteMany: async (args: { where: KnowledgeSegmentWhere }) => {
        const remaining: KnowledgeSegmentRow[] = [];
        let count = 0;
        for (const row of store.knowledgeSegments) {
          if (matchesKnowledgeSegment(row, args.where)) {
            count += 1;
            continue;
          }
          remaining.push(row);
        }
        store.knowledgeSegments.splice(0, store.knowledgeSegments.length, ...remaining);
        return { count };
      },
      update: async (args: { where: { id: string }; data: Partial<KnowledgeSegmentRow> }) => {
        const row = store.knowledgeSegments.find((candidate) => candidate.id === args.where.id);
        if (!row) throw new Error(`Missing knowledge segment ${args.where.id}`);
        Object.assign(row, normalizeKnowledgeSegmentUpdate(args.data), { updatedAt: new Date() });
        return buildKnowledgeSegmentRecord(store, row);
      },
      updateMany: async (args: { where: KnowledgeSegmentWhere; data: Partial<KnowledgeSegmentRow> }) => {
        let count = 0;
        for (const row of store.knowledgeSegments) {
          if (!matchesKnowledgeSegment(row, args.where)) continue;
          Object.assign(row, normalizeKnowledgeSegmentUpdate(args.data), { updatedAt: new Date() });
          count += 1;
        }
        return { count };
      },
    },
    knowledgeEmbeddingTask: {
      create: async (args: { data: Partial<KnowledgeTaskRow> }) => {
        const row = buildKnowledgeTaskRow(store, args.data);
        store.knowledgeEmbeddingTasks.push(row);
        return buildKnowledgeTaskRecord(row);
      },
      findFirst: async (args: { where: KnowledgeTaskWhere }) => {
        const row = store.knowledgeEmbeddingTasks.find((candidate) => matchesKnowledgeTask(candidate, args.where));
        return row ? buildKnowledgeTaskRecord(row) : null;
      },
      findMany: async (args: { where: KnowledgeTaskWhere }) => {
        return store.knowledgeEmbeddingTasks
          .filter((candidate) => matchesKnowledgeTask(candidate, args.where))
          .map((row) => buildKnowledgeTaskRecord(row));
      },
      findUnique: async (args: { where: { id: string } }) => {
        const row = store.knowledgeEmbeddingTasks.find((candidate) => candidate.id === args.where.id);
        return row ? buildKnowledgeTaskRecord(row) : null;
      },
      update: async (args: { where: { id: string }; data: Partial<KnowledgeTaskRow> }) => {
        const row = store.knowledgeEmbeddingTasks.find((candidate) => candidate.id === args.where.id);
        if (!row) throw new Error(`Missing knowledge task ${args.where.id}`);
        Object.assign(row, normalizeKnowledgeTaskUpdate(args.data), { updatedAt: new Date() });
        return buildKnowledgeTaskRecord(row);
      },
      updateMany: async (args: { where: KnowledgeTaskWhere; data: Partial<KnowledgeTaskRow> }) => {
        let count = 0;
        for (const row of store.knowledgeEmbeddingTasks) {
          if (!matchesKnowledgeTask(row, args.where)) continue;
          Object.assign(row, normalizeKnowledgeTaskUpdate(args.data), { updatedAt: new Date() });
          count += 1;
        }
        return { count };
      },
    },
    agentKnowledgeBinding: {
      findMany: async (args: { where: AgentKnowledgeBindingWhere }) => {
        return store.agentKnowledgeBindings
          .filter((candidate) => matchesAgentKnowledgeBinding(candidate, args.where))
          .map((row) => ({
            ...row,
            agent: store.users.get('agent-ops') ? {
              id: 'agent-ops',
              name: 'Operations Assistant',
              code: 'agent-ops',
            } : {
              id: 'agent-ops',
              name: 'Operations Assistant',
              code: 'agent-ops',
            },
          }));
      },
      groupBy: async () => [],
    },
    knowledgeRecallLog: {
      create: async (args: { data: Partial<KnowledgeRecallLogRow> }) => {
        const row = buildKnowledgeRecallLogRow(store, args.data);
        store.knowledgeRecallLogs.push(row);
        return row;
      },
      findMany: async () => [],
      count: async () => 0,
    },
    modelConfig: {
      findFirst: async () => null,
    },
    platformEvent: {
      create: async (args: { data: unknown }) => {
        store.platformEvents.push(args.data);
        return args.data;
      },
    },
  };
}

function createStorageStub(store: ReturnType<typeof createStore>) {
  return {
    uploadObject: async (_currentUser: AuthenticatedUser, input: { file_name: string; folder: string }) => {
      store.counters.storageUpload += 1;
      return {
        item: {
          relative_key: `${input.folder}/${store.counters.storageUpload}-${input.file_name}`,
        },
      };
    },
  };
}

function createDispatcherStub(store: ReturnType<typeof createStore>) {
  const enqueuedTaskIds: string[] = [];

  return {
    enqueuedTaskIds,
    registerRunner: () => undefined,
    recoverRunnableTasks: async () => undefined,
    enqueue: (taskId: string) => {
      enqueuedTaskIds.push(taskId);
      const task = store.knowledgeEmbeddingTasks.find((candidate) => candidate.id === taskId);
      if (task) task.status = 'PENDING';
    },
  };
}

function createSearchStub(name: string) {
  return {
    indexSegments: async () => ({
      backend: 'POSTGRES_FALLBACK',
      index: null,
      indexed_count: 0,
      error_message: `${name} fallback`,
    }),
    deleteDocumentSegments: async () => ({
      backend: 'POSTGRES_FALLBACK',
      index: null,
      indexed_count: 0,
      error_message: `${name} fallback`,
    }),
    searchSegments: async () => ({
      backend: 'POSTGRES_FALLBACK',
      index: null,
      error_message: `${name} fallback`,
      scores: new Map<string, number>(),
    }),
    upsertSegments: async () => ({
      backend: 'POSTGRES_FALLBACK',
      collection: null,
      indexed_count: 0,
      error_message: `${name} fallback`,
    }),
  };
}

function buildKnowledgeBaseRow(store: ReturnType<typeof createStore>, data: Partial<KnowledgeBaseRow>): KnowledgeBaseRow {
  const id = typeof data.id === 'string' ? data.id : `kb-${++store.counters.knowledgeBase}`;
  const now = new Date();
  return {
    id,
    tenantId: data.tenantId ?? 'tenant-1',
    name: data.name ?? 'Untitled knowledge base',
    code: data.code ?? `kb_${id}`,
    visibility: (data.visibility ?? 'PRIVATE') as KnowledgeBaseRow['visibility'],
    status: (data.status ?? 'ACTIVE') as KnowledgeBaseRow['status'],
    description: data.description ?? null,
    ownerId: data.ownerId ?? null,
    createdBy: data.createdBy ?? 'user-1',
    updatedBy: data.updatedBy ?? 'user-1',
    createdAt: data.createdAt instanceof Date ? data.createdAt : now,
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : now,
    deletedAt: data.deletedAt instanceof Date ? data.deletedAt : null,
  };
}

function buildKnowledgeBaseRecord(store: ReturnType<typeof createStore>, row: KnowledgeBaseRow) {
  const owner = row.ownerId ? store.users.get(row.ownerId) ?? null : null;
  return {
    ...row,
    owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
    documents: store.knowledgeDocuments
      .filter((document) => document.knowledgeId === row.id && document.deletedAt === null)
      .map((document) => buildKnowledgeDocumentRecord(store, document)),
    segments: store.knowledgeSegments
      .filter((segment) => segment.knowledgeId === row.id && segment.deletedAt === null)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((segment) => buildKnowledgeSegmentRecord(store, segment)),
    tasks: store.knowledgeEmbeddingTasks
      .filter((task) => task.knowledgeId === row.id)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((task) => buildKnowledgeTaskRecord(task)),
    recallLogs: store.knowledgeRecallLogs
      .filter((log) => log.knowledgeId === row.id)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((log) => buildKnowledgeRecallLogRecord(store, log)),
  };
}

function buildKnowledgeDocumentRow(store: ReturnType<typeof createStore>, data: Partial<KnowledgeDocumentRow>): KnowledgeDocumentRow {
  const id = typeof data.id === 'string' ? data.id : `doc-${++store.counters.knowledgeDocument}`;
  const now = new Date();
  return {
    id,
    tenantId: data.tenantId ?? 'tenant-1',
    knowledgeId: data.knowledgeId ?? 'kb-1',
    title: data.title ?? 'Untitled document',
    sourceType: (data.sourceType ?? 'TEXT') as KnowledgeDocumentRow['sourceType'],
    mimeType: data.mimeType ?? 'text/plain',
    fileName: data.fileName ?? `${id}.txt`,
    fileSize: data.fileSize ?? 0,
    storagePath: data.storagePath ?? `minio://aiaget-files/${id}.txt`,
    checksum: data.checksum ?? randomUUID(),
    status: (data.status ?? 'PROCESSING') as KnowledgeDocumentRow['status'],
    segmentCount: data.segmentCount ?? 0,
    tokenCount: data.tokenCount ?? 0,
    errorMessage: data.errorMessage ?? null,
    parsedText: data.parsedText ?? '',
    uploadedBy: data.uploadedBy ?? 'user-1',
    createdBy: data.createdBy ?? 'user-1',
    updatedBy: data.updatedBy ?? 'user-1',
    createdAt: data.createdAt instanceof Date ? data.createdAt : now,
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : now,
    deletedAt: data.deletedAt instanceof Date ? data.deletedAt : null,
  };
}

function buildKnowledgeDocumentRecord(store: ReturnType<typeof createStore>, row: KnowledgeDocumentRow) {
  const uploader = store.users.get(row.uploadedBy) ?? null;
  return {
    ...row,
    uploader: uploader ? { id: uploader.id, name: uploader.name, email: uploader.email } : null,
    segments: store.knowledgeSegments
      .filter((segment) => segment.documentId === row.id && segment.deletedAt === null)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((segment) => buildKnowledgeSegmentRecord(store, segment)),
    tasks: store.knowledgeEmbeddingTasks
      .filter((task) => task.documentId === row.id)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((task) => buildKnowledgeTaskRecord(task)),
  };
}

function buildKnowledgeSegmentRow(store: ReturnType<typeof createStore>, data: Partial<KnowledgeSegmentRow>): KnowledgeSegmentRow {
  const id = typeof data.id === 'string' ? data.id : `segment-${++store.counters.knowledgeSegment}`;
  const now = new Date();
  return {
    id,
    tenantId: data.tenantId ?? 'tenant-1',
    knowledgeId: data.knowledgeId ?? 'kb-1',
    documentId: data.documentId ?? 'doc-1',
    content: data.content ?? '',
    tokenCount: data.tokenCount ?? 0,
    keywords: data.keywords ?? [],
    embeddingVector: data.embeddingVector ?? [],
    embeddingModel: data.embeddingModel ?? 'local-hash-embedding-v1',
    metadata: data.metadata ?? null,
    vectorStatus: (data.vectorStatus ?? 'READY') as KnowledgeSegmentRow['vectorStatus'],
    indexStatus: (data.indexStatus ?? 'READY') as KnowledgeSegmentRow['indexStatus'],
    sortOrder: data.sortOrder ?? 0,
    createdBy: data.createdBy ?? 'user-1',
    updatedBy: data.updatedBy ?? 'user-1',
    createdAt: data.createdAt instanceof Date ? data.createdAt : now,
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : now,
    deletedAt: data.deletedAt instanceof Date ? data.deletedAt : null,
  };
}

function buildKnowledgeSegmentRecord(store: ReturnType<typeof createStore>, row: KnowledgeSegmentRow) {
  const document = store.knowledgeDocuments.find((candidate) => candidate.id === row.documentId);
  return {
    ...row,
    document: document ? {
      id: document.id,
      title: document.title,
      sourceType: document.sourceType,
      storagePath: document.storagePath,
    } : {
      id: row.documentId,
      title: 'Missing document',
      sourceType: 'TEXT',
      storagePath: null,
    },
  };
}

function buildKnowledgeTaskRow(store: ReturnType<typeof createStore>, data: Partial<KnowledgeTaskRow>): KnowledgeTaskRow {
  const id = typeof data.id === 'string' ? data.id : `task-${++store.counters.knowledgeTask}`;
  const now = new Date();
  return {
    id,
    tenantId: data.tenantId ?? 'tenant-1',
    knowledgeId: data.knowledgeId ?? 'kb-1',
    documentId: data.documentId ?? null,
    taskType: (data.taskType ?? 'PROCESS') as KnowledgeTaskRow['taskType'],
    status: (data.status ?? 'PENDING') as KnowledgeTaskRow['status'],
    totalItems: data.totalItems ?? 0,
    processedItems: data.processedItems ?? 0,
    startedAt: data.startedAt instanceof Date ? data.startedAt : null,
    endedAt: data.endedAt instanceof Date ? data.endedAt : null,
    errorMessage: data.errorMessage ?? null,
    createdAt: data.createdAt instanceof Date ? data.createdAt : now,
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : now,
  };
}

function buildKnowledgeTaskRecord(row: KnowledgeTaskRow) {
  return {
    ...row,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
  };
}

function buildKnowledgeRecallLogRow(store: ReturnType<typeof createStore>, data: Partial<KnowledgeRecallLogRow>): KnowledgeRecallLogRow {
  const id = typeof data.id === 'string' ? data.id : `recall-${++store.counters.recallLog}`;
  const now = new Date();
  return {
    id,
    tenantId: data.tenantId ?? 'tenant-1',
    knowledgeId: data.knowledgeId ?? 'kb-1',
    query: data.query ?? '',
    mode: (data.mode ?? 'HYBRID') as KnowledgeRecallLogRow['mode'],
    topK: data.topK ?? 5,
    status: (data.status ?? 'SUCCESS') as KnowledgeRecallLogRow['status'],
    latencyMs: data.latencyMs ?? 1,
    resultCount: data.resultCount ?? 0,
    results: data.results ?? [],
    errorMessage: data.errorMessage ?? null,
    createdBy: data.createdBy ?? 'user-1',
    createdAt: data.createdAt instanceof Date ? data.createdAt : now,
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : now,
  };
}

function buildKnowledgeRecallLogRecord(store: ReturnType<typeof createStore>, row: KnowledgeRecallLogRow) {
  const operator = store.users.get(row.createdBy) ?? null;
  return {
    ...row,
    operator: operator ? { id: operator.id, name: operator.name, email: operator.email } : null,
  };
}

function normalizeKnowledgeBaseUpdate(data: Partial<KnowledgeBaseRow>) {
  const normalized: Partial<KnowledgeBaseRow> = { ...data };
  return normalized;
}

function normalizeKnowledgeDocumentUpdate(data: Partial<KnowledgeDocumentRow>) {
  const normalized: Partial<KnowledgeDocumentRow> = { ...data };
  return normalized;
}

function normalizeKnowledgeSegmentUpdate(data: Partial<KnowledgeSegmentRow>) {
  const normalized: Partial<KnowledgeSegmentRow> = { ...data };
  return normalized;
}

function normalizeKnowledgeTaskUpdate(data: Partial<KnowledgeTaskRow>) {
  const normalized: Partial<KnowledgeTaskRow> = { ...data };
  return normalized;
}

function matchesId(actual: string, expected?: string) {
  return expected === undefined || actual === expected;
}

function matchesKnowledgeBase(row: KnowledgeBaseRow, where: KnowledgeBaseWhere) {
  if (where.id !== undefined && !matchesId(row.id, typeof where.id === 'string' ? where.id : undefined)) return false;
  if (where.tenantId !== undefined && !matchesId(row.tenantId, where.tenantId)) return false;
  if (where.deletedAt !== undefined && row.deletedAt !== where.deletedAt) return false;
  if (where.status !== undefined && row.status !== where.status) return false;
  if (where.id && typeof where.id === 'object' && 'in' in where.id) {
    const values = Array.isArray(where.id.in) ? where.id.in : [];
    if (!values.includes(row.id)) return false;
  }
  return true;
}

function matchesKnowledgeDocument(row: KnowledgeDocumentRow, where: KnowledgeDocumentWhere) {
  if (where.id !== undefined && !matchesId(row.id, typeof where.id === 'string' ? where.id : undefined)) return false;
  if (where.tenantId !== undefined && !matchesId(row.tenantId, where.tenantId)) return false;
  if (where.knowledgeId !== undefined && !matchesId(row.knowledgeId, where.knowledgeId)) return false;
  if (where.deletedAt !== undefined && row.deletedAt !== where.deletedAt) return false;
  if (where.status !== undefined && row.status !== where.status) return false;
  if (where.knowledge && 'deletedAt' in where.knowledge && row.deletedAt !== where.knowledge.deletedAt) return false;
  return true;
}

function matchesKnowledgeSegment(row: KnowledgeSegmentRow, where: KnowledgeSegmentWhere) {
  if (where.id !== undefined) {
    if (typeof where.id === 'string' && row.id !== where.id) return false;
    if (typeof where.id === 'object' && where.id !== null && 'in' in where.id) {
      const values = Array.isArray(where.id.in) ? where.id.in : [];
      if (!values.includes(row.id)) return false;
    }
  }
  if (where.tenantId !== undefined && !matchesId(row.tenantId, where.tenantId)) return false;
  if (where.knowledgeId !== undefined && !matchesId(row.knowledgeId, where.knowledgeId)) return false;
  if (where.documentId !== undefined) {
    if (where.documentId === null && row.documentId !== null) return false;
    if (typeof where.documentId === 'string' && row.documentId !== where.documentId) return false;
  }
  if (where.deletedAt !== undefined && row.deletedAt !== where.deletedAt) return false;
  if (where.knowledge && 'deletedAt' in where.knowledge && row.deletedAt !== where.knowledge.deletedAt) return false;
  if (where.knowledge && 'status' in where.knowledge) {
    const knowledge = row.knowledgeId ? row : null;
    const base = knowledge ? null : null;
    const knowledgeBase = null;
    void base;
    void knowledgeBase;
    const currentBase = row.knowledgeId;
    const knowledgeRow = currentBase ? null : null;
    void knowledgeRow;
  }
  return true;
}

function matchesKnowledgeTask(row: KnowledgeTaskRow, where: KnowledgeTaskWhere) {
  if (where.id !== undefined && !matchesId(row.id, where.id)) return false;
  if (where.tenantId !== undefined && !matchesId(row.tenantId, where.tenantId)) return false;
  if (where.knowledgeId !== undefined && !matchesId(row.knowledgeId, where.knowledgeId)) return false;
  if (where.documentId !== undefined) {
    if (where.documentId === null && row.documentId !== null) return false;
    if (typeof where.documentId === 'string' && row.documentId !== where.documentId) return false;
  }
  if (where.taskType !== undefined) {
    if (typeof where.taskType === 'string' && row.taskType !== where.taskType) return false;
    if (typeof where.taskType === 'object' && where.taskType !== null && 'in' in where.taskType) {
      const values = Array.isArray(where.taskType.in) ? where.taskType.in : [];
      if (!values.includes(row.taskType)) return false;
    }
  }
  if (where.status !== undefined) {
    if (typeof where.status === 'string' && row.status !== where.status) return false;
    if (typeof where.status === 'object' && where.status !== null && 'in' in where.status) {
      const values = Array.isArray(where.status.in) ? where.status.in : [];
      if (!values.includes(row.status)) return false;
    }
  }
  if (where.knowledge && 'deletedAt' in where.knowledge) {
    const base = where.knowledge.deletedAt;
    void base;
  }
  return true;
}

function matchesAgentKnowledgeBinding(row: AgentKnowledgeBindingRow, where: AgentKnowledgeBindingWhere) {
  if (where.tenantId !== undefined && !matchesId(row.tenantId, where.tenantId)) return false;
  if (where.agentId !== undefined && !matchesId(row.agentId, where.agentId)) return false;
  if (where.knowledgeId !== undefined) {
    if (typeof where.knowledgeId === 'string' && row.knowledgeId !== where.knowledgeId) return false;
    if (typeof where.knowledgeId === 'object' && where.knowledgeId !== null && 'in' in where.knowledgeId) {
      const values = Array.isArray(where.knowledgeId.in) ? where.knowledgeId.in : [];
      if (!values.includes(row.knowledgeId)) return false;
    }
  }
  if (where.deletedAt !== undefined && row.deletedAt !== where.deletedAt) return false;
  return true;
}

interface StoredUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  deletedAt: Date | null;
}

interface KnowledgeBaseRow {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  visibility: 'PRIVATE' | 'TENANT' | 'PUBLIC';
  status: 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
  description: string | null;
  ownerId: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface KnowledgeDocumentRow {
  id: string;
  tenantId: string;
  knowledgeId: string;
  title: string;
  sourceType: 'TEXT' | 'MARKDOWN' | 'PDF' | 'WORD' | 'EXCEL' | 'HTML' | 'URL' | 'FAQ';
  mimeType: string;
  fileName: string;
  fileSize: number;
  storagePath: string;
  checksum: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';
  segmentCount: number;
  tokenCount: number;
  errorMessage: string | null;
  parsedText: string;
  uploadedBy: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface KnowledgeSegmentRow {
  id: string;
  tenantId: string;
  knowledgeId: string;
  documentId: string;
  content: string;
  tokenCount: number;
  keywords: string[];
  embeddingVector: number[];
  embeddingModel: string;
  metadata: unknown;
  vectorStatus: 'READY' | 'PENDING' | 'FAILED';
  indexStatus: 'READY' | 'PENDING' | 'FAILED';
  sortOrder: number;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface KnowledgeTaskRow {
  id: string;
  tenantId: string;
  knowledgeId: string;
  documentId: string | null;
  taskType: 'PROCESS' | 'REBUILD';
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  totalItems: number;
  processedItems: number;
  startedAt: Date | null;
  endedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentKnowledgeBindingRow {
  id: string;
  tenantId: string;
  agentId: string;
  knowledgeId: string;
  weight: number;
  recallTopK: number;
  deletedAt: Date | null;
  createdAt: Date;
}

interface KnowledgeRecallLogRow {
  id: string;
  tenantId: string;
  knowledgeId: string;
  query: string;
  mode: 'VECTOR' | 'KEYWORD' | 'HYBRID';
  topK: number;
  status: 'SUCCESS' | 'FAILED';
  latencyMs: number;
  resultCount: number;
  results: unknown;
  errorMessage: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type KnowledgeBaseWhere = {
  id?: string | { in?: string[] };
  tenantId?: string;
  deletedAt?: null;
  status?: 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
};

type KnowledgeDocumentWhere = {
  id?: string;
  tenantId?: string;
  knowledgeId?: string;
  deletedAt?: null;
  status?: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';
  knowledge?: { deletedAt?: null };
};

type KnowledgeSegmentWhere = {
  id?: string | { in?: string[] };
  tenantId?: string;
  knowledgeId?: string;
  documentId?: string | null;
  deletedAt?: null;
  knowledge?: { deletedAt?: null; status?: 'ACTIVE' | 'DISABLED' | 'ARCHIVED' };
};

type KnowledgeTaskWhere = {
  id?: string;
  tenantId?: string;
  knowledgeId?: string;
  documentId?: string | null;
  taskType?: 'PROCESS' | 'REBUILD' | { in?: Array<'PROCESS' | 'REBUILD'> };
  status?: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | { in?: Array<'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'> };
  knowledge?: { deletedAt?: null };
};

type AgentKnowledgeBindingWhere = {
  tenantId?: string;
  agentId?: string;
  knowledgeId?: string | { in?: string[] };
  deletedAt?: null;
};
