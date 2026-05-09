# Project UI Brief

- Page: 客户成功续约机会中心
- Route: `/customer-success-opportunities`
- Feature goal: 把客户成功计划和成功行动转成可负责人、可阶段推进、可金额预测、可风险跟踪的续约、扩展、增购、交叉销售和风险挽留机会，形成“验收复盘 -> 成果资产 -> 客户成功计划 -> 成功行动 -> 续约机会”的运营闭环。
- APIs/services: `listCustomerSuccessOpportunities`、`createCustomerSuccessOpportunity`、`getCustomerSuccessOpportunity`、`updateCustomerSuccessOpportunity`、`deleteCustomerSuccessOpportunity`；辅助读取 `listCustomerSuccessPlans`、`listCustomerSuccessActions`、`listDeliveryReviews`、`listDeliveryAssets`、`listSolutionPackages`、`listUsers`。
- Entities/fields/statuses: `CustomerSuccessOpportunityListItem`、`CustomerSuccessOpportunityDetail`、`CreateCustomerSuccessOpportunityInput`、`UpdateCustomerSuccessOpportunityInput`；机会类型 `RENEWAL`、`EXPANSION`、`UPSELL`、`CROSS_SELL`、`RISK_SAVE`；阶段 `DISCOVERY`、`QUALIFICATION`、`PROPOSAL`、`NEGOTIATION`、`WON`、`LOST`、`ARCHIVED`；状态 `OPEN`、`AT_RISK`、`WON`、`LOST`、`ARCHIVED`；优先级、信心等级、风险等级均为 `LOW`、`MEDIUM`、`HIGH`。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、shadcn 风格 `Button`、`Card`、`Input`、`EmptyState`、`MetricCard`、`StatusBadge`，数据请求使用 `@tanstack/react-query`，动效使用 `motion/react`，图标使用 `lucide-react`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied。
- IA constraints: 列表页只展示核心识别字段、机会类型、阶段、状态、优先级、信心/风险、评分、金额/概率、摘要预览、下一步动作预览、负责人、来源关系和行内操作；客户价值、商务策略、决策路径、风险摘要、输单原因和内部备注必须进入详情页；新建和编辑使用独立页面，不塞进列表。
