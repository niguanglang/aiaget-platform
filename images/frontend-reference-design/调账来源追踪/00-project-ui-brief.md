# Project UI Brief

- Page: 调账来源追踪
- Route: /billing/adjustments
- Feature goal: 在调账记录中展示来源对象并回链续约机会
- Users/permissions: 租户管理员或拥有 `billing:adjustment:manage` 的用户可创建、审批、应用、作废调账；普通有账单访问权限用户只读查看调账记录。
- APIs/services: `getBillingOverview({ window })` 返回 `BillingOverview.adjustments`；调账动作继续使用 `createBillingAdjustment`、`approveBillingAdjustment`、`applyBillingAdjustment`、`voidBillingAdjustment`。
- Entities/fields/statuses: `BillingAdjustmentItem` 字段包含 `adjustment_no`、`type`、`status`、`signed_amount`、`invoice_no`、`reason`、`source_type`、`source_id`、`created_at`；本次新增可选展示字段 `source_label`、`source_href`。来源 `CUSTOMER_SUCCESS_OPPORTUNITY` 回链到 `/customer-success-opportunities/:id`。
- Existing components/design system: Next.js App Router、React Query、Tailwind CSS、shadcn 风格 `Button`、`Card`、`Input`、`EmptyState`、`MetricCard`、`StatusBadge`，沿用 `BillingWorkspaceHeader`、`BillingConfirmDialog`、`Field`、`SegmentedSelect`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
- IA constraints: 调账列表只展示来源摘要和跳转，不嵌入续约机会详情、成交入账表单或机会编辑动作；成交入账仍属于续约机会详情页。
