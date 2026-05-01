# M06 Knowledge Center

## Scope

M06 adds tenant-scoped knowledge base management, text document ingestion, synchronous segmentation, retrieval tests, processing task records, recall logs, and Agent reference visibility.

Implemented contracts:

```text
GET    /api/v1/knowledge-bases
POST   /api/v1/knowledge-bases
GET    /api/v1/knowledge-bases/:id
PATCH  /api/v1/knowledge-bases/:id
DELETE /api/v1/knowledge-bases/:id
POST   /api/v1/knowledge-bases/:id/documents
GET    /api/v1/knowledge-bases/:id/documents/:documentId
PATCH  /api/v1/knowledge-bases/:id/documents/:documentId
DELETE /api/v1/knowledge-bases/:id/documents/:documentId
POST   /api/v1/knowledge-bases/:id/documents/:documentId/reprocess
POST   /api/v1/knowledge-bases/:id/retrieval-test
POST   /api/v1/knowledge-bases/:id/rebuild-index
```

## Tables

```text
knowledge_base
knowledge_document
knowledge_segment
knowledge_embedding_task
knowledge_recall_log
```

Agent references are derived from existing `agent_knowledge_binding` rows. The first M06 implementation stores document content and generated segments in PostgreSQL, while preserving storage, vector, index, and task boundaries for later MinIO, Qdrant, and OpenSearch integration.

## List Page Design

The `/knowledge` page owns discovery and fast operations:

1. Metrics for knowledge bases, documents, segments, and failed tasks.
2. Keyword, status, visibility, and owner filters.
3. Knowledge base table with name/code, visibility, status, document count, segment count, failed tasks, updated time, and actions.
4. Create/edit drawer for base metadata and ownership.
5. Upload drawer for TXT, Markdown, HTML, or FAQ content.
6. Selected retrieval panel for query, retrieval mode, top K, recall results, and latency.
7. Rebuild, soft delete, and detail route actions.

## Detail Page Design

The `/knowledge/[id]` page supports full knowledge operations:

1. Header actions for edit, upload, rebuild index, and delete.
2. Document table with processing status, file metadata, uploader, reprocess, and delete actions.
3. Selected document preview with parsed text and document task records.
4. Segment inspector with chunk content, token estimates, keywords, vector status, and index status.
5. Retrieval tester and latest recall result preview.
6. Processing task, recall log, and Agent reference panels.

## Architecture Notes

All APIs are tenant-scoped and protected by `knowledge.read` or `knowledge.write`. Document upload currently accepts text-like content and processes it synchronously into deterministic chunks. Retrieval tests use keyword scoring in M06 to validate the UI, data model, and logging contracts; true embedding, hybrid retrieval, file object storage, parser workers, and Runtime citations are intentionally left for later milestones.
