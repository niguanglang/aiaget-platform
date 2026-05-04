# Project UI Brief

- Page: AgentTeamRunReplayCompare
- Route: /agent-teams
- Feature goal: 团队运行回放与对比
- Target users and permissions: Agent 管理员、租户管理员、审计员、安全管理员；沿用 `agent:team:view` 查看团队运行，`agent:team:run` 启动任务，`monitor:trace:view` 通过监控中心查看全链路 Trace。
- APIs/services: 复用现有 `getAgentTeam`、`listAgentTeams`、`startAgentTeamRun`、`createAgentTeamHandoff`、`createAgentTeamFeedback`；不新增接口。Control API `AgentTeamDetail.steps` 需要暴露 `run_id`，前端用 `run_id` 精确筛选运行步骤，并与上一条运行记录对比。
- Entities/fields/statuses: `AgentTeamRunSummary` 包含 `id/objective/status/request_id/trace_id/total_steps/completed_steps/failed_steps/total_tokens/total_cost/latency_ms/error_message/started_at/ended_at/created_at`；`AgentTeamStepItem` 包含步骤基础字段、`child_steps/references/tool_calls/model_call`，本模块新增前端可用 `run_id`；状态沿用 `QUEUED/RUNNING/WAITING_HUMAN/SUCCESS/FAILED/CANCELLED` 和 `PENDING/RUNNING/SUCCESS/FAILED/SKIPPED`。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、shadcn 风格组件；页面文件 `apps/web/src/components/agent-teams/agent-teams-content.tsx`，复用 `Card`、`StatusBadge`、`Button`、`EmptyState`、`RunMetric`、`PayloadBlock`、`RunTraceWorkspace`、`StepTimeline`、`StepDetailPanel`。
- Required states: 团队无运行、当前运行无步骤、没有上一轮可对比、上一轮步骤缺失、成员新增/缺失、Trace 缺失、运行失败、只读权限。
- Constraints: 页面显示中文；不新增路由；不新增中间件或容器；不发起外部服务动作；保持现有团队运行、接力审批、人工反馈和监控入口不破坏。
