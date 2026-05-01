# Project UI Brief

- Project: AIAget Enterprise Agent Platform
- Page: M25 Knowledge MinIO Upload
- Routes: `/knowledge` and `/knowledge/[id]`
- Feature goal: upgrade knowledge document upload so original text/Markdown files are stored in MinIO while parsed text and segments remain queryable in PostgreSQL
- Parent layout: protected console shell under `apps/web/src/app/(console)`
- Target users: tenant operators and admins with `knowledge.read` and `knowledge.write`

## APIs and Services

- `POST /api/v1/knowledge-bases/:id/documents`
  - existing upload endpoint
  - input: `title`, `source_type`, `content`, `file_name`, `mime_type`
  - M25 behavior: persist original content to MinIO and write `knowledge_document.storage_path`
- `GET /api/v1/knowledge-bases/:id`
  - returns knowledge base detail with document list
- `GET /api/v1/knowledge-bases/:id/documents/:documentId`
  - returns document detail, parsed text, segments, and tasks
- `POST /api/v1/knowledge-bases/:id/documents/:documentId/reprocess`
- `DELETE /api/v1/knowledge-bases/:id/documents/:documentId`

## Entities and Fields

- `KnowledgeDocumentListItem`
  - `id`, `title`, `source_type`, `mime_type`, `file_name`, `file_size`
  - `storage_path`
  - `status`, `segment_count`, `token_count`, `error_message`
  - `uploaded_by`, `created_at`, `updated_at`
- `KnowledgeDocumentDetail`
  - all list fields plus `parsed_text`, `segments`, `tasks`
- status values: `PENDING`, `PROCESSING`, `READY`, `FAILED`, `DELETED`
- source types currently supported by form: `TEXT`, `MARKDOWN`, `HTML`, `FAQ`

## Existing Components and Design System

- `KnowledgeContent`
- `KnowledgeDetailContent`
- `KnowledgeDocumentFormPanel`
- `Card`, `Button`, `Input`, `EmptyState`, `MetricCard`, `StatusBadge`
- React Query mutations for upload, delete, reprocess, retrieval test
- Tailwind CSS, shadcn-style primitives, lucide icons, motion/react

## Required States and Actions

- loading: knowledge base and document detail loading
- empty: no documents or no selected document
- error: MinIO unavailable, upload failure, validation failure
- success: upload stores original file in MinIO and document reaches `READY`
- disabled: upload while pending, write actions without permission
- display: storage path should be visible but MinIO secret must never be exposed

## Constraints

- Visible UI copy must be Chinese.
- Do not start or install middleware/container.
- Do not add a database table or field for this milestone.
- Use configured remote MinIO bucket `aiaget-files`.
- Store original knowledge documents under tenant-scoped MinIO prefixes.
