# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe for a real enterprise SaaS console page.

Project context:
- Page/route: Agent 协作中心 at `/agent-teams`
- Users/roles: 租户管理员、Agent 管理员、安全管理员、审计员
- Main task flow:
  1. 用户打开 Agent 协作中心
  2. 查看团队数量、运行中任务、等待人工接管、失败步骤等指标
  3. 按关键词、状态、负责人筛选团队
  4. 选择团队查看成员、最近运行、接力和反馈
  5. 新建或编辑团队
  6. 添加/调整成员职责和执行顺序
  7. 启动团队任务并查看运行步骤时间线
  8. 对等待人工接管的运行发起接力或反馈
- API/service contract:
  - `GET /api/v1/agent-teams`
  - `POST /api/v1/agent-teams`
  - `GET /api/v1/agent-teams/:id`
  - `PATCH /api/v1/agent-teams/:id`
  - `DELETE /api/v1/agent-teams/:id`
  - `POST /api/v1/agent-teams/:id/members`
  - `PATCH /api/v1/agent-teams/:id/members/:memberId`
  - `DELETE /api/v1/agent-teams/:id/members/:memberId`
  - `POST /api/v1/agent-teams/:id/runs`
  - `POST /api/v1/agent-teams/runs/:runId/handoff`
  - `POST /api/v1/agent-teams/runs/:runId/feedback`
- Data entities and fields:
  - Team list columns: 团队、状态、协作模式、成员数、最近运行、负责人、更新时间、操作
  - Detail sections: 团队基础信息、成员职责、运行时间线、接力记录、反馈
  - Forms: 团队表单、成员表单、启动任务表单、接力表单、反馈表单

Prototype requirements:
- Use wireframe boxes with clear Chinese labels for every region.
- Show the existing console shell, not a standalone landing page.
- Main regions:
  - Header with title, badges, primary action
  - KPI card row
  - Filter toolbar
  - Team table
  - Selected team detail panel
  - Member cards/list
  - Run timeline with step states
  - Modal/drawer sketches for create team, add member, start run
- Include empty/error/loading/permission state placeholders.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic nested navigation
