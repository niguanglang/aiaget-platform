# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform monitoring page.

Project context:
- Page/route: 监控中心 `/monitor`，现有 `PlatformEventUsagePanel`。
- Users/roles: 监控、审计、成本运营人员；操作需要 `monitor:log:view`。
- Main task flow: 系统扫描失败/部分成功的告警投递 -> 符合退避和重试次数条件 -> 自动调用重试 -> 写入新的投递事件和任务事件 -> 前端展示任务结果。
- API/service contract: `getPlatformUsageAlertNotificationTaskOverview()`, `runPlatformUsageAlertNotificationAutoRetry()`.
- Data entities and fields: task overview, task run result, notification audit items.
- Actions and states: 刷新任务、立即扫描重试；加载、空、执行中、成功、失败。

Prototype requirements:
- Show one task card with status badges at top.
- Show 4 metric tiles: 待自动重试、失败投递、部分成功、已重试。
- Show a scheduler status block: 任务开关、运行状态、最近扫描、扫描间隔、最近失败。
- Show latest run result block: 扫描、重试、成功、失败、跳过。
- Show a manual “立即扫描重试” button.

Avoid:
- new pages or modals
- policy editing controls
- invented queue storage or middleware settings
