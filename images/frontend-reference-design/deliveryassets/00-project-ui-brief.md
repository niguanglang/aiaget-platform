# Project UI Brief

- Page: 成果资产中心
- Route: `/delivery-assets`
- Feature goal: 把交付验收复盘沉淀为可复用成果资产，形成“客户评估 -> 岗位场景 -> 落地方案 -> 验收复盘 -> 成果资产”的运营闭环。
- APIs/services: `listDeliveryAssets`、`createDeliveryAsset`、`getDeliveryAsset`、`updateDeliveryAsset`、`deleteDeliveryAsset`；辅助读取 `listDeliveryReviews`、`listSolutionPackages`、`listUsers`、`listSkills`、`listAgents`、`listKnowledgeBases`。
- Entities/fields/statuses: `DeliveryAssetListItem`、`DeliveryAssetDetail`、`CreateDeliveryAssetInput`、`UpdateDeliveryAssetInput`；资产类型 `SOLUTION_TEMPLATE`、`ACCEPTANCE_CHECKLIST`、`RISK_CHECKLIST`、`PROMPT_SOP`、`CUSTOMER_CASE`、`REPORT_ARCHIVE`；状态 `DRAFT`、`REVIEWING`、`PUBLISHED`、`RETIRED`、`ARCHIVED`；可见范围 `PRIVATE`、`TEAM`、`TENANT`、`PUBLIC`。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、shadcn 风格 `Button`、`Card`、`Input`、`EmptyState`、`MetricCard`、`StatusBadge`，数据请求使用 `@tanstack/react-query`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied。
- IA constraints: 列表页只展示核心识别字段、状态、可见范围、复用评分、摘要预览和行内操作；完整业务价值、复用指引、来源上下文、风险说明和关联资源必须进入详情页；新建和编辑使用独立页面，不塞进列表。
