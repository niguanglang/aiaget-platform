# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 知识库活动总览 | `KnowledgeActivityContent` | `getKnowledgeOverview` / `KnowledgeOverview` | 只保留最近文档、任务/召回入口和摘要指标。 |
| 文档处理任务 | `KnowledgeTasksContent` | `getKnowledgeOverview.recent_tasks` | 独立展示任务队列与任务指标。 |
| 召回记录 | `KnowledgeRecallsContent` | `getKnowledgeOverview.recent_recall_logs` | 独立展示召回记录与 24 小时成功率。 |
| 工具执行记录 | `ToolLogsContent` | `listTools` / `ToolListItem` | 当前后端没有全局日志接口，先用工具列表的调用摘要形成独立执行记录页。 |
| 平台事件总览 | `PlatformUsageOverviewContent` | `getPlatformUsageOverview` | 只放摘要、入口、Rollup、事件关系，不再渲染事件表、账本、趋势图。 |
| 平台事件 | `PlatformUsageEventsContent` | `listPlatformEvents` | 独立筛选和事件表。 |
| 用量账本 | `PlatformUsageLedgerContent` | `listPlatformUsageLedger` | 独立筛选和账本列表。 |
| 用量趋势 | `PlatformUsageTrendsContent` | `listPlatformUsageTrends` | 独立筛选和趋势/Rollup。 |
| 授权菜单 | `apps/control-api/prisma/seed.ts` | `defaultMenus` | 只改源码种子，不执行数据库 seed。 |
| 侧边栏图标 | `menu-navigation.ts` | `AuthorizedMenuItem.code` | 为新增菜单 code 补图标映射。 |
