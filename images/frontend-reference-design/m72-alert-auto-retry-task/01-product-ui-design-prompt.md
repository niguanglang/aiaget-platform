# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform monitoring page.

Project context:
- Product/module: 企业 AI Agent 平台，告警自动重试后台任务。
- Page/route: 监控中心 `/monitor` 内的统一平台事件与用量底座面板。
- Target users/roles: 具备 `monitor:log:view` 权限的监控、审计、成本运营人员。
- Business goal: 将告警通知失败投递从人工重试升级为可扫描、可手动触发、可观测的轻量后台任务。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`、lucide icons、React Query。
- Existing page shell/layout: SaaS 管理后台，左侧导航和内容区；当前面板为 Dashboard/Bento Grid 风格，不新增页面。

Interface contract that must appear in the UI:
- API/service functions: `getPlatformUsageAlertNotificationTaskOverview`, `runPlatformUsageAlertNotificationAutoRetry`.
- Main entities and fields: 调度开关、运行状态、最近扫描、下次扫描、待自动重试、失败投递、最近失败、扫描数、重试数、成功数、失败数。
- Status values/enums: task status `SUCCESS`, `FAILED`, `SKIPPED`.
- User actions: 刷新任务、立即扫描重试。
- Required states: 加载态、无待处理项、任务执行中禁用、执行成功、执行失败提示。

Design requirements:
- Make it look like a production enterprise operations console.
- Add a compact task card near the notification audit card.
- Use restrained operational styling and dense metrics.
- All visible labels must be Chinese, except technical IDs.
- Keep visual hierarchy clear; task status should be readable at a glance.

Avoid:
- standalone scheduler center page
- complex cron editor or policy editor
- fake queue/middleware UI
- decorative clutter, exaggerated glow, emoji
