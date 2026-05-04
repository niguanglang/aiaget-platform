# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 面板外壳 | `apps/web/src/components/platform-event-usage/platform-event-usage-panel.tsx` | `/monitor` 现有页面承载 | 复用现有组件，不新增路由 |
| 顶部说明与操作条 | `Card` + `Button` + `StatusBadge` | `getPlatformUsageOverview` / `rebuildPlatformUsageRollups` | 新增“重建汇总”按钮，仅 full view 显示 |
| 成功/失败反馈 | 当前组件本地 `notice` 状态 + Tailwind 提示条 | rebuild mutation result/error | 中文提示，成功后刷新 overview/trends/ledger |
| 指标卡片 | `MetricCard` | `PlatformEventUsageOverview.summary` | 保持现有字段 |
| 筛选区 | `PlatformEventFilters` | list queries params | 不改接口字段 |
| 用量趋势 | `UsageTrendCard` | `PlatformUsageTrendPoint[]` | 重建成功后 refetch |
| Rollup 汇总 | `RollupCard` | `PlatformUsageRollupItem[]` | 读取 overview.recent_rollups |
| 用量账本 | `RecentUsageCard` / `RecentLedgerCard` | `PlatformUsageLedgerItem[]` | 重建成功后 refetch ledger |
| 平台事件与详情 | `RecentEventCard` / `PlatformEventDetailCard` | `PlatformEventListItem` / `PlatformEventDetail` | M67 不改事件列表逻辑 |
