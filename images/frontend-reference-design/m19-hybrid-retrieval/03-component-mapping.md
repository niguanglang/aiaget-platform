# Component Mapping

Reference images are not committed yet for M19. This implementation follows the current knowledge detail surface.

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Retrieval tester | `apps/web/src/components/knowledge/knowledge-detail-content.tsx` | `KnowledgeRetrievalTestResult` | Existing card upgraded to show keyword/vector breakdown. |
| Segment metadata | `SegmentsCard` in `knowledge-detail-content.tsx` | `KnowledgeSegmentItem.embedding_model` | Surfaces the actual embedding source used for the segment. |
| Knowledge overview copy | `knowledge-content.tsx`, `knowledge-detail-content.tsx` | existing knowledge APIs | Updates milestone copy and capability framing to match hybrid retrieval. |
| Backend scorer | `apps/control-api/src/knowledge/knowledge.service.ts` | live retrieval and retrieval test path | Same scorer powers both the page tester and live conversation retrieval. |
