# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/routes: `/knowledge` and `/knowledge/[id]`
- Users/roles: tenant admins and knowledge operators
- Main task flow: upload document -> generate embeddings -> upsert segment points to Qdrant -> inspect segment backend and collection -> run hybrid retrieval
- API/service contract: upload document, rebuild index, reprocess document, retrieval test, document detail
- Data entities and fields: segment content, embedding model, vector backend, Qdrant collection, vector status, index status, retrieval score
- Actions and states: upload, rebuild, reprocess, search, loading, empty, error, degraded fallback

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show page header badges for M26, MinIO original source, and Qdrant vector store.
- Show a segment card/list region with backend badges and collection labels.
- Show retrieval test area indicating Qdrant vector scoring and fallback state.
- Keep component boundaries obvious for cards, tables, badges, forms, and status messages.

Avoid:
- invented backend settings forms
- polished decorative rendering
- unrealistic navigation or unsupported actions
