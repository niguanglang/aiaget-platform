# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the Enterprise Agent Platform multi-Agent collaboration page at `/agent-teams`.

Project context:
- Users/roles: 租户管理员、Agent 管理员、安全管理员、审计员。
- Main task flow: 管理员进入多 Agent 协作中心 -> 通过筛选定位团队 -> 查看团队详情 -> 编辑 Supervisor 策略与预算 -> 保存 -> 启动团队任务 -> 查看运行轨迹、成本、接力审批和反馈。
- API/service contract: `listAgentTeams`, `getAgentTeam`, `createAgentTeam`, `updateAgentTeam`, `startAgentTeamRun`, `approveAgentTeamHandoff`, `rejectAgentTeamHandoff`, `listModelProviders`.
- Data entities and fields: team base fields plus `supervisor_model_id`, `supervisor_prompt`, `failure_policy`, `quality_gate_enabled`, `quality_threshold`, `budget_token_limit`, `budget_cost_limit`.
- Actions and states: create/edit/save/disable/start/review feedback; loading, empty, error, validation, permission-disabled.

Prototype requirements:
- Low- to mid-fidelity wireframe style, using clear section labels in Chinese.
- Show component regions: overview metric cards, filter toolbar, team table, selected team detail panel, Supervisor 策略表单, 预算约束表单, 运行轨迹 tabs/timeline, 人工接力审批 block.
- Make interaction states explicit: no teams empty state, no model available state, no manage permission disabled state, validation message for negative budget or threshold outside 0-1.
- Keep the layout consistent with the current console shell and existing `/agent-teams` route.
- Use component boundaries that can map directly to existing `Card`, `StatusBadge`, `Button`, table, select, number input, textarea, modal and empty state components.

Avoid polished decorative rendering, invented backend fields, excessive navigation depth, unrelated charts, and placeholder lorem ipsum.
