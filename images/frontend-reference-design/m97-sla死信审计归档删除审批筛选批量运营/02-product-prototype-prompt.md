# Product Prototype / Wireframe Image Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M97 SLA 死信审计归档删除审批筛选批量运营 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. 用户输入文件名、对象路径、审批 ID、申请人或意见进行搜索
  2. 用户选择审批状态或打开只看待办
  3. 列表显示当前筛选结果和数量
  4. 用户导出当前筛选结果为 CSV
  5. 用户选择记录查看详情和时间线
  6. 待审批记录仍可批准或拒绝
- API/service contract:
  - list approvals and detail API, local filtering/export only
- Actions and states:
  - search, status filter, pending toggle, reset, export, refresh, view detail, empty filtered result

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show toolbar, filtered queue, metrics, detail/timeline region.
- Keep component boundaries obvious for implementation.

Avoid:
- modal-heavy flow
- separate route
- invented server-side pagination
