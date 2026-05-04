# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform monitoring page.

Project context:
- Product/module: 企业 AI Agent 平台，统一平台事件与用量底座。
- Page/route: 监控中心 `/monitor` 内的“统一平台事件与用量底座”面板。
- Target users/roles: 具备 `monitor:log:view` 权限的监控、审计、成本运营人员。
- Business goal: 让运维人员可以查看平台事件、用量账本、趋势、事件关系和汇总桶，并在同一面板内手动重建最近窗口的用量汇总。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，`Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`、lucide icons、React Query。
- Existing page shell/layout: SaaS 管理后台，左侧导航和内容区；当前面板为 Dashboard/Bento Grid 风格，不新增页面。

Interface contract that must appear in the UI:
- API/service functions: `getPlatformUsageOverview`, `listPlatformUsageTrends`, `listPlatformUsageLedger`, `listPlatformEvents`, `getPlatformEvent`, `rebuildPlatformUsageRollups`.
- Main entities and fields: 平台事件数、用量事件数、关系链路数、汇总批次数、Trace 数、错误数；用量趋势时间桶；Rollup 汇总项的指标类型、周期、事件数、数量、金额、成本、错误数；用量账本的指标、资源、数量、单位、金额、发生时间。
- Status values/enums: 窗口 `24h` / `7d` / `30d`，周期 `hour` / `day`，事件状态健康/降级/不可用。
- User actions: 刷新、重建汇总、窗口切换、来源/事件/资源/指标筛选、Trace ID / Request ID / 关键词搜索、选择事件详情、按 Trace 或 Request 反筛。
- Required states: 加载态、空状态、统一数据加载失败、重建中按钮禁用、重建成功提示、重建失败提示。

Design requirements:
- Make it look like a production enterprise SaaS monitoring console, not a marketing page.
- Use Bento Grid / Dashboard Layout with clear hierarchy and generous spacing.
- Add the “重建汇总” action as a restrained operational button next to “刷新”, with a subtle progress state.
- Use thin borders, light shadows, backdrop blur, soft background texture, and restrained gradient mesh only as subtle depth.
- Keep motion implied through hover feedback and staggered data rows; avoid exaggerated effects.
- All visible text must be Chinese, except technical identifiers such as Trace ID / Request ID.
- Keep the compact billing variant visually uncrowded by showing the rebuild action only in the full monitor view.

Avoid:
- invented backend fields or unrelated modules
- decorative charts that do not map to the current data
- overdone gradients, cheap glow, emojis, oversized rounded blobs, crowded tables
