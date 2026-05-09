# Project UI Brief

- Page: 客户成功行动中心
- Route: `/customer-success-actions`
- Feature goal: 把客户成功计划拆成可负责人、可截止、可跟踪、可沉淀证据的后续执行动作，形成“客户评估 -> 岗位场景 -> 落地方案 -> 验收复盘 -> 成果资产 -> 客户成功计划 -> 成功行动”的运营闭环。
- APIs/services: `listCustomerSuccessActions`、`createCustomerSuccessAction`、`getCustomerSuccessAction`、`updateCustomerSuccessAction`、`deleteCustomerSuccessAction`；辅助读取 `listCustomerSuccessPlans`、`listDeliveryReviews`、`listDeliveryAssets`、`listSolutionPackages`、`listUsers`。
- Entities/fields/statuses: `CustomerSuccessActionListItem`、`CustomerSuccessActionDetail`、`CreateCustomerSuccessActionInput`、`UpdateCustomerSuccessActionInput`；行动类型 `MEETING`、`ASSET_REUSE`、`ROLLOUT`、`TRAINING`、`RENEWAL`、`RISK_REVIEW`、`FOLLOW_UP`；状态 `TODO`、`IN_PROGRESS`、`BLOCKED`、`DONE`、`CANCELLED`、`ARCHIVED`；优先级和风险等级 `LOW`、`MEDIUM`、`HIGH`。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、shadcn 风格 `Button`、`Card`、`Input`、`EmptyState`、`MetricCard`、`StatusBadge`，数据请求使用 `@tanstack/react-query`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied。
- IA constraints: 列表页只展示核心识别字段、类型、状态、优先级、风险等级、评分、行动摘要预览、下一步动作预览、负责人、关联计划和行内操作；完整预期结果、执行记录、阻塞风险、完成证据、内部备注必须进入详情页；新建和编辑使用独立页面，不塞进列表。
