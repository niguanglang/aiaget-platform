# Project UI Brief

- Page: agent-team-supervisor-policy
- Route: /agent-teams
- Feature goal: 多 Agent 团队 Supervisor 策略与预算约束
- Target users and permissions: 租户管理员、Agent 管理员、安全管理员、审计员；`agent:team:view` 控制查看，`agent:team:manage` 控制团队策略编辑，`agent:team:run` 控制启动任务，`security:approval:handle` 控制人工接力审批。
- APIs/services: `getAgentTeamOverview`、`listAgentTeams`、`getAgentTeam`、`createAgentTeam`、`updateAgentTeam`、`startAgentTeamRun`、`createAgentTeamHandoff`、`approveAgentTeamHandoff`、`rejectAgentTeamHandoff`、`createAgentTeamFeedback`、`listModelProviders`。
- Entities/fields/statuses: `AgentTeam` 当前字段包括 `name`、`code`、`description`、`status`、`mode`、`max_rounds`、`timeout_seconds`、`handoff_policy`、`owner`、成员数、运行记录、步骤、接力、反馈；本次新增团队级 `supervisor_model_id`、`supervisor_prompt`、`failure_policy`、`quality_gate_enabled`、`quality_threshold`、`budget_token_limit`、`budget_cost_limit`。状态枚举使用 `DRAFT/ACTIVE/DISABLED/ARCHIVED`，模式使用 `SEQUENTIAL/PARALLEL/SUPERVISOR`，接力策略使用 `AUTO/MANUAL/APPROVAL_REQUIRED`。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、shadcn 风格基础组件；页面使用 `ConsoleShell` 父布局，现有页面组件为 `apps/web/src/components/agent-teams/agent-teams-content.tsx`，复用 `Card`、`MetricCard`、`StatusBadge`、`Button`、表格、详情面板、弹窗表单和空状态。
- Required states: loading、empty、error、validation、disabled、success、permission-denied。策略字段在无管理权限时只读展示；没有模型供应商时 Supervisor 模型下拉显示“使用成员模型兜底”。
- Constraints: 页面显示中文；保持现有路由、API client、共享类型和权限模型；不新增中间件或容器；不破坏已有团队运行台账、接力和反馈工作区。
