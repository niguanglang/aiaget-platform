# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the Enterprise Agent Platform multi-Agent collaboration page.

Project context:
- Product/module: 企业 Agent 平台 / 多 Agent 协作中心
- Page/route: Agent 协作团队 at `/agent-teams`
- Target users/roles: 租户管理员、Agent 管理员、安全管理员、审计员
- Business goal: 让管理员配置多 Agent 团队的 Supervisor 调度策略、预算阈值、失败处理和质量门槛，并能直接查看团队运行轨迹、接力审批和成本消耗。
- Frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui 风格组件, lucide icons, existing `Card`, `MetricCard`, `StatusBadge`, `Button`, table and modal primitives.
- Existing layout: enterprise console shell with left navigation and topbar; main content uses dashboard layout with overview metrics, filter toolbar, table, right-side detail/workbench regions.

Interface contract that must appear in the UI:
- API/service functions: `getAgentTeamOverview`, `listAgentTeams`, `getAgentTeam`, `createAgentTeam`, `updateAgentTeam`, `startAgentTeamRun`, `createAgentTeamHandoff`, `approveAgentTeamHandoff`, `rejectAgentTeamHandoff`, `createAgentTeamFeedback`, `listModelProviders`.
- Main entities and fields: team name/code/description/status/mode/max_rounds/timeout_seconds/handoff_policy/owner/member counts/latest run; new policy fields `supervisor_model_id`, `supervisor_prompt`, `failure_policy`, `quality_gate_enabled`, `quality_threshold`, `budget_token_limit`, `budget_cost_limit`.
- Status values/enums: team status `DRAFT/ACTIVE/DISABLED/ARCHIVED`; mode `SEQUENTIAL/PARALLEL/SUPERVISOR`; handoff policy `AUTO/MANUAL/APPROVAL_REQUIRED`; run status `RUNNING/WAITING_HUMAN/SUCCESS/FAILED`; failure policy `STOP_ON_REQUIRED_FAILURE/WAIT_HUMAN_ON_REQUIRED_FAILURE/CONTINUE_OPTIONAL`.
- User actions: create team, edit team strategy, select supervisor model, edit prompt, set budgets, start run, review handoff, add feedback.
- Required states: loading table/detail, empty teams/runs, validation for budgets and threshold, disabled fields without permission, error banner, success after save.

Design requirements:
- Make it look like a real Chinese enterprise SaaS operations console, not a marketing page.
- Use a dense but calm dashboard layout: overview metric strip, search/filter toolbar, team table, selected team detail drawer/panel, strategy and budget section, run trace workspace.
- Use subtle border, soft shadow, light glass/backdrop blur only where it improves layering. Keep gradients restrained and avoid cheap glow.
- Show the primary workflow clearly: select a team, edit Supervisor policy and budget, launch a team run, inspect trace/cost/handoff status.
- Use Chinese labels and realistic operational text.
- Keep typography compact and readable; no emoji; no decorative orbs.

Avoid:
- fake API fields not listed above
- unrelated charts, marketplace cards, or landing-page hero treatment
- unreadable tiny text, excessive gradients, overlapping text, or invented navigation
