Create a high-fidelity product UI design image for an enterprise AI Agent platform dashboard.

Project context:
- Product/module: 企业 AI Agent 平台 / 工作台
- Page/route: `/dashboard`
- Target users/roles: 租户运营人员、管理员、平台值班人员
- Business goal: 快速扫描平台健康、调用趋势、运行步骤、智能体排行、错误分布和近期告警，并通过明确入口跳转到监控、审计、Agent 等详情页面。
- Existing frontend stack/design system: Next.js App Router, React Query, TypeScript, Tailwind CSS, shadcn-style Button/Card/EmptyState/StatusBadge, lucide icons, restrained motion microinteractions.
- Existing page shell/layout: protected enterprise console shell; compact dashboard grid; subtle borders, soft shadows, backdrop blur, no marketing hero.

Interface contract that must appear in the UI:
- API/service functions: `getMonitorOverview({ window })`, `getAuditOverview({ window })`.
- Main data: monitor summary, latency trend, service health, agent rankings, tool/knowledge/model rankings, error samples, run step summary and breakdown, audit failures.
- User actions: refresh, switch `24h/7d`, drill down to `/monitor`, step-filtered monitor, `/agents`, `/audit`.
- Required states: loading, empty trend/ranking, degraded health, partial API error banner.

Design requirements:
- Show a dashboard-first page, not a CRUD management page.
- Use metric tiles, service health card, operations trend card, run-step summary, ranking, error distribution, and recent alert list.
- Keep all deep operations as links or row actions; do not show forms, modals, full detail logs, or editable configuration.
- UI text must be Chinese and fit compact cards.
- Keep the palette balanced and product-like, avoiding excessive gradients or decorative blobs.

Avoid:
- fake charts not backed by listed data
- full detail/log tables in the dashboard
- configuration forms, approvals, or destructive operations
