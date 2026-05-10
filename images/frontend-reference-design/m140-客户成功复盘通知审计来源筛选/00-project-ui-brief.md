# Project UI Brief

- Page: m140-客户成功复盘通知审计来源筛选
- Route: /security/alerts
- Feature goal: 客户成功复盘归档删除通知审计来源筛选、导出和归档
- Target users/permissions: 安全管理员、审计员、租户管理员；通知审计查看、导出和创建归档沿用 `security:rule:view`，删除审批入口仍在归档治理页和统一审批工作台。
- APIs/services: `listSecurityOperationAlertNotifications`, `exportSecurityOperationAlertNotifications`, `createSecurityOperationAlertNotificationArchive`, `getSecurityCenterOverview`, `notifySecurityOperationAlert`, `updateSecurityOperationAlert`。
- Entities/fields/statuses: `SecurityOperationAlertNotificationItem` 新增 `alert_category_label`；筛选参数 `alert_category` 支持 `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE`；通知状态 `SENT/PARTIAL/SKIPPED/FAILED`；核心字段 `alert_id`, `alert_category`, `alert_category_label`, `status`, `channels`, `targets`, `retry_count`, `request_id`, `trace_id`, `delivered_at`, `created_at`。
- Existing components/design system: Next.js App Router；Tailwind CSS；现有 `SecurityWorkspaceHeader`、`MetricCard`、`StatusBadge`、`Card`、`Button`、`EmptyState`、`LoadingRows`、`PageError`、`RefreshButton`、`SecurityConfirmDialog`。
- Page responsibility: `/security/alerts` 只展示运营告警、统一审批工作台、通知审计和 SLA 风险；通知审计列表保持紧凑，只展示来源、状态、短消息、重试次数和时间，不展示客户成功机会或复盘报告正文。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
