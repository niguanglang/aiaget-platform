# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `KnowledgeContent`, `KnowledgeDetailContent` | Console routes `/knowledge`, `/knowledge/[id]` | Reuse existing knowledge pages |
| Header badges | `KnowledgeContent`, `KnowledgeDetailContent` | Static milestone/capability labels | Add M26 and Qdrant labels |
| Segment backend display | `SegmentsCard` | `KnowledgeSegmentItem.vector_backend`, `vector_collection` | Badge Qdrant vs fallback |
| Retrieval copy | `RetrievalCard` | `runKnowledgeRetrievalTest` | State that Qdrant is preferred |
| Backend indexing | `KnowledgeService.processDocument`, `rebuildIndex` | `QdrantService.upsertSegments` | Keep PostgreSQL vectors as fallback |
| Reprocess/delete cleanup | `KnowledgeService.reprocessDocument`, `removeDocument` | `QdrantService.deleteDocumentSegments` | Delete Qdrant points by tenant/knowledge/document filter |
| Shared types | `packages/shared-types/src/index.ts` | `KnowledgeSegmentItem` | Add vector backend fields |
| Validation | typecheck/lint and API smoke | existing dev services | No middleware/container startup |
