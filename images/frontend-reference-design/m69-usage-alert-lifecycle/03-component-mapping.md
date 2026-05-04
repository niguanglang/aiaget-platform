# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 面板外壳 | `apps/web/src/components/platform-event-usage/platform-event-usage-panel.tsx` | `/monitor` 现有页面承载 | 不新增路由 |
| 告警队列卡片 | 新增局部 `UsageAlertLifecycleCard` | `PlatformUsageAlertOverview` | full view 展示 |
| 告警操作按钮 | `Button` | `updatePlatformUsageAlert` | 确认、升级、关闭 |
| 生命周期提示 | 本地 notice 状态 | mutation result/error | 中文提示 |
| 关联事件流 | 现有 `RecentEventCard` / `PlatformEventDetailCard` | lifecycle writes `platform_event` | 操作后刷新事件列表 |
| 通知目标 | 卡片内标签文本 | `notification_targets` | 第一版展示策略目标，不实际投递 |
