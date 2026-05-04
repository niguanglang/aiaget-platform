# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform monitoring page.

Project context:
- Product/module: 企业 AI Agent 平台，统一用量异常检测与告警闭环。
- Page/route: 监控中心 `/monitor` 内的“统一平台事件与用量底座”面板。
- Target users/roles: 具备 `monitor:log:view` 权限的监控、审计、成本运营人员。
- Business goal: 基于 Rollup 汇总自动发现成本突增、调用量突增、错误率过高、重试过高和无成功等异常，并把检测结果沉淀为统一平台事件。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`StatusBadge`、`EmptyState`、lucide icons、React Query。
- Existing page shell/layout: SaaS 管理后台，左侧导航和内容区；当前面板为 Dashboard/Bento Grid 风格，不新增页面。

Interface contract that must appear in the UI:
- API/service functions: `detectPlatformUsageAnomalies`, `getPlatformUsageOverview`, `listPlatformUsageTrends`, `listPlatformUsageLedger`.
- Main entities and fields: 异常总数、严重异常数、警告异常数、最高严重等级、异常类型、指标类型、资源类型、当前值、基线值、倍率、阈值、检测时间、中文异常说明。
- Status values/enums: severity `INFO` / `WARN` / `ERROR` / `CRITICAL`，window `24h` / `7d` / `30d`。
- User actions: 检测异常、刷新、重建 Rollup、窗口切换、查看异常信号、通过事件流搜索检测事件。
- Required states: 加载态、空状态、检测中按钮禁用、检测成功提示、检测失败提示。

Design requirements:
- Make it look like a production enterprise SaaS monitoring console.
- Place anomaly detection as an operational insight card near usage trend and Rollup summary.
- Use restrained warning colors, thin borders, light shadows, glass-like card surfaces, and clear hierarchy.
- Keep all visible text Chinese, except technical metric identifiers.
- Avoid crowding compact billing view; detection action belongs to full monitor view.

Avoid:
- invented backend fields or unrelated modules
- excessive gradients, cheap glow, emojis, oversized rounded blobs
- alarm-heavy styling that overwhelms the dashboard
