# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 通知任务中心 | `OperationAlertNotificationTaskCard` in `apps/web/src/components/security/security-policy-content.tsx` | `SecurityOperationAlertNotificationTaskOverview` | Reuse existing card; update M110 badges and text. |
| 首发自动通知指标 | `MetricCard` | `pending_auto_notify_count`, `auto_notified_count`, `oldest_auto_notify_at` | Text should mention SLA 死信 + 自愈归档删除. |
| 最近执行结果 | `OperationAlertNotificationTaskResult` | `last_auto_notify_result` | No API change. |
| 手动触发自动通知 | Existing `onRunAutoNotify` mutation | `runSecurityOperationAlertNotificationAutoNotify` | Scope expands via backend alert id set. |
| 自动通知扫描范围 | `AUTO_NOTIFY_ALERT_IDS` in `security-operation-alert-notification-task.service.ts` | alert ids | Add M108/M109 self-healing archive delete alert ids. |
| 通知 note/error 文案 | `runAutoNotifyForTenant` | notification result/task event | Make message generic: SLA 死信与自愈归档删除审批运营告警. |
| 自动重试 | Existing auto retry section | retryable notifications | Unchanged. |
| 产品文档 | `docs/product/m110-...md` | milestone traceability | Document scope, ids, and no migration/container boundary. |
