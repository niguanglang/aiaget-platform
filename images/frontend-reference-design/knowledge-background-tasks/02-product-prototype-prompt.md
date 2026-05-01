# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe image for the AIAget knowledge module background task state.

Project context:
- Route: `/knowledge` and `/knowledge/:id`
- Users: 租户管理员 with write permission; read-only users can inspect status only
- Main task flow: upload document -> API creates document and `PENDING` task -> local background worker runs task -> page refreshes while active -> task becomes `SUCCESS` or `FAILED`; rebuild-index follows the same queue boundary.
- API/service contract: `uploadKnowledgeDocument`, `reprocessKnowledgeDocument`, `rebuildKnowledgeIndex`, `getKnowledgeBase`, `getKnowledgeDocument`
- Data entities: `KnowledgeBaseDetail`, `KnowledgeDocumentListItem`, `KnowledgeDocumentDetail`, `KnowledgeTaskItem`

Prototype requirements:
- Show existing console shell with knowledge detail content.
- Mark component regions: header actions, document table, retrieval test panel, document detail, segment list, processing task card.
- Processing task card must show task type, status badge, processed/total count, timestamp, and error area.
- Show auto-refresh state only when there are `PENDING` or `RUNNING` tasks.
- Show disabled upload/rebuild/reprocess buttons when a mutation is pending or user lacks permission.
- Keep all text Chinese and use only fields/actions supported by the API.

Avoid:
- new routes or unsupported workflow builder UI
- fake queues, fake Temporal UI, random metrics, or decorative graphs
