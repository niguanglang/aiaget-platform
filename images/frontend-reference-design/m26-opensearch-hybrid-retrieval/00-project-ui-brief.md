# Project UI Brief

- Project: AIAget Enterprise Agent Platform
- Page: M26 OpenSearch Hybrid Retrieval
- Routes: `/knowledge` and `/knowledge/[id]`
- Feature goal: add OpenSearch keyword indexing and make hybrid retrieval combine OpenSearch lexical scores with Qdrant vector scores
- Target users: tenant knowledge operators and admins with `knowledge.read` and `knowledge.write`

## APIs and Services

- `POST /api/v1/knowledge-bases/:id/documents`
  - upload document, segment content, upsert Qdrant vectors, index OpenSearch keyword documents
- `POST /api/v1/knowledge-bases/:id/rebuild-index`
  - rebuild Qdrant vectors and OpenSearch keyword index for active segments
- `POST /api/v1/knowledge-bases/:id/retrieval-test`
  - `KEYWORD`: OpenSearch scores preferred
  - `VECTOR`: Qdrant scores preferred
  - `HYBRID`: OpenSearch + Qdrant score fusion
- `POST /api/v1/knowledge-bases/:id/documents/:documentId/reprocess`
- `DELETE /api/v1/knowledge-bases/:id/documents/:documentId`

## Entities and Fields

- `KnowledgeSegmentItem`
  - existing: `embedding_model`, `vector_backend`, `vector_collection`, `vector_status`, `index_status`
  - new: `keyword_backend`, `keyword_index`, `keyword_error_message`
- backend values:
  - vector: `QDRANT`, `POSTGRES_FALLBACK`
  - keyword: `OPENSEARCH`, `POSTGRES_FALLBACK`

## Existing Components and Design System

- `KnowledgeContent`
- `KnowledgeDetailContent`
- `SegmentsCard`
- `RetrievalCard`
- `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`
- React Query, Tailwind CSS, shadcn-style primitives, lucide icons, motion/react

## Required States and Actions

- success: Qdrant + OpenSearch both indexed
- degraded: one backend unavailable and fallback scoring still works
- actions: upload, reprocess, delete, rebuild index, retrieval test
- display: Qdrant collection and OpenSearch index badges on segment cards

## Constraints

- Visible copy must be Chinese.
- Do not start/create OpenSearch container without user confirmation.
- No PostgreSQL table/field addition for this milestone.
- Use existing `knowledge_segment.metadata` for backend metadata.
