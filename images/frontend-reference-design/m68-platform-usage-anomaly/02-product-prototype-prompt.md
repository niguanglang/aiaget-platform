# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform monitoring page.

Project context:
- Page/route: 监控中心 `/monitor`，现有 `PlatformEventUsagePanel`。
- Users/roles: 监控、审计、成本运营人员；操作需要 `monitor:log:view`。
- Main task flow: 用户选择时间窗口 -> 查看 Rollup 汇总 -> 点击“检测异常” -> 页面显示成功/失败提示 -> 展示异常信号列表 -> 检测结果写入统一事件流。
- API/service contract: `detectPlatformUsageAnomalies({ window })`, `getPlatformUsageOverview`, `listPlatformUsageTrends`, `listPlatformUsageLedger`.
- Data entities and fields: anomaly summary, anomaly items, rollup metrics, usage trend, usage ledger.
- Actions and states: 检测异常、刷新、重建 Rollup、筛选、搜索；加载、空、错误、禁用、成功、失败。

Prototype requirements:
- Show a top header block with “检测异常”“重建 Rollup”“刷新” action buttons.
- Include a notice area for detection result.
- Add an “异常信号” card with summary badges and a list of anomaly rows.
- Each anomaly row must show severity, type, metric/resource, current value, baseline, ratio, threshold, detected time.
- Keep component boundaries obvious for mapping to existing `Card`, `Button`, `StatusBadge`, `EmptyState`.
- Keep all labels Chinese and use compact enterprise dashboard spacing.

Avoid:
- new navigation structures
- unrelated dialogs
- backend fields not listed above
