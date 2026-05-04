# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 投递审计卡片 | `PlatformEventUsagePanel` 新增 `UsageAlertNotificationAuditCard` | `PlatformUsageAlertNotificationOverview` | 位于告警生命周期卡片下方 |
| 状态筛选 | 原生 `select` + Tailwind | `status?: PlatformUsageAlertNotificationStatus` | 全部、已投递、部分成功、已跳过、失败 |
| 审计摘要 | `AnomalySummaryTile` | overview.summary | 复用现有小统计块 |
| 审计列表 | `Card` 内列表 + `motion.div` | `PlatformUsageAlertNotificationItem[]` | 中文标签，技术 ID 截断 |
| 重试操作 | `Button` | `retryPlatformUsageAlertNotification` | 仅 FAILED / PARTIAL 可操作 |
| 结果反馈 | 现有 `rollupNotice` | `PlatformUsageAlertNotificationResult` | 成功、失败统一提示 |
