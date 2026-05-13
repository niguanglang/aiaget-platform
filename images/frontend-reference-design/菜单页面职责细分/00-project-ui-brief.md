# Project UI Brief

- Page: 菜单页面职责细分
- Route: `/knowledge/activity`, `/knowledge/tasks`, `/knowledge/recalls`, `/tools/logs`, `/monitor/platform-usage`, `/monitor/platform-usage/events`, `/monitor/platform-usage/ledger`, `/monitor/platform-usage/trends`
- Feature goal: 把后台中仍混合多个业务对象的页面拆成“总览 + 独立对象列表”，降低列表页信息密度，避免把任务、日志、趋势等明细全部塞进同一页。
- Target users and permissions: 租户管理员、知识库管理员、工具管理员、监控/审计人员；沿用 `knowledge:base:view`、`tool:definition:view`、`monitor:log:view` 等已有权限。
- APIs/services: `getKnowledgeOverview`, `listTools`, `getPlatformUsageOverview`, `listPlatformEvents`, `listPlatformUsageLedger`, `listPlatformUsageTrends`。
- Entities/fields/statuses: 知识库文档、文档处理任务、知识召回记录、工具调用摘要、平台事件、用量账本、用量趋势、Rollup 汇总、事件关系。
- Existing components/design system: Next.js App Router、React Query、Tailwind、`Button`、`Card`、`MetricCard`、`StatusBadge`、`EmptyState`、知识库和平台用量现有共享组件。
- Required states: loading, empty, error, disabled refresh, permission-denied by upstream route/API.
- IA constraint: 列表页只保留筛选、核心字段、行内详情入口；活动/用量总览只放指标、入口和轻量关联信息，不再承载完整明细列表。
