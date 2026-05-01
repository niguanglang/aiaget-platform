# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/knowledge/page.tsx` | Console layout | Replace placeholder with real M06 list content. |
| Detail route | `apps/web/src/app/(console)/knowledge/[id]/page.tsx` | `GET /knowledge-bases/:id` | New detail page. |
| Background atmosphere | `knowledge-center-background.tsx` | visual only | React Three Fiber particle/wire geometry, low opacity, no content dependency. |
| Metrics | `MetricCard` | knowledge list aggregate | Bases, documents, segments, failed tasks. |
| Status chips | `StatusBadge` | knowledge/document/task status | Map active/ready/success to healthy, failed to unavailable. |
| Toolbar/search/filter | new `knowledge-content.tsx` | list query params | Keyword, status, visibility, updated window. |
| Knowledge table | new `knowledge-content.tsx` | `KnowledgeBaseListItem` | Name/code, visibility, status, docs, segments, failed tasks, owner, updated, actions. |
| Create/edit drawer | new `knowledge-form-panel.tsx` | create/update DTO | React Hook Form + Zod. |
| Upload drawer | new `knowledge-document-form-panel.tsx` | upload document DTO | Text/Markdown first version, optional file read on client. |
| Selected retrieval panel | new `knowledge-content.tsx` | retrieval test API | JSON-free query form, mode/topK, references, latency. |
| Detail documents | `knowledge-detail-content.tsx` | document APIs | List documents, reprocess/delete/open document detail. |
| Segments | `knowledge-detail-content.tsx` | `KnowledgeSegmentItem` | Content, tokens, keywords, vector status. |
| Processing tasks | `knowledge-detail-content.tsx` | task records | Parse, segment, embed, index task statuses. |
| Recall logs | `knowledge-detail-content.tsx` | `KnowledgeRecallLogItem` | Query, mode, latency, result count, latest references. |
| Agent references | `knowledge-detail-content.tsx` | `agent_knowledge_binding` derived rows | Shows referencing Agents once bindings exist. |
| Delete confirmation | local modal pattern | delete APIs | Keep destructive action explicit and scoped. |
| Backend Prisma | `apps/control-api/prisma/schema.prisma` | M06 tables | knowledge_base, knowledge_document, knowledge_segment, knowledge_embedding_task, knowledge_recall_log. |
| Backend module | `apps/control-api/src/knowledge/*` | M06 APIs | Tenant scoped, RBAC guarded, synchronous TXT/Markdown processing boundary. |
