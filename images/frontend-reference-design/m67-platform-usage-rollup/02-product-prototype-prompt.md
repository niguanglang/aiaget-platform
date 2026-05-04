# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform monitoring page.

Project context:
- Page/route: 监控中心 `/monitor`，现有 `PlatformEventUsagePanel`。
- Users/roles: 监控、审计、成本运营人员；操作需要 `monitor:log:view`。
- Main task flow: 用户选择时间窗口 -> 查看平台事件与用量指标 -> 必要时点击“重建汇总” -> 页面显示成功/失败提示 -> 概览、趋势和账本刷新 -> 用户检查 Rollup 汇总和账本明细。
- API/service contract: `getPlatformUsageOverview`, `listPlatformUsageTrends`, `listPlatformUsageLedger`, `listPlatformEvents`, `getPlatformEvent`, `rebuildPlatformUsageRollups`.
- Data entities and fields: summary metrics, recent rollups, usage trends, usage ledger, recent platform events, event detail, event relations.
- Actions and states: 刷新、重建汇总、筛选、搜索、清空、选择事件、按 Trace/Request 筛选；加载、空、错误、禁用、成功、失败。

Prototype requirements:
- Show a top header block with badges, title, description, and right-aligned action buttons: “重建汇总” and “刷新”.
- Include a visible success/error notice area below the toolbar.
- Show metric cards in a responsive grid.
- Show filter controls below metrics in the full view.
- Show two main cards: “用量趋势” and “Rollup 汇总”.
- Show lower cards for “用量账本”“平台事件”“事件详情”“事件关系”“最近账本”.
- Keep component boundaries obvious so implementation maps directly to existing `Card`, `Button`, `MetricCard`, `StatusBadge`, and `EmptyState`.
- Keep all labels Chinese and use compact enterprise dashboard spacing.

Avoid:
- new navigation structures
- unrelated create/edit dialogs
- backend fields not listed above
- polished decorative rendering that obscures information architecture
