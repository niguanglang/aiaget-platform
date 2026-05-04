# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 告警生命周期卡片 | `UsageAlertLifecycleCard` | `PlatformUsageAlertOverview` | 增加“通知”按钮 |
| 通知操作 | `Button` | `notifyPlatformUsageAlert` | 默认发送 `IN_APP` + `WEBHOOK` |
| 投递结果提示 | 本地 notice 状态 | `PlatformUsageAlertNotificationResult` | 中文提示 |
| 通知目标展示 | 告警行内文本 | `notification_targets` | M69 已有目标 |
| 统一事件流 | `RecentEventCard` | notification writes `platform_event` | 操作后刷新事件 |
