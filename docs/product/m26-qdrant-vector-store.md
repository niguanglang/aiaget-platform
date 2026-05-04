# M26 Qdrant Vector Store

## Scope

M26 upgrades knowledge vectors from PostgreSQL-only fallback scoring to a Qdrant-backed vector store. PostgreSQL still keeps segment metadata and a local embedding copy as a resilience fallback, but Qdrant is now the preferred backend for vector and hybrid retrieval when `QDRANT_URL` is reachable.

This milestone does not add a PostgreSQL table or field.

## Configuration

```text
QDRANT_ENABLED=true
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=<set-via-env>
QDRANT_COLLECTION_PREFIX=aiaget_knowledge_segments
```

Docker container:

```text
container: aiaget-qdrant
image: qdrant/qdrant:latest
version: 1.17.1
ports: 6333, 6334
volume: aiaget_qdrant_data -> /qdrant/storage
restart policy: unless-stopped
```

Collection naming:

```text
<QDRANT_COLLECTION_PREFIX>_<vector_dimension>
```

Examples:

```text
aiaget_knowledge_segments_48
aiaget_knowledge_segments_1536
```

The dimension suffix keeps local fallback embeddings and provider embeddings from colliding in one fixed-size Qdrant collection.

## Backend

New internal service:

```text
apps/control-api/src/knowledge/qdrant.service.ts
```

Behavior:

1. `processDocument` generates segment embeddings, stores PostgreSQL segment rows, then upserts Qdrant points.
2. `rebuildIndex` regenerates embeddings and re-upserts all active knowledge segments into Qdrant.
3. `retrievalTest` and agent RAG retrieval prefer Qdrant vector scores for `VECTOR` and `HYBRID` modes.
4. `reprocessDocument` deletes old document points from Qdrant before recreating segments.
5. `removeDocument` deletes matching Qdrant points before soft deleting document records.
6. If Qdrant is unavailable, the system records `POSTGRES_FALLBACK` metadata and continues using local vector similarity.

Qdrant payload fields:

```text
tenant_id
knowledge_id
document_id
title
source_type
content
keywords
token_count
sort_order
embedding_model
```

## Frontend

Updated knowledge surfaces:

```text
/knowledge
/knowledge/:id
```

Behavior:

1. Knowledge pages show the M26 and Qdrant capability labels.
2. Segment cards display `Qdrant` when vectors are indexed in Qdrant.
3. Segment cards display `本地回退` when Qdrant is unavailable.
4. Segment cards display the target collection name when available.
5. Retrieval copy now explains that Qdrant vector scores are preferred.

## Reference Design

Reference-first frontend artifacts:

```text
images/frontend-reference-design/m26-qdrant-vector-store/
```

Browser verification screenshot:

```text
tmp/m26-qdrant-vector-store.png
```

## Validation

Completed checks:

```text
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm lint
```

Qdrant container smoke test completed:

```text
docker volume create aiaget_qdrant_data
docker run -d --name aiaget-qdrant --restart unless-stopped ...
unauthenticated GET /collections -> 401
authenticated GET /collections -> ok
knowledge rebuild-index -> Qdrant collection created -> points upserted -> hybrid retrieval succeeds
```

Verified example:

```text
collection: aiaget_knowledge_segments_48
point_count: 2
vector_backend: QDRANT
retrieval_results: 2
```
