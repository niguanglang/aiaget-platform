# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform monitoring page.

Project context:
- Product/module: 企业 AI Agent 平台，统一用量告警生命周期与通知策略。
- Page/route: 监控中心 `/monitor` 内的统一平台事件与用量底座面板。
- Target users/roles: 具备 `monitor:log:view` 权限的监控、审计、成本运营人员。
- Business goal: 将用量异常检测事件升级为可确认、升级、关闭的运营告警队列，并展示通知策略目标。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`StatusBadge`、`EmptyState`、lucide icons、React Query。
- Existing page shell/layout: SaaS 管理后台，左侧导航和内容区；当前面板为 Dashboard/Bento Grid 风格，不新增页面。

Interface contract that must appear in the UI:
- API/service functions: `listPlatformUsageAlerts`, `updatePlatformUsageAlert`, `detectPlatformUsageAnomalies`, `listPlatformEvents`.
- Main entities and fields: 告警 ID、状态、严重等级、标题、摘要、异常数量、最高等级、负责人、通知目标、确认时间、升级时间、关闭时间、最近动作。
- Status values/enums: `OPEN`, `ACKNOWLEDGED`, `ESCALATED`, `CLOSED`; actions `ACKNOWLEDGE`, `ESCALATE`, `CLOSE`.
- User actions: 确认、升级、关闭、刷新、检测异常、查看关联事件。
- Required states: 加载态、空状态、接口错误、操作中按钮禁用、成功提示、失败提示。

Design requirements:
- Make it look like a production enterprise operations console.
- Add a focused “告警生命周期” card with a compact queue and clear actions.
- Use restrained warning colors and a clean dashboard layout.
- All visible labels must be Chinese, except technical IDs.
- Avoid crowding compact billing view; lifecycle actions only appear in full monitor view.

Avoid:
- new navigation structures
- fake notification channels not represented by data
- overdone warning visuals, emojis, cheap glow, crowded tables
