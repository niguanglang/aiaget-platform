# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent platform admin console.

Project context:
- Product/module: 企业 Agent 平台 / 全渠道发布中心
- Page/route: M63-17 渠道自动推进 Temporal 工作流 at `/channels`
- Target users/roles: 租户管理员、发布负责人、渠道管理员、审计员
- Business goal: Show that channel release automation can run through local execution, Temporal-first fallback, or forced Temporal workflow mode
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui-like cards/buttons/status badges
- Existing page shell/layout: existing `/channels` dashboard, reuse the M63-16 release automation panel

Interface contract that must appear in the UI:
- API/service functions: same release automation endpoints, plus Runtime workflow boundary
- Main fields: workflow_mode, workflow_backend, workflow_id, last_run, decision, gate_decision, current_batch, today_run_count
- Status values: local, temporal_first, temporal, LOCAL, LOCAL_FALLBACK, TEMPORAL
- User actions: refresh executor, run once, inspect workflow backend and events
- Required states: loading, empty, error, disabled due to permission/interval, temporal dispatch failure event

Design requirements:
- Chinese UI text only.
- Add workflow indicators inside the automation executor panel: 工作流模式, 执行后端, 工作流 ID.
- Keep a clean enterprise SaaS dashboard feel with subtle borders, soft shadows, restrained status colors.
- Show a two-column detail layout and recent event feed.
- Avoid decorative charts or invented fields.
