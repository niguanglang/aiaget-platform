# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform monitoring page.

Project context:
- Product/module: 企业 AI Agent 平台，告警通知投递适配。
- Page/route: 监控中心 `/monitor` 内的统一平台事件与用量底座面板。
- Target users/roles: 具备 `monitor:log:view` 权限的监控、审计、成本运营人员。
- Business goal: 将用量告警发送到站内通知记录和外部 Webhook，并展示投递状态。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`StatusBadge`、`EmptyState`、lucide icons、React Query。
- Existing page shell/layout: SaaS 管理后台，左侧导航和内容区；当前面板为 Dashboard/Bento Grid 风格，不新增页面。

Interface contract that must appear in the UI:
- API/service functions: `notifyPlatformUsageAlert`, `listPlatformUsageAlerts`, `updatePlatformUsageAlert`.
- Main entities and fields: 告警 ID、通知渠道、通知目标、投递状态、Webhook 状态、投递事件 ID、投递时间、结果消息。
- Status values/enums: notification status `SENT`, `PARTIAL`, `SKIPPED`, `FAILED`; channels `IN_APP`, `WEBHOOK`.
- User actions: 通知、确认、升级、关闭、查看事件。
- Required states: 加载态、空状态、操作中禁用、投递成功/部分成功/跳过/失败提示。

Design requirements:
- Make it look like a production enterprise operations console.
- Add a compact notification action inside each usage alert row.
- Show notification targets and delivery result without crowding the alert lifecycle card.
- All visible labels must be Chinese, except technical IDs.
- Avoid new navigation or unrelated notification center pages.

Avoid:
- fake channels beyond `IN_APP` and `WEBHOOK`
- overdone warning visuals, emojis, decorative clutter
