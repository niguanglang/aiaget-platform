# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 会话中心列表 at `/conversations`
- Users/roles: 租户管理员、Agent 管理员、审计员、普通授权用户
- Main task flow: open conversation list -> search/filter -> review key status/metrics -> open detail or archive -> route-level create.
- API/service contract: `listConversations`, `deleteConversation`, `listAgents`; route links `/conversations/create`, `/conversations/[id]`.
- Data entities and fields: title, agent, user, status, message count, feedback count, last run status, last message preview, last message time.
- Actions and states: 新建、筛选、清空、查看详情、归档确认、loading、empty、error、disabled、permission denied.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and page boundaries.
- Clearly label regions: 页面标题区、指标卡、筛选工具条、会话表格、行内操作、归档确认、空状态/错误状态.
- Show create/detail as route navigation, not embedded panels.
- Make component boundaries obvious so frontend implementation can map each region to existing components.
- Keep layout realistic for current console shell and responsive behavior.

Avoid:
- polished decorative rendering
- embedded chat composer, selected message preview panel, trace timeline, feedback form
- invented navigation or unrelated backend fields
