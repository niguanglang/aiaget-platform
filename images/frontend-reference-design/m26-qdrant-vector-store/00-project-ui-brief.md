# Project UI Brief

- Project: AIAget Enterprise Agent Platform
- Page: M26 Qdrant Vector Store
- Routes: `/knowledge` and `/knowledge/[id]`
- Feature goal: upgrade knowledge segment vectors from PostgreSQL-only fallback scoring to a real Qdrant vector store
- Parent layout: protected console shell under `apps/web/src/app/(console)`
- Target users: tenant operators and admins with `knowledge.read` and `knowledge.write`

## APIs and Services

- `POST /api/v1/knowledge-bases/:id/documents`
  - segments document content, generates embeddings, writes vectors to Qdrant, persists metadata to PostgreSQL
- `POST /api/v1/knowledge-bases/:id/rebuild-index`
  - regenerates vectors and upserts all active segments into Qdrant
- `POST /api/v1/knowledge-bases/:id/retrieval-test`
  - prefers Qdrant vector scores for `VECTOR` and `HYBRID` retrieval
- `POST /api/v1/knowledge-bases/:id/documents/:documentId/reprocess`
  - deletes old Qdrant points for the document and writes the new segment vectors
- `DELETE /api/v1/knowledge-bases/:id/documents/:documentId`
  - removes document segment points from Qdrant before soft deletion

## Entities and Fields

- `KnowledgeSegmentItem`
  - `embedding_model`
  - `metadata`
  - `vector_backend`: `QDRANT` or `POSTGRES_FALLBACK`
  - `vector_collection`
  - `vector_error_message`
  - `vector_status`
  - `index_status`
- Qdrant collection naming: `<QDRANT_COLLECTION_PREFIX>_<vector_dimension>`, default `aiaget_knowledge_segments_<dimension>`

## Existing Components and Design System

- `KnowledgeContent`
- `KnowledgeDetailContent`
- `SegmentsCard`
- `Card`, `Button`, `EmptyState`, `MetricCard`, `StatusBadge`
- Tailwind CSS, shadcn-style primitives, lucide icons, motion/react

## Required States and Actions

- loading: knowledge base and segment detail loading
- empty: no documents or no segments
- success: Qdrant vector point written and retrieval uses vector scores
- degraded: Qdrant unavailable and PostgreSQL vector fallback is used
- actions: upload document, reprocess document, rebuild index, run retrieval test

## Constraints

- Visible UI copy must be Chinese.
- Do not start or install middleware/container.
- Use configured `QDRANT_URL`; do not assume a local container is running.
- Do not add a PostgreSQL table or column for this milestone.
