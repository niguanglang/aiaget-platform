# Project UI Brief

- Page: M172 Security Alert SLA Persistent View
- Route: /security/alerts
- Feature goal: SLA 自动重试与死信持久化字段展示
- Target users/permissions: 安全管理员、租户管理员、审计员；页面已有 `security:approval:view` 与 `security:approval:handle` 权限提示，SLA 持久化视图仅做只读审计展示。
- APIs/services: `getSecurityOperationAlertSlaOverview()`、`getSecurityOperationAlertSlaNotificationRetryOverview()`、`getSecurityOperationAlertSlaDeadLetterOverview()`。
- Entities/fields/statuses: `SecurityOperationAlertSlaNotificationRetryOverview.retryable_items/dead_letter_items`，展示 `notification_event_id`、`title`、`status`、`retry_count`、`source_system`、`source_id`、`dedupe_key`、`request_id`、`trace_id`、`replay_key`、`delivered_at`；`SecurityOperationAlertSlaDeadLetterOverview.items` 额外展示 `disposition_status`、`latest_action`、`latest_action_event_id`、`latest_action_at`。
- Existing components/design system: 复用 `SecurityWorkspaceHeader`、`Card`、`MetricCard`、`StatusBadge`、`EmptyState`、`PageError`、`LoadingRows`、`RefreshButton`、`shortId`、`formatDateTime`。
- Required states: SLA 三个查询都需要 loading、empty、error；无权限时沿用页面现有审批权限提示；没有操作按钮，不新增确认弹窗。
- Page responsibility: 安全告警运营页展示审批、运营告警、通知审计和 SLA 摘要；M172 只补自动重试与死信持久化字段的轻量审计区域，不承载完整死信处理表单或归档治理。
