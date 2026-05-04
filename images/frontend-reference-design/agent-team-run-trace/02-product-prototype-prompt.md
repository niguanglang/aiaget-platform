# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: Agent 协作中心 at `/agent-teams`
- Users/roles: 租户管理员、Agent 管理员、团队运行人员、审计/监控人员
- Main task flow: 筛选团队 -> 选择团队 -> 查看成员和运行 -> 启动团队任务 -> 选择某次运行 -> 查看步骤时间线、Trace、Token、成本、接力和反馈 -> 跳转监控中心追踪 Trace。
- API/service contract: `listAgentTeams`, `getAgentTeam`, `startAgentTeamRun`, `createAgentTeamHandoff`, `createAgentTeamFeedback`, `listAgents`, `listUsers`.
- Data entities and fields: Team, Member, Run, Step, Handoff, Feedback; use only fields listed in `00-project-ui-brief.md`.
- Actions and states:
  - Search/filter teams
  - New/edit/archive team
  - Add/edit/remove member
  - Start run
  - Select run
  - Open trace in monitor
  - Submit handoff reason
  - Submit feedback rating/comment
  - Loading, empty, error, validation, disabled and permission states

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and interaction flow instead of decoration.
- Show these regions clearly:
  1. Header and metrics strip
  2. Team filter toolbar and team table
  3. Team detail/action panel
  4. Member responsibility list
  5. Run selector and run summary metrics
  6. Step timeline with selected step detail
  7. Trace and usage mini cards
  8. Handoff list and feedback list
  9. Start run, handoff and feedback forms
- Label component boundaries so implementation can map to existing React components.
- Include placeholders for no selected team, no run, no steps, query error and no permission.
- Keep responsive behavior realistic: desktop uses two-column dashboard; mobile stacks team list, detail, members and run trace.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
- deeply nested menus or marketing hero sections
