# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform audit enhancement.

Project context:
- Product/module: 企业 AI Agent 平台，审计中心联动与审批审计导出
- Page/routes: `/audit` 审计中心 and `/approval-audits` 审批审计中心
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: let operators see approval audit risk from the global audit center, then jump into approval audit search and export the filtered approval audit ledger.
- Frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-like components, `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`, TanStack Query, Motion.
- Layout constraints: enterprise SaaS console with left navigation, max-width content, Bento/Dashboard layout, clean spacing, subtle borders, soft shadows, backdrop-blur.

Interface contract that must appear in the UI:
- Audit center metrics: 登录日志、操作日志、安全事件、配置变更、成功率.
- Approval audit linkage card on `/audit`: 审批审计事件、失败事件、Trace 覆盖、最近审批风险; primary action `打开审批审计`.
- Audit event table: 时间、来源、状态、用户、模块、动作、链路 ID、摘要.
- Approval audit export toolbar on `/approval-audits`: keyword search, window, source type, event type, event status, trace-only checkbox, `导出 CSV`, refresh, clear filters.
- Approval audit table fields: 时间、来源、事件、状态、操作人、Trace ID、请求 ID、备注.
- Detail panel fields: event title, event ID, source record, actor, occurred time, request ID, Trace ID, note, JSON metadata, buttons `打开审批`, `查看 Trace`.
- Export states: disabled when no events or loading, success text after export, failure text if export fails.

Design requirements:
- Chinese UI labels only.
- Use a professional, minimal, high-end enterprise SaaS visual style.
- Use subtle border, soft shadow, glass-like panels, clean hierarchy, restrained motion cues.
- Use Bento cards and dashboard layout, not marketing sections.
- Show a realistic operational workflow: audit center detects approval risk -> user jumps to approval audit center -> filters current audit events -> exports CSV.
- Keep 3D/gradient ambiance extremely subtle and secondary; do not let decoration compete with tables.

Avoid:
- overdone gradients, cheap glow, emoji, fake unrelated charts, random fields, overcrowded panels, huge rounded blobs.
