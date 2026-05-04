# Project UI Brief

- Page: agent-team-step-sub-events
- Route: /agent-teams
- Feature goal: 团队运行步骤子事件视图
- Target users and permissions: Agent 管理员、租户管理员、审计员、安全管理员；`agent:team:view` 控制查看，`monitor:trace:view` 通过监控中心查看全链路 Trace。
- APIs/services: 复用现有 `getAgentTeam`、`listAgentTeams`、`startAgentTeamRun`；Runtime 已在 `RuntimeAgentTeamMemberResult` 返回 `steps`、`references`、`tool_calls`、`model_call`，本次将这些数据映射到 `AgentTeamStepItem`。
- Entities/fields/statuses: `AgentTeamStepItem` 当前包含步骤类型、状态、输入输出摘要、trace/span、Token、成本、错误；本次新增 `child_steps`、`references`、`tool_calls`、`model_call`。子步骤沿用 `ConversationRunStepItem` 字段；引用沿用 `ConversationReferenceItem`；工具调用沿用 `ConversationToolCallItem`；模型调用新增团队步骤模型摘要。
- Existing components/design system: Next.js App Router、React、TypeScript、Tailwind CSS、shadcn 风格组件；页面组件为 `apps/web/src/components/agent-teams/agent-teams-content.tsx`，复用 `Card`、`StatusBadge`、`Button`、`EmptyState`、`RunMetric`、`PayloadBlock`、步骤时间线和步骤详情面板。
- Required states: 运行无步骤、步骤无子事件、无引用、无工具调用、无模型调用、步骤失败错误、Trace 缺失、权限只读。
- Constraints: 页面显示中文；不新增路由；不新增接口；不新增中间件或容器；保持现有团队运行台账、接力审批和反馈功能。
