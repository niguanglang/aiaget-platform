# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | 复用现有安全中心布局，不新增独立页面 |
| 审批与归档运营卡片 | `ApprovalArchiveOperationsCard` | `SecurityCenterOverview.approval_operations` | M100 只扩展通知任务区域 |
| 通知任务中心 | `OperationAlertNotificationTaskCard` | `SecurityOperationAlertNotificationTaskOverview` | 从单一自动重试卡片升级为自动通知 + 自动重试 |
| 首发自动通知指标 | `MetricCard` / `SummaryTile` | `summary.pending_auto_notify_count`、`auto_notified_count`、`oldest_auto_notify_at` | 显示 SLA 死信归档删除告警首发通知工作量 |
| 自动重试指标 | `MetricCard` / `SummaryTile` | `summary.pending_auto_retry_count`、`failed_notification_count`、`partial_notification_count`、`retried_notification_count` | 保留 M87 能力 |
| 策略展示 | `SummaryTile` | `policy.auto_notify_*`、`policy.retry_*` | 清晰区分通知间隔、批量、退避、回看窗口 |
| 任务动作 | `Button` + `RefreshCw` | `runSecurityOperationAlertNotificationAutoNotify`、`runSecurityOperationAlertNotificationAutoRetry` | running/loading 时禁用 |
| 最近执行结果 | `OperationAlertNotificationTaskResult` | `SecurityOperationAlertNotificationTaskRunResult` | 需要支持 `AUTO_NOTIFY` 的 `notified_count` 字段 |
| 空状态 | `EmptyState` | summary pending count | 无待通知/无待重试时展示 |
| 错误反馈 | 页面已有 `actionError` | React Query mutation error | 复用现有错误条 |
