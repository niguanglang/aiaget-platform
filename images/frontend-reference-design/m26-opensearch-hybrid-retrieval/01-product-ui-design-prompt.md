# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the real AIAget Knowledge Center page.

Project context:
- Page/routes: `/knowledge` and `/knowledge/[id]`
- Goal: show true hybrid retrieval with OpenSearch keyword index and Qdrant vector store
- Stack: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, lucide icons, React Query
- Layout: enterprise console shell, bento/dashboard cards, document table, retrieval panel, segment cards

Interface contract:
- Service actions: upload document, rebuild index, reprocess document, delete document, run retrieval test
- Segment fields: content, token count, keywords, embedding model, Qdrant collection, OpenSearch index, vector backend, keyword backend, status badges
- Retrieval modes: keyword, vector, hybrid
- States: ready, degraded fallback, loading, empty, error, disabled

Design requirements:
- Chinese UI copy.
- Display `Qdrant` and `OpenSearch` as concrete backend badges.
- Show true hybrid retrieval as score fusion rather than a generic search label.
- Use clean enterprise SaaS styling: subtle borders, soft shadows, restrained color, compact information hierarchy.
- Avoid fake configuration fields not backed by the current API.

Avoid:
- marketing hero layouts
- decorative diagrams that cannot map to existing components
- overdone gradients/glow or dense unrelated metrics
