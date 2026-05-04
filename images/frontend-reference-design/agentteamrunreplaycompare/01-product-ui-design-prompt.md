# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台 / 多 Agent 协作中心
- Page/route: Agent 团队运行回放与对比 at `/agent-teams`
- Target users/roles: Agent 管理员、租户管理员、审计员、安全管理员
- Business goal: 让运营人员选择一次团队运行后，可以回放成员执行链路，并和上一轮运行对比 Token、成本、耗时、成员输出、RAG 命中、工具调用和模型调用差异。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn 风格组件；现有页面使用 `Card`、`StatusBadge`、`Button`、`EmptyState`、紧凑指标卡和分栏详情。
- Existing page shell/layout: 保持 `/agent-teams` 当前后台布局；左侧为成员职责卡，右侧为运行轨迹工作区；本设计只扩展右侧运行工作区。

Interface contract that must appear in the UI:
- API/service functions: `getAgentTeam`、`listAgentTeams`、`startAgentTeamRun`、`createAgentTeamHandoff`、`createAgentTeamFeedback`，不新增接口。
- Main entities and fields: `AgentTeamRunSummary` 的 `status/trace_id/total_steps/completed_steps/failed_steps/total_tokens/total_cost/latency_ms/created_at/objective`；`AgentTeamStepItem` 的 `run_id/step_type/status/title/agent_name/output_summary/child_steps/references/tool_calls/model_call/total_tokens/cost_total/duration_ms`。
- Status values/enums: 运行状态 `QUEUED/RUNNING/WAITING_HUMAN/SUCCESS/FAILED/CANCELLED`；步骤状态 `PENDING/RUNNING/SUCCESS/FAILED/SKIPPED`；工具状态 `SUCCESS/FAILED/APPROVAL_REQUIRED/REJECTED`。
- User actions: 选择运行、复制 Trace、打开监控追踪、选择步骤、查看当前运行回放、查看与上一轮运行差异、提交接力、保存反馈。
- Required states: 无运行、当前运行无步骤、无上一轮可对比、上一轮数据不完整、失败运行、Trace 缺失、权限只读。

Design requirements:
- Make it look like a production SaaS/admin product, compact and operational, not a marketing page.
- Use a Bento/Dashboard layout inside the existing run workspace: current run summary, replay timeline, comparison cards, member delta rows, RAG/tool/model deltas.
- Primary workflow: user selects run -> sees replay metrics and selected step -> sees comparison against previous run -> can jump to monitor trace.
- Use restrained borders, soft shadows, light muted backgrounds, clear spacing, no oversized hero sections.
- Page text should be Chinese.
- Show realistic sample values and Chinese labels.
- Keep visual hierarchy clear: status badges, metric deltas, member rows, references/tools/model cards.

Avoid:
- invented backend fields or unrelated charts
- decorative gradients, loud glow, emoji, large round decorative blocks
- dense unreadable text
- separate new route or unrelated navigation
