# Product UI Design Image Prompt

Create a high-fidelity enterprise SaaS admin UI design image for the existing channel detail page.

Project context:
- Product/module: 企业 AI Agent 平台，渠道发布中心
- Page/route: 渠道详情页 `/channels`
- Target users/roles: 渠道管理员、Agent 管理员、安全管理员、审计员
- Business goal: 展示渠道发布巡检调度器，扫描启用自动推进和发布自愈策略的渠道，并派发到 Runtime workflow。
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-like components, glass card dashboard style.
- Existing page shell/layout: 左侧渠道列表 + 右侧详情工作区，多个运维卡片顺序排列，中文界面。

Interface contract:
- APIs:
  - `GET /channels/release-scheduler/overview`
  - `POST /channels/release-scheduler/run-once`
- Main fields:
  - 调度状态：巡检开关、运行状态、最近扫描、扫描间隔、推进模式、自愈模式
  - 候选摘要：扫描范围、推进候选、自愈候选、最近派发
  - 运行结果：运行 ID、状态、扫描渠道、派发任务、成功、失败、开始、完成
  - 渠道结果：渠道名、任务类型、结果状态、决策、workflow backend、错误摘要
- Status values: `SUCCESS`, `PARTIAL`, `FAILED`, `SKIPPED`, `AUTOMATION`, `SELF_HEALING`, `LOCAL`, `LOCAL_FALLBACK`, `TEMPORAL`
- Actions: 刷新巡检、立即巡检
- States: loading, empty, error, disabled, permission-denied

Design requirements:
- Make it look like a production AI operations console, not a template.
- Use Chinese labels only.
- Use fine borders, soft shadows, subtle backdrop blur, restrained gradient mesh, clean spacing.
- Keep hierarchy clear: header badges, four metric cards, left scheduling status, right last run and result feed.
- Show that scheduler only dispatches workflow tasks, not direct publish changes.
- Include permission-disabled state for users without `channel:publish:deploy`.

Avoid:
- Fake fields not listed above
- Marketing hero sections
- Decorative unrelated charts
- Overdone gradients, cheap glow, emoji
- Middleware/container management UI
