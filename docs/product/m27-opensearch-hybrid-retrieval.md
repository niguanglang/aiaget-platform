# M27 OpenSearch Hybrid Retrieval

## Scope

M27 upgrades knowledge keyword retrieval from PostgreSQL fallback matching to a real OpenSearch index. Hybrid retrieval now combines OpenSearch keyword scores with Qdrant vector scores. PostgreSQL still stores the canonical knowledge metadata, segment content, local embedding copy, and fallback metadata.

This milestone does not add a PostgreSQL table or field.

## Configuration

```text
OPENSEARCH_ENABLED=true
OPENSEARCH_URL=http://127.0.0.1:9200
OPENSEARCH_INDEX_PREFIX=aiaget_knowledge_segments
OPENSEARCH_USERNAME=
OPENSEARCH_PASSWORD=
```

Docker container:

```text
container: aiaget-opensearch
image: opensearchproject/opensearch:2.19.3
ports: 9200, 9600
volume: aiaget_opensearch_data -> /usr/share/opensearch/data
restart policy: unless-stopped
security mode: disabled for local development
```

OpenSearch 2.19 requires a strong demo-admin password when the security plugin is enabled. The local development container disables the security plugin, so the Control API connects over plain HTTP without basic auth. Production deployments should enable security and provide `OPENSEARCH_USERNAME` and `OPENSEARCH_PASSWORD`.

## Backend

New internal service:

```text
apps/control-api/src/knowledge/opensearch.service.ts
```

Behavior:

1. `processDocument` writes newly generated segments to OpenSearch after PostgreSQL and Qdrant writes.
2. `rebuildIndex` re-indexes all active knowledge segments into OpenSearch.
3. `retrievalTest` and agent RAG retrieval use OpenSearch scores for `KEYWORD` and `HYBRID` modes.
4. `removeDocument` and `reprocessDocument` delete matching OpenSearch documents before replacing or soft deleting source records.
5. If OpenSearch is unavailable, the system records `POSTGRES_FALLBACK` keyword metadata and continues using local keyword scoring.

OpenSearch indexed fields:

```text
id
tenant_id
knowledge_id
document_id
title
source_type
content
keywords
token_count
sort_order
storage_path
updated_at
```

Hybrid scoring:

```text
KEYWORD: OpenSearch text score
VECTOR: Qdrant cosine score
HYBRID: normalized OpenSearch keyword score * 45 + normalized Qdrant vector score * 55
```

## Frontend

Updated knowledge surfaces:

```text
/knowledge
/knowledge/:id
```

Behavior:

1. Knowledge pages show the OpenSearch keyword capability label.
2. Segment cards display `OpenSearch` when keyword indexing is available.
3. Segment cards display `关键词回退` when the OpenSearch write falls back.
4. Segment cards display the target OpenSearch index name when available.
5. Retrieval copy explains that hybrid retrieval fuses OpenSearch keyword scores and Qdrant vector scores.

## Reference Design

Reference-first frontend artifacts:

```text
images/frontend-reference-design/m26-opensearch-hybrid-retrieval/
```

## Validation

Completed checks:

```text
OpenSearch cluster health -> green
knowledge rebuild-index -> processed_segments: 2
OpenSearch index count -> 2
knowledge retrieval-test HYBRID -> SUCCESS
```

Verified example:

```text
index: aiaget_knowledge_segments
docs.count: 2
keyword_backend: OPENSEARCH
vector_backend: QDRANT
retrieval_results: 2
```
