# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 告警卡片通知按钮 | `OperationAlertCard` | `notifySecurityOperationAlert` | 复用现有通知按钮 |
| 后端通知目标 | `securityOperationAlertNotificationTargets` | `SecurityCenterOperationalAlert.id` | SLA 死信归档删除告警定向安全/审计/高危租户管理员 |
| Webhook payload | `deliverSecurityOperationAlertWebhook` | alert id/title/metric | 增加 category 和 targets |
| 投递事件 payload | `deliverOperationAlertNotification` | `SecurityOperationAlertNotificationItem` | 增加 `alert_category` |
| 投递审计列表 | `OperationAlertNotificationAuditCard` / row | `listSecurityOperationAlertNotifications` | 增加 SLA 死信归档删除标识 |
| 重试 | existing retry mutation | retry API | 保持现有流程 |
