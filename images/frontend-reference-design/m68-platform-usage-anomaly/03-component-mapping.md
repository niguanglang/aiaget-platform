# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 面板外壳 | `apps/web/src/components/platform-event-usage/platform-event-usage-panel.tsx` | `/monitor` 现有页面承载 | 复用现有组件，不新增路由 |
| 顶部操作条 | `Card` + `Button` + `StatusBadge` | `detectPlatformUsageAnomalies` / `rebuildPlatformUsageRollups` | full view 显示检测与重建按钮 |
| 异常反馈提示 | 本地 notice 状态 + Tailwind 提示条 | mutation result/error | 中文成功/失败提示 |
| 异常信号卡片 | 新增局部 `UsageAnomalyCard` | `PlatformUsageAnomalyOverview` | 展示摘要和异常列表 |
| 用量趋势 | `UsageTrendCard` | `PlatformUsageTrendPoint[]` | 与异常卡并列展示 |
| Rollup 汇总 | `RollupCard` | `PlatformUsageRollupItem[]` | 检测依赖 Rollup 数据 |
| 统一事件流 | 现有 `RecentEventCard` / `PlatformEventDetailCard` | detection writes `platform_event` | 检测事件可被事件流查询 |
