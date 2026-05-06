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
| Knowledge detail header | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeBaseDetail` | Base info, metrics, agent references, and entry actions only |
| Knowledge shared helpers | `apps/web/src/components/knowledge/knowledge-shared.tsx` | `KnowledgeBaseDetail`, status helpers | Header, metrics, confirm dialog, refresh helpers, permission helpers |
| Documents page | `apps/web/src/components/knowledge/knowledge-documents-content.tsx` | `getKnowledgeBase`, `getKnowledgeDocument`, `deleteKnowledgeDocument`, `reprocessKnowledgeDocument` | Canonical document management route |
| Upload page | `apps/web/src/components/knowledge/knowledge-upload-content.tsx` | `uploadKnowledgeDocument` | Standalone document upload route |
| Retrieval page | `apps/web/src/components/knowledge/knowledge-retrieval-content.tsx` | `runKnowledgeRetrievalTest`, `rebuildKnowledgeIndex` | Retrieval test, result panel, recall logs and index rebuild |
| Segments block | `knowledge-documents-content.tsx` | `KnowledgeSegmentItem` | Segment list and backend state badges tied to selected document |
| Tasks block | `knowledge-documents-content.tsx` | `KnowledgeTaskItem` | Background processing history tied to selected document/base |
| Recall logs block | `knowledge-retrieval-content.tsx` | `KnowledgeRecallLogItem` | Recent retrieval logs and latest test result |
| Agent references block | `knowledge-detail-content.tsx` | `KnowledgeAgentReferenceItem` | Shows which agents bind the knowledge base |
| Empty / permission states | `apps/web/src/components/ui/empty-state.tsx`, `apps/web/src/components/ui/status-badge.tsx` | permission and loading state hooks | Reuse consistent state components |
