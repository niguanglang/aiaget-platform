# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: AIAget Enterprise Agent Platform, Knowledge Center
- Page/routes: `/knowledge` and `/knowledge/[id]`
- Target users/roles: tenant admins and knowledge operators with knowledge permissions
- Business goal: show that knowledge segments are indexed into Qdrant and retrieval prefers the real vector store over PostgreSQL fallback
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/badges, lucide icons, React Query, motion/react
- Existing page shell/layout: enterprise console with left nav, top bar, bento/dashboard content, tables, detail cards

Interface contract that must appear in the UI:
- API/service functions: `uploadKnowledgeDocument`, `rebuildKnowledgeIndex`, `reprocessKnowledgeDocument`, `runKnowledgeRetrievalTest`, `getKnowledgeDocument`
- Main entities and fields: segment content, token count, keywords, embedding model, `vector_backend`, `vector_collection`, `vector_status`, `index_status`, retrieval scores
- Status values/enums: `QDRANT`, `POSTGRES_FALLBACK`, `PENDING`, `READY`, `FAILED`
- User actions: upload document, rebuild index, reprocess document, run vector/hybrid retrieval test
- Required states: loading, empty, error, disabled, success, degraded fallback

Design requirements:
- Make it look like a real enterprise SaaS operations console.
- Show Qdrant as a clear storage/indexing backend in badges, segment metadata, and retrieval copy.
- Include a segment list/card area with badges for `Qdrant` vs `本地回退`, vector status, index status, collection name, and embedding model.
- Keep the visual style minimal, technical, clean, with subtle borders, soft shadows, and restrained motion.
- Use Chinese UI copy for all visible interface text except product names like Qdrant and MinIO.

Avoid:
- fake vector database settings fields not in the current API
- decorative diagrams that cannot map to existing components
- overdone gradients, glow, or dense dashboards
