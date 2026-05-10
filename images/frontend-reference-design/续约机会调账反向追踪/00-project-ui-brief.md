# Project UI Brief

- Page: 续约机会调账反向追踪
- Route: /customer-success-opportunities/:id
- Feature goal: 在续约机会详情页展示成交入账调账摘要并提供账单与审计入口
- Users/permissions: 租户管理员、客户成功负责人、财务运营；成交入账需要 `customer:success_opportunity:manage` 与 `billing:adjustment:manage`，调账摘要为详情只读信息。
- APIs/services: `getCustomerSuccessOpportunity(id)` 返回 `CustomerSuccessOpportunityDetail`；成交入账仍使用 `closeWonCustomerSuccessOpportunity(id, input)`；前端已有 `/billing/adjustments`、`/audit` 路由可作为追踪入口。
- Entities/fields/statuses: `CustomerSuccessOpportunityDetail.billing_adjustments`，元素为 `BillingAdjustmentItem`，展示 `adjustment_no`、`type`、`status`、`signed_amount`、`invoice_no`、`reason`、`effective_at`、`source_type/source_id`。
- Existing components/design system: Next.js App Router、React Query、Tailwind CSS、shadcn 风格 `Card`、`Button`、`StatusBadge`，沿用当前续约机会详情页的 `CloseWonAdjustmentCard`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
- IA constraints: 续约机会详情页可展示与当前机会强关联的调账摘要和入口，但不能承接调账审批、作废、应用等财务操作；这些动作仍属于 `/billing/adjustments`。
