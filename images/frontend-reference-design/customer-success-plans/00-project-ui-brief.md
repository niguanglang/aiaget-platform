# Project UI Brief

- Page: 客户成功计划中心
- Route: `/customer-success-plans`
- Feature goal: 把交付验收复盘与成果资产转成客户成功运营计划，形成“客户评估 -> 岗位场景 -> 落地方案 -> 验收复盘 -> 成果资产 -> 客户成功计划”的可运营闭环。
- APIs/services: `listCustomerSuccessPlans`、`createCustomerSuccessPlan`、`getCustomerSuccessPlan`、`updateCustomerSuccessPlan`、`deleteCustomerSuccessPlan`；辅助读取 `listDeliveryReviews`、`listDeliveryAssets`、`listSolutionPackages`、`listUsers`。
- Entities/fields/statuses: `CustomerSuccessPlanListItem`、`CustomerSuccessPlanDetail`、`CreateCustomerSuccessPlanInput`、`UpdateCustomerSuccessPlanInput`；计划阶段 `DISCOVERY`、`EXPANSION_DESIGN`、`PILOT_ROLLOUT`、`RENEWAL_PREP`、`CLOSED`；状态 `DRAFT`、`ACTIVE`、`BLOCKED`、`COMPLETED`、`ARCHIVED`；优先级和健康度 `LOW`、`MEDIUM`、`HIGH`。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、shadcn 风格 `Button`、`Card`、`Input`、`EmptyState`、`MetricCard`、`StatusBadge`，数据请求使用 `@tanstack/react-query`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied。
- IA constraints: 列表页只展示核心识别字段、阶段、状态、优先级、健康度、评分、扩展预览、下一步动作和行内操作；完整成功目标、干系人计划、资产复用计划、续约计划、风险摘要必须进入详情页；新建和编辑使用独立页面，不塞进列表。
