# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台安全中心
- Page/route: 安全事件详情中心 inside `/security`
- Target users/roles: 租户管理员、安全管理员、审计员、平台运维
- Business goal: 把运行时 Guard 拒绝、安全策略 DENY、资源授权拒绝和数据权限拒绝变成可检索、可审计、可追踪的事件中心
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn-like local components (`Card`, `Button`, `Input`, `MetricCard`, `StatusBadge`, `EmptyState`) + lucide-react + motion/react
- Existing page shell/layout: 左侧控制台导航，主内容最大宽度 `max-w-7xl`，Bento/Dashboard Layout，白色半透明卡片、细边框、轻阴影、backdrop blur、克制动效

Interface contract that must appear in the UI:
- API/service functions: `getSecurityCenterOverview`, `listSecurityCenterEvents`, `getSecurityCenterEvent`
- Main entities and fields: security event id, source, title, reason, resource_type, resource_id, action, path, method, status_code, request_id, trace_id, occurred_at, subject, resource, context, matched_code
- Status values/enums: source = DATA_SCOPE / RESOURCE_ACL / SECURITY_POLICY / OPERATION; status_code 403/401/429/500; risk level LOW/MEDIUM/HIGH
- User actions: search, filter by source, filter by time window, show only traceable events, open event detail drawer, copy/read request ID and trace ID, jump to monitor trace
- Required states: loading table, empty event list, fetch error, disabled trace jump when trace ID is absent, permission-denied read-only behavior

Design requirements:
- Make it look like a production enterprise security operations console, not a template.
- Show the primary workflow clearly: operator filters denied events, selects one event, inspects guard source, subject/resource/context JSON, and follows trace ID to monitor.
- Include a dense but breathable event table, summary metrics, risk cards, detail drawer, JSON detail sections, and clear status badges.
- Use Chinese labels only.
- Visual style: 极简、科技、高级、产品感强；glass card texture, subtle border, soft shadow, small gradient mesh/noise background; no loud glow.

Avoid:
- fake API fields not listed above
- unrelated SOC charts or map visualizations
- overdone gradients, emoji, huge rounded blobs, overcrowded text
