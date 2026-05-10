# Project UI Brief

- Page: M148 通知审计字段账本
- Route: /security/alerts
- Feature goal: 运营告警通知审计轻量展示审批导出字段账本
- Target users/permissions: 租户管理员、安全管理员、审计员；审批查看依赖 `security:approval:view`，运营告警动作依赖 `security:rule:view`。
- APIs/services: `listSecurityOperationAlertNotifications`, `exportSecurityOperationAlertNotifications`, `createSecurityOperationAlertNotificationArchive`, `getSecurityCenterOverview`。
- Entities/fields/statuses: `SecurityOperationAlertNotificationItem`，字段包括 `notification_event_id`, `alert_id`, `alert_category_label`, `status`, `channels`, `targets`, `message`, `retry_count`, `request_id`, `trace_id`, `created_at`, `exported_fields`, `notification_archive_filter_fields`；状态为 `SENT`, `PARTIAL`, `SKIPPED`, `FAILED`。
- Existing components/design system: Next.js App Router + React + TypeScript + Tailwind CSS；复用 `SecurityAlertsContent`, `SecurityWorkspaceHeader`, `Card`, `Button`, `StatusBadge`, `MetricCard`, `EmptyState`, `LoadingRows`, `PageError`。
- Required states: loading, empty, error, disabled export/archive, success notice, failure notice, permission提示。
- IA constraints: 通知审计列表只保留核心识别、状态、消息、重试次数和轻量字段账本提示；完整导出字段清单不在列表行展开，CSV 才承载完整字段范围。
