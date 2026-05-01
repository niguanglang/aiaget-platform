# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/knowledge/knowledge-content.tsx`, `knowledge-detail-content.tsx` | Console route shell and auth guard | Reuse existing module pages |
| Upload drawer | `KnowledgeDocumentFormPanel` | `UploadKnowledgeDocumentInput` | Add Chinese custom file picker, file summary, MinIO storage note |
| Knowledge list upload action | `KnowledgeContent` | `uploadKnowledgeDocument` | Keep existing mutation, pass MIME type and file name |
| Detail upload action | `KnowledgeDetailContent` | `uploadKnowledgeDocument` | Same form component reused |
| Document table | `DocumentsCard` | `KnowledgeDocumentListItem.storage_path` | Add storage path/source display without exposing secrets |
| Document detail card | `DocumentDetailCard` | `KnowledgeDocumentDetail.storage_path` | Show object storage path, parsed text, tasks |
| Backend persistence | `KnowledgeService.uploadDocument` | `knowledge_document.storage_path`, `StorageService.uploadObject` | Store original content in MinIO before processing |
| Shared type contract | `packages/shared-types/src/index.ts` | `KnowledgeDocumentListItem` | Add `storage_path` field backed by existing DB column |
| Feedback states | existing mutation error/loading states | React Query errors | Preserve disabled and error behavior |
