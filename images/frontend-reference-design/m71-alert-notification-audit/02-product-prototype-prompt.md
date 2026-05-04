# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform monitoring page.

Project context:
- Page/route: 监控中心 `/monitor`，现有 `PlatformEventUsagePanel`。
- Users/roles: 监控、审计、成本运营人员；操作需要 `monitor:log:view`。
- Main task flow: 用户检测异常 -> 告警投递通知 -> 投递记录进入审计列表 -> 用户筛选失败记录 -> 点击重试 -> 后端重新投递并写入新的统一事件 -> 审计列表刷新。
- API/service contract: `listPlatformUsageAlertNotifications({ window, status, alert_id })`, `retryPlatformUsageAlertNotification(notificationEventId)`.
- Data entities and fields: notification result, notification audit item, retry relation.
- Actions and states: 状态筛选、重试、查看事件、刷新；加载、空、错误、禁用、成功、失败。

Prototype requirements:
- Show the notification audit card below the alert lifecycle card.
- Show summary tiles for total, failed, partial, retried.
- Show a filter row for status.
- Each audit row should show alert ID, status, channels, webhook status/error, retry count and delivered time.
- Failed or partial rows should expose a compact “重试” button.

Avoid:
- new pages, drawers, modals
- invented notification templates or subscription management
- visual clutter
