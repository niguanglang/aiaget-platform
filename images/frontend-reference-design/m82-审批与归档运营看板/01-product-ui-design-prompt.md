# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform security operations dashboard enhancement.

Project context:
- Product/module: 企业 AI Agent 平台，审批与归档运营看板
- Page/route: `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: unify operational visibility for tool approvals, notification policy approvals, archive deletion approvals, approval audit events, and archived CSV storage.
- Existing design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-like Card/Button/MetricCard/StatusBadge/EmptyState, TanStack Query, Motion.
- Existing layout: security center dashboard with security posture panel, module cards, risk signals and security events.

Interface contract:
- Add a Bento card titled `审批与归档运营`.
- Metrics: 工具待审、策略待审、归档删除待审、审批审计事件、失败/告警事件、Trace 覆盖、归档文件、归档容量.
- Quick actions: `处理审批`, `查看审批审计`, `打开审计中心`.
- Status badges: 正常、待处理、归档风险.
- Recent/risk summary: high impact policy pending, archive delete pending, failed audit event count.

Design requirements:
- Chinese UI labels only.
- Enterprise SaaS console style, dense but readable, subtle borders, soft shadows, glass-like panels.
- Use Bento grid/dashboard layout; no marketing hero.
- Keep hierarchy clear: critical pending counts first, supporting audit/storage context second.

Avoid:
- unrelated charts, fake fields, emoji, overdone gradients, noisy decoration.
