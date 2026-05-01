# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the M06 Knowledge Center.

Project context:
- Page/route: `/knowledge`, detail `/knowledge/[id]`
- Users/roles: tenant admins and knowledge operators; read-only users see disabled write actions
- Main task flow: create knowledge base -> upload TXT/Markdown document -> synchronous segment generation -> inspect document and segments -> run retrieval test -> review recall logs and Agent references
- API contract: knowledge base CRUD, document upload/update/delete/reprocess, retrieval test, rebuild index
- Data entities: KnowledgeBase, KnowledgeDocument, KnowledgeSegment, KnowledgeEmbeddingTask, KnowledgeRecallLog, Agent references

Prototype requirements:
- Low/mid-fidelity dashboard wireframe focused on information architecture.
- Show metrics row, filter toolbar, knowledge base table, selected detail/retrieval panel, create/edit drawer, upload drawer, and delete confirmation.
- Detail route should show a header/action bar, base profile panel, document table, segment list, processing task timeline, retrieval tester, recall log list, and Agent references.
- Mark loading, empty, error, validation, permission-disabled, failed processing, and no-result retrieval states.
- Keep component boundaries obvious for mapping to existing `Card`, `Button`, `Input`, `MetricCard`, `StatusBadge`, `EmptyState`, table, drawer, and modal patterns.
- Show responsive behavior: desktop two-column dashboard, tablet stacked cards, mobile single-column with horizontally scrollable tables.
- Keep wireframe density realistic for an operations console; leave clear whitespace and avoid overfilling each region.

Avoid: decorative polish, fake navigation, unsupported backend fields, unrealistic drag-and-drop-only upload.
