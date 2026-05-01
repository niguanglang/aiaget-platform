# M28 Knowledge Background Tasks

## Scope

M28 changes knowledge document processing from request-bound synchronous work to queued background execution. Uploading a document, reprocessing a document, and rebuilding indexes now create `knowledge_embedding_task` records first and return immediately. A local in-process dispatcher executes the task by `task_id`.

This milestone is the migration boundary for Temporal. It does not start Temporal or add a new middleware dependency.

This milestone does not add a PostgreSQL table or field.

## Backend Boundary

New dispatcher:

```text
apps/control-api/src/knowledge/knowledge-task-dispatcher.service.ts
```

Current local behavior:

1. API creates a `knowledge_embedding_task` with status `PENDING`.
2. API returns the current knowledge base response without waiting for parsing, embedding, Qdrant, or OpenSearch writes.
3. `KnowledgeTaskDispatcherService.enqueue(task_id)` schedules local execution.
4. `KnowledgeService.executeQueuedTask(task_id)` reloads all task context from PostgreSQL.
5. The task moves through `PENDING -> RUNNING -> SUCCESS` or `FAILED`.
6. On service boot, the dispatcher recovers up to 50 `PENDING/RUNNING` `PROCESS` and `REBUILD` tasks.

Temporal migration boundary:

```text
KnowledgeTaskDispatcherService.enqueue(task_id)
```

M42 has implemented this boundary. `KNOWLEDGE_WORKFLOW_MODE` now controls whether the dispatcher keeps local execution, prefers Runtime workflow dispatch with fallback, or requires Runtime/Temporal dispatch. The workflow still uses the same `task_id` input and calls the same task execution boundary through the Control API internal adapter.

## Task Types

```text
PROCESS
REBUILD
```

`PROCESS` covers both first-time upload processing and document reprocessing.

`REBUILD` covers vector and keyword index rebuild for existing active segments.

## Processing Steps

Document processing task:

```text
1. Load task by task_id
2. Load document from PostgreSQL
3. Mark task RUNNING and document PROCESSING
4. Chunk parsed text
5. Build embeddings
6. Delete old document points from Qdrant
7. Delete old document records from OpenSearch
8. Replace PostgreSQL segments
9. Upsert Qdrant points
10. Index OpenSearch documents
11. Persist vector and keyword backend metadata
12. Mark document READY and task SUCCESS
```

Rebuild task:

```text
1. Load task by task_id
2. Mark task RUNNING
3. Load active segments
4. Rebuild embeddings
5. Update PostgreSQL segment vectors
6. Upsert Qdrant points
7. Index OpenSearch documents
8. Persist backend metadata
9. Mark task SUCCESS
```

## Frontend

Updated knowledge surfaces:

```text
/knowledge
/knowledge/:id
```

Behavior:

1. Existing task cards continue to show `PENDING`, `RUNNING`, `SUCCESS`, and `FAILED`.
2. Knowledge list/detail pages poll only while the selected knowledge base has `PENDING/RUNNING` tasks or `PROCESSING` documents.
3. Upload, reprocess, and rebuild actions no longer block until embeddings and indexes finish.
4. UI text remains Chinese and uses existing status badges/components.

Reference-first frontend artifacts:

```text
images/frontend-reference-design/knowledge-background-tasks/
```

## Validation

Completed checks:

```text
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```
