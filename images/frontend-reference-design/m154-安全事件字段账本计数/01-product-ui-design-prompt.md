# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the Enterprise AI Agent Platform security event list page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: 安全事件 at `/security/events`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 审计员在安全事件列表中快速识别审批工作台导出事件是否保留字段账本，同时保持列表轻量，完整字段清单进入事件详情页
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style Card/Button/StatusBadge/MetricCard
- Existing page shell/layout: console route with security workspace header, metric cards, filter toolbar, paginated list rows

Interface contract that must appear in the UI:
- API/service functions: `listSecurityCenterEvents` for list data; detail navigation to `/security/events/{id}`; no detail fetch inside list
- Main entities and fields: event title, reason preview, severity, source, Trace marker, method/path/request_id, resource type, occurred_at, detail link
- New lightweight fields: `has_export_field_ledger`, `exported_field_count`, `notification_archive_filter_field_count`
- Status values/enums: source includes APPROVAL_WORKBENCH; severity LOW/MEDIUM/HIGH; event window 1h/24h/7d/30d; Trace-only toggle
- User actions: search keyword, select event source, select time window, toggle Trace-only, clear filters, paginate, open detail
- Required states: loading rows, empty state, error state, disabled clear filter, pagination disabled at boundaries

Design requirements:
- Use a production SaaS/admin look with clean spacing, thin borders, subtle shadow, restrained glass-like surface.
- Keep the list row compact. Add small Chinese chips only when field ledger exists: “字段账本”, “导出字段 N 项”, “归档筛选字段 N 项”.
- Do not show full field names, JSON, or expanded detail inside the list row.
- Preserve visual hierarchy: severity/source/Trace chips first, title and reason preview second, request summary and field ledger chips as secondary metadata.
- Use Chinese visible text.
- Keep a modern dashboard feel without decorative overload.

Avoid:
- full `exported_fields` arrays in the list
- full `notification_archive_filter_fields` arrays in the list
- large modal/detail content inside the list page
- invented actions, charts, or unrelated security modules
