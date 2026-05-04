# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 来源运营告警生成 | `buildApprovalOperationAlerts` | `ApprovalOperationStats.notification_task_*_failed_24h` | 基于 M112/M113 来源字段生成 SLA、自愈、混合来源告警。 |
| 来源告警分类 | `securityOperationAlertCategory` | `SecurityOperationAlertNotificationItem.alert_category` | 新来源告警归入通知任务风险或对应来源分类。 |
| 自动通知范围 | `SecurityOperationAlertNotificationTaskService` | `AUTO_NOTIFY_ALERT_IDS` | 新来源告警进入首发自动通知扫描范围。 |
| 运营告警卡片 | `OperationAlertCard` | `SecurityCenterOperationalAlert` | 展示来源分类 badge，复用生命周期和通知按钮。 |
| 通知投递审计 | `OperationAlertNotificationAuditCard` | `alert_category` | 投递列表展示来源型告警分类。 |
| 失败聚合提示 | `ApprovalArchiveOperationsCard` | `notification_task_sla_dead_letter_failed_24h`、`notification_task_recovery_archive_delete_failed_24h` | 在失败聚合下方提示来源告警会进入闭环。 |
| 产品文档 | `docs/product/m114-...md` | milestone traceability | 记录不迁移、不容器、不新增表边界。 |
