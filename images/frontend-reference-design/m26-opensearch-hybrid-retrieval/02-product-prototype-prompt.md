# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe for the AIAget Knowledge Center true hybrid retrieval flow.

Main task flow:
1. Upload document.
2. Segment and generate embeddings.
3. Write vectors to Qdrant.
4. Index text into OpenSearch.
5. Run hybrid retrieval.
6. Inspect segment backend badges and retrieval results.

Wireframe requirements:
- Header badges: M26, MinIO 原文, Qdrant 向量库, OpenSearch 关键词.
- Document table with storage/status/segment count.
- Retrieval panel with mode selector and result summary.
- Segment card with backend badges: Qdrant, OpenSearch, collection, index, vector/index status.
- Degraded fallback state when OpenSearch or Qdrant is unavailable.

Avoid invented settings panels or unsupported batch actions.
