# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform monitoring page.

Project context:
- Page/route: 监控中心 `/monitor`，现有 `PlatformEventUsagePanel`。
- Users/roles: 监控、审计、成本运营人员；操作需要 `monitor:log:view`。
- Main task flow: 用户检测异常 -> 告警进入队列 -> 用户点击“通知” -> 后端记录站内通知并尝试外部 Webhook -> 前端显示投递状态 -> 统一事件流记录投递事件。
- API/service contract: `notifyPlatformUsageAlert(alertId, { channels, note })`, `listPlatformUsageAlerts({ window })`.
- Data entities and fields: notification result, alert lifecycle item, notification targets.
- Actions and states: 通知、确认、升级、关闭、查看事件；加载、空、错误、禁用、成功、部分成功、跳过、失败。

Prototype requirements:
- Show notification action inside each alert row next to lifecycle actions.
- Show a small delivery result notice at top of the panel.
- Each alert row should show notification targets and last state.
- Keep layout compact and readable.

Avoid:
- new pages or modals
- invented channel marketplace UI
- visual clutter
