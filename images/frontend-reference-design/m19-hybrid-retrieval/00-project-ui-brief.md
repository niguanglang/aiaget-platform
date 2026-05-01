# Project UI Brief

- Project: Enterprise Agent Platform
- Page: M19 Hybrid Retrieval
- Route: `/knowledge/[id]`
- Feature goal: expose real vector and hybrid retrieval behavior on the knowledge detail page while keeping live conversations on the same scoring logic
- Parent layout: protected console shell, knowledge detail page, retrieval tester, segment inspector
- Target users: tenant operators and admins validating retrieval quality and grounding behavior

## APIs and Services

- `runKnowledgeRetrievalTest`
- knowledge document processing on upload/reprocess
- live retrieval through `KnowledgeService.retrieveAgentReferences(...)`

## Entities and Fields

- segment fields:
  - `embedding_model`
  - `vector_status`
  - `index_status`
- retrieval result fields:
  - `score`
  - `keyword_score`
  - `vector_score`
- recall log:
  - `mode`
  - `result_count`

## Existing Components and Design System

- `KnowledgeDetailContent`
- `KnowledgeContent`
- `StatusBadge`, `Card`, `MetricCard`, `Button`

## Required States

- loading:
  - document processing
  - retrieval execution
- success:
  - embedding model visible on segments
  - retrieval results show keyword/vector breakdown
- fallback:
  - no provider embedding model available -> local vector mode still works

## Constraints

- Keep all visible UI copy in Chinese.
- Do not require a new vector middleware or container.
- Retrieval tester and live conversation retrieval must use the same ranking strategy.
