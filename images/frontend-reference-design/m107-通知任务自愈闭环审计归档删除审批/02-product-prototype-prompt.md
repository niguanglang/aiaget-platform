# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M107 通知任务自愈闭环审计归档删除审批 at `/security`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 在自愈闭环审计归档列表中点击申请删除，系统生成待审批记录；审批中心展示待审批、已批准、已拒绝、已生效统计；用户筛选并选择审批记录，查看时间线后批准或拒绝。
- API/service contract:
  - DELETE archive -> returns `approval_id`
  - list overview -> pending/approved/rejected/applied counts
  - list approvals -> approval table
  - get approval detail -> timeline
  - approve/reject -> detail refresh
- Data entities and fields:
  - archive table: file name, folder, size, last modified, key, actions
  - approval list: approval id, status, archive file, requester, request time, reviewer, review time
  - detail: archive key, size, reason, reviewer note, audit timeline, request_id, trace_id
- Actions and states: apply delete, refresh archive, refresh approval, filter, reset filter, export filter, approve, reject, loading, empty, error, disabled

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show page regions: archive table, approval metrics, approval filters, approval list, detail/timeline side panel.
- Make component boundaries obvious so a frontend engineer can map each region to existing components.
- Include Chinese labels and realistic status chips.
- Show empty and loading placeholders.

Avoid:
- decorative rendering
- invented backend fields
- unrelated menus or extra routes
