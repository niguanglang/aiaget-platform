# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Header badges | `KnowledgeContent`, `KnowledgeDetailContent` | static capability labels | Add OpenSearch keyword badge |
| Segment backend badges | `SegmentsCard` | `KnowledgeSegmentItem.keyword_backend`, `keyword_index` | Show OpenSearch vs local fallback |
| Retrieval panel copy | `RetrievalCard` | `runKnowledgeRetrievalTest` | Explain Qdrant + OpenSearch score fusion |
| Indexing backend | `KnowledgeService.processDocument`, `rebuildIndex` | `OpenSearchService.indexSegments` | Index text after segment creation |
| Delete/reprocess cleanup | `KnowledgeService.removeDocument`, `reprocessDocument` | `OpenSearchService.deleteDocumentSegments` | Delete indexed docs by tenant/knowledge/document |
| Search scoring | `scoreSegments` | `QdrantService.searchSegments`, `OpenSearchService.searchSegments` | HYBRID fuses normalized keyword and vector scores |
| Shared types | `packages/shared-types/src/index.ts` | `KnowledgeSegmentItem` | Add keyword backend/index fields |
