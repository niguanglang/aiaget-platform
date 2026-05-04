# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform monitoring page.

Project context:
- Product/module: 企业 AI Agent 平台，告警通知重试与投递审计中心。
- Page/route: 监控中心 `/monitor` 内的统一平台事件与用量底座面板。
- Target users/roles: 具备 `monitor:log:view` 权限的监控、审计、成本运营人员。
- Business goal: 将 M70 的告警通知投递记录升级为可查询、可审计、失败可重试的运营闭环。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`StatusBadge`、`EmptyState`、lucide icons、React Query。
- Existing page shell/layout: SaaS 管理后台，左侧导航和内容区；当前面板为 Dashboard/Bento Grid 风格，不新增页面。

Interface contract that must appear in the UI:
- API/service functions: `listPlatformUsageAlertNotifications`, `retryPlatformUsageAlertNotification`, `notifyPlatformUsageAlert`.
- Main entities and fields: 通知事件 ID、告警 ID、投递状态、通知渠道、通知目标、Webhook HTTP 状态、Webhook 错误、重试次数、原始投递事件、投递时间。
- Status values/enums: notification status `SENT`, `PARTIAL`, `SKIPPED`, `FAILED`; channels `IN_APP`, `WEBHOOK`.
- User actions: 按状态筛选、查看告警事件、重试失败投递、刷新。
- Required states: 加载态、空状态、操作中禁用、重试成功、重试失败提示。

Design requirements:
- Make it look like a production enterprise operations console.
- Add a compact audit card below the alert lifecycle card.
- Use restrained warning treatment; failed delivery rows should be easy to scan without overwhelming the page.
- All visible labels must be Chinese, except technical IDs.
- Keep the audit list dense, readable, and aligned with existing monitor dashboard cards.

Avoid:
- new navigation or standalone notification center pages
- fake channels beyond `IN_APP` and `WEBHOOK`
- decorative clutter, exaggerated glow, emoji
