# Project UI Brief

- Page: M138 客户成功复盘归档删除运营闭环
- Route: /security/alerts
- Feature goal: 安全中心告警运营页接入客户成功成交复盘报告归档删除审批指标、筛选与告警
- Target users/permissions: 安全管理员、审计员、租户管理员；查看需要 `security:approval:view`，处理审批需要 `security:approval:handle`，运营告警动作沿用 `security:rule:view`。
- APIs/services: `getSecurityCenterOverview` 读取 `approval_operations` 与 `operational_alerts`；`getSecurityApprovalWorkbenchOverview`、`listSecurityApprovalWorkbenchItems`、`getSecurityApprovalWorkbenchItem`、`reviewSecurityApprovalWorkbenchItem` 支撑统一审批工作台；`notifySecurityOperationAlert`、`updateSecurityOperationAlert` 支撑告警通知和生命周期动作。
- Entities/fields/statuses: `SecurityApprovalWorkbenchType` 新增 `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE`；`SecurityCenterOverview.approval_operations` 新增 `customer_success_close_won_report_archive_delete_pending/approved/rejected/applied`；审批状态为 `PENDING/APPROVED/REJECTED/APPLIED`，风险域为 `AUDIT_ARCHIVE`。
- Existing components/design system: Next.js App Router；Tailwind CSS；现有 `SecurityWorkspaceHeader`、`MetricCard`、`StatusBadge`、`Card`、`Button`、`SecurityConfirmDialog`、`LoadingRows`、`EmptyState`、`PageError`。
- Page responsibility: `/security/alerts` 只展示告警运营、统一审批筛选、审批详情和运营告警动作；不承载客户成功续约机会列表、成交复盘报告正文或对象存储归档列表。
- Actions: 审批类型筛选增加“客户成功复盘归档删除”；运营指标展示待审/批准/拒绝/生效；详情页仍通过统一审批接口通过/拒绝；原来源缓存失效包含客户成功复盘归档审批和归档列表。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
