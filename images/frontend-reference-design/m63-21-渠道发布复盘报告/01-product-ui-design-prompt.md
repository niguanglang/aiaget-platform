# Product UI Design Image Prompt

Create a high-fidelity enterprise SaaS admin UI design image for the channel release postmortem report panel.

Project context:
- Product/module: 企业 AI Agent 平台，渠道发布中心
- Page/route: `/channels`
- Target users: 渠道管理员、安全管理员、审计员、租户管理员
- Business goal: 将发布批次、审批、灰度、自动推进、自愈、巡检事件和用量指标汇总成可审计中文报告。
- Existing stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-like components, glass dashboard layout.

Interface contract:
- API: `GET /channels/:channelId/release-report`
- Sections:
  - Header badges: M63-21, 风险等级, 窗口小时, 生成时间
  - Conclusion card: 复盘结论、渠道状态、健康状态、审批状态、灰度状态、当前批次、回滚点、最近推进、最近自愈
  - Metric cards: 渠道健康、发布阶段、窗口成功率、失败事件、自动推进、发布自愈
  - Risk cards: title, severity, description, recommendation
  - Timeline list: occurred_at, title, status, event_type, trace_id, summary
  - Markdown report body
- States: loading, empty, error, no channel selected

Design requirements:
- Chinese labels only.
- Dense but readable enterprise dashboard layout.
- Fine borders, soft shadows, subtle backdrop blur.
- Prioritize audit readability over decoration.
- Use clear visual severity for INFO/WARN/CRITICAL without cheap glow.

Avoid:
- Fake export or edit actions not backed by API
- Marketing/hero layout
- Decorative charts unrelated to report fields
- Overcrowded cards
