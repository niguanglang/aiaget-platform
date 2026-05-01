# M19 Hybrid Retrieval

## Scope

M19 upgrades knowledge retrieval from keyword-only scoring into provider-backed embedding retrieval with local vector fallback and hybrid ranking.

Reused contracts:

```text
POST /api/v1/knowledge-bases/:id/retrieval-test
POST /api/v1/conversations
POST /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/messages/stream
```

## Tables

```text
knowledge_segment
```

M19 extends the existing `knowledge_segment` table with:

- `embedding_vector`
- `embedding_model`

## Behavior

M19 changes retrieval in three ways:

1. Document processing now computes and persists an embedding vector for every segment.
2. Retrieval test supports real `KEYWORD`, `VECTOR`, and `HYBRID` scoring instead of exposing vector mode as a placeholder.
3. Live conversation retrieval reuses the same hybrid scorer before assistant generation.

When an active `embedding` capability model is available under an `OPENAI_COMPATIBLE` provider, embeddings are generated from that provider. If not, the platform falls back to a deterministic local dense vector approximation so hybrid retrieval still works without extra middleware.

## Architecture Notes

M19 still does not require a dedicated vector middleware. Embeddings are persisted directly in PostgreSQL through the existing control plane schema, and similarity is computed inside the application process. This keeps deployment simple while making the retrieval pipeline materially stronger than pure keyword matching.
