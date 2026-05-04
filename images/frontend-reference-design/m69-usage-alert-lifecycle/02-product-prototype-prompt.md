# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform monitoring page.

Project context:
- Page/route: 监控中心 `/monitor`，现有 `PlatformEventUsagePanel`。
- Users/roles: 监控、审计、成本运营人员；操作需要 `monitor:log:view`。
- Main task flow: 用户检测异常 -> 异常事件进入告警队列 -> 用户确认/升级/关闭 -> 生命周期动作写入统一事件流 -> 队列刷新并显示最新状态。
- API/service contract: `listPlatformUsageAlerts({ window })`, `updatePlatformUsageAlert(alertId, { action, note })`, `detectPlatformUsageAnomalies({ window })`.
- Data entities and fields: alert summary, alert items, lifecycle events, notification targets.
- Actions and states: 确认、升级、关闭、刷新、检测异常；加载、空、错误、禁用、成功、失败。

Prototype requirements:
- Show a “告警生命周期” card below the anomaly detection card.
- Header shows open/acknowledged/escalated/closed counts.
- Each alert row shows status badge, severity badge, title, summary, anomaly count, notification targets, timestamps, and three action buttons.
- Keep component boundaries obvious for mapping to existing `Card`, `Button`, `StatusBadge`, `EmptyState`.
- Use compact enterprise dashboard spacing and Chinese labels.

Avoid:
- new pages or modals
- invented fields beyond the interface contract
- visual clutter
