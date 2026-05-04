# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 自动重试任务卡片 | `PlatformEventUsagePanel` 新增 `UsageAlertNotificationTaskCard` | `PlatformUsageAlertNotificationTaskOverview` | 放在投递审计卡片前或后 |
| 任务摘要指标 | `MetricCard` | overview.summary | 待自动重试、失败投递、部分成功、已重试 |
| 调度状态 | `Card` + `DetailRow` | scheduler_enabled, running, last_tick_at | 复用现有详情行 |
| 最近执行结果 | `Card` + `StatusBadge` | last_auto_retry_result | 展示 SUCCESS / FAILED / SKIPPED |
| 手动执行 | `Button` | `runPlatformUsageAlertNotificationAutoRetry` | 执行中禁用 |
| 结果反馈 | 现有 `rollupNotice` | task result | 中文提示 |
