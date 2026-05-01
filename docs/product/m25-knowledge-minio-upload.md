# M25 Knowledge MinIO Upload

## Scope

M25 connects knowledge document upload to the remote MinIO storage already configured in M24. Knowledge documents now keep the original source content in MinIO while parsed text, chunks, embeddings, and retrieval metadata continue to live in PostgreSQL.

This milestone reuses the existing `knowledge_document.storage_path` column and does not add a database table or field.

## Backend

Changed behavior:

```text
POST /api/v1/knowledge-bases/:id/documents
```

Upload flow:

```text
1. Validate knowledge base and text source type.
2. Normalize document content.
3. Upload original content to MinIO through StorageService.
4. Write knowledge_document.storage_path as a minio:// URI.
5. Persist parsed_text in PostgreSQL for current synchronous processing.
6. Segment, embed, index, and mark the document READY.
```

Storage path format:

```text
minio://aiaget-files/tenants/<tenant_id>/knowledge/<knowledge_id>/<file_name>
```

The original object is stored under the same tenant-scoped prefix used by the storage center.

## Frontend

Updated knowledge upload and detail surfaces:

```text
/knowledge
/knowledge/:id
```

Behavior:

1. Upload drawer uses a Chinese custom file picker instead of the browser-native English file input.
2. TXT, Markdown, and HTML files infer source type and MIME type automatically.
3. The upload drawer explains that original content is stored in MinIO.
4. Knowledge document tables show whether each document has a MinIO original source.
5. Document detail shows the full object storage path.

## Reference Design

Reference-first frontend artifacts:

```text
images/frontend-reference-design/m25-knowledge-minio-upload/
```

Browser verification screenshot:

```text
tmp/m25-knowledge-minio-upload.png
```

## Validation

Completed checks:

```text
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm lint
```

Remote MinIO smoke test completed:

```text
knowledge upload -> MinIO object write -> storage object list -> document detail path render
```

Verified example:

```text
storage_path: minio://aiaget-files/tenants/.../knowledge/.../m25-knowledge-minio-smoke.md
segment_count: 1
```
