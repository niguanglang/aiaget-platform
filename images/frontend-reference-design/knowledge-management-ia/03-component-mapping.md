# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/layout.tsx` | route shell | Reuse existing console layout and app chrome |
| Knowledge overview metrics | `apps/web/src/components/knowledge/knowledge-content.tsx` | `getKnowledgeOverview`, `KnowledgeOverview` | Compact summary cards only |
| Filter / toolbar row | `apps/web/src/components/knowledge/knowledge-content.tsx` | `listKnowledgeBases` query params | Search, status, visibility, owner filters |
| Knowledge base table | `apps/web/src/components/knowledge/knowledge-content.tsx` | `KnowledgeBaseListItem` | Core list fields only |
| Row actions | `apps/web/src/components/knowledge/knowledge-content.tsx` | `getKnowledgeBase`, `deleteKnowledgeBase`, route links | View, edit, delete, upload/rebuild on detail page |
| Create page form | `apps/web/src/components/knowledge/knowledge-form-panel.tsx`, `apps/web/src/app/(console)/knowledge/create/page.tsx` | `createKnowledgeBase`, `CreateKnowledgeBaseInput` | Full-page form variant |
| Edit page form | `apps/web/src/components/knowledge/knowledge-form-panel.tsx`, `apps/web/src/app/(console)/knowledge/[id]/edit/page.tsx` | `getKnowledgeBase`, `updateKnowledgeBase`, `UpdateKnowledgeBaseInput` | Full-page form variant |
| Knowledge detail header | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeBaseDetail` | Base info, status, action buttons |
| Documents block | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeDocumentListItem`, `uploadKnowledgeDocument`, `deleteKnowledgeDocument`, `reprocessKnowledgeDocument` | Canonical place for document management |
| Document preview block | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeDocumentDetail` | Parsed text and task details |
| Segments block | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeSegmentItem` | Segment list and backend state badges |
| Tasks block | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeTaskItem` | Background processing history |
| Recall logs block | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeRecallLogItem`, `runKnowledgeRetrievalTest` | Retrieval test and recent logs |
| Agent references block | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeAgentReferenceItem` | Shows which agents bind the knowledge base |
| Empty / permission states | `apps/web/src/components/ui/empty-state.tsx`, `apps/web/src/components/ui/status-badge.tsx` | permission and loading state hooks | Reuse consistent state components |
