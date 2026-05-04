# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 告警卡片通知按钮 | `OperationAlertCard` in `apps/web/src/components/security/security-policy-content.tsx` | `notifySecurityOperationAlert` | Reuse existing manual notify mutation. |
| 告警卡片投递结果 | `OperationAlertCard` notification result block | `SecurityOperationAlertNotificationResult` | Add target role display next to channels/webhook. |
| 后端通知分类 | `securityOperationAlertCategory` | `SecurityCenterOperationalAlert.id` | M108 alert ids map to `NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE`. |
| 后端通知目标 | `securityOperationAlertNotificationTargets` | alert severity | Medium -> 安全管理员/审计员; High -> 租户管理员/安全管理员/审计员. |
| Webhook payload | `deliverSecurityOperationAlertWebhook` | `category`, `targets` | Existing payload already supports category and targets. |
| 投递事件 payload | `deliverOperationAlertNotification` | `alert_category`, `targets` | Existing platform event payload persists category and targets. |
| 投递审计列表 | `OperationAlertNotificationAuditCard` | `SecurityOperationAlertNotificationItem.alert_category` | Add “自愈归档删除” label and risk tone. |
| 重试 | Existing retry mutation and button | `retrySecurityOperationAlertNotification` | Keep failed/partial retry behavior unchanged. |
| 产品文档 | `docs/product/m109-...md` | milestone traceability | Document scope and M110 boundary. |
