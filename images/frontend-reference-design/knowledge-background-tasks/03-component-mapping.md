# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Knowledge list/detail shell | `apps/web/src/components/knowledge/knowledge-content.tsx` | `listKnowledgeBases`, `getKnowledgeBase` | Add active-task polling without changing layout. |
| Knowledge full detail | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeBaseDetail`, `KnowledgeDocumentDetail` | Refresh base and selected document while background work is active. |
| Task rows | `TasksCard` in `knowledge-detail-content.tsx` | `KnowledgeTaskItem` | Existing card already maps task status, counts, time, and error. |
| Status labels | `knowledge-status.ts` and `StatusBadge` | `KnowledgeTaskStatus`, `KnowledgeDocumentStatus` | Reuse labels/tone; no new visual system. |
| Actions | Existing `Button` calls | `uploadKnowledgeDocument`, `reprocessKnowledgeDocument`, `rebuildKnowledgeIndex` | Backend now returns immediately after enqueueing. |
| Feedback states | React Query mutation/query states | `ApiClientError`, task statuses | Keep existing errors and disabled states; add polling only when active. |
