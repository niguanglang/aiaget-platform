# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 自愈建议卡片来源标签 | `NotificationTaskRecoverySuggestionItem` | `SecurityOperationAlertNotificationTaskRecoverySuggestion.failure_source` | 在风险/原因/状态旁展示失败来源。 |
| 自愈建议证据来源计数 | `NotificationTaskRecoverySuggestionItem` | `sla_dead_letter_failed_count`、`recovery_archive_delete_failed_count` | 复用 `StatusBadge` 展示 SLA 与自愈归档失败数。 |
| 建议处理动作 | `updateNotificationTaskRecoverySuggestion` | `POST /operation-alert-notification-task-recovery-suggestions/:id/actions` | 写入 `platform_event.payloadJson`，保留失败来源和来源计数。 |
| 审计检索来源筛选 | `OperationAlertNotificationTaskRecoveryAuditCard` | `ListSecurityOperationAlertNotificationTaskRecoveryAuditsParams.failure_source` | 新增来源 select，导出和归档复用该筛选。 |
| 审计行来源展示 | `OperationAlertNotificationTaskRecoveryAuditRow` | `SecurityOperationAlertNotificationTaskRecoveryAuditItem.failure_source` | 在原因/风险列展示来源 badge 和两个计数。 |
| 审计摘要来源计数 | `OperationAlertNotificationTaskRecoveryAuditCard` | `SecurityOperationAlertNotificationTaskRecoveryAuditOverview.summary` | 展示 SLA 来源、自愈来源、混合、未知。 |
| 后端事件映射 | `mapNotificationTaskRecoveryAuditEvent` | `platform_event.payloadJson` | 历史旧事件缺少字段时推断或降级为 `UNKNOWN`。 |
| CSV 导出 | `buildNotificationTaskRecoveryAuditCsv` | audit items | CSV 增加失败来源与两个来源计数字段。 |
| 产品文档 | `docs/product/m113-...md` | milestone traceability | 记录不迁移、不容器、不新增表边界。 |
