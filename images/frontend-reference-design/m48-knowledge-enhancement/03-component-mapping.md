# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/knowledge/knowledge-content.tsx` | `KnowledgeOverview`, `KnowledgeBaseListItem` | 维持 `/knowledge` 列表页为主入口 |
| Top summary cards | `apps/web/src/components/ui/metric-card.tsx` | `KnowledgeOverview.summary` | 适合展示治理总览 |
| Filter toolbar | `apps/web/src/components/knowledge/knowledge-content.tsx` | `listKnowledgeBases` query params | 关键词、状态、可见范围、负责人 |
| Knowledge base table | `apps/web/src/components/knowledge/knowledge-content.tsx` | `KnowledgeBaseListItem` | 列表保留现有行操作 |
| Governance side panel | `apps/web/src/components/knowledge/knowledge-content.tsx` | `KnowledgeOverview.recent_*` | 新增治理视图区域 |
| Retrieval test card | `apps/web/src/components/knowledge/knowledge-content.tsx` | `KnowledgeRetrievalTestResult` | 保留检索测试能力 |
| Loading/empty/error states | `apps/web/src/components/ui/empty-state.tsx`, `apps/web/src/components/ui/metric-card.tsx` | query hooks | 需要覆盖 partial data |
