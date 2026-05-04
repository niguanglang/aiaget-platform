# Product Prototype / Wireframe Image Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M98 SLA 死信审计归档删除审批运营闭环 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. 用户进入安全中心
  2. 审批与归档运营看板展示 SLA 死信归档删除审批指标
  3. 如待审批积压或拒绝率高，运营告警区域显示风险卡片
  4. 用户点击查看归档删除审批，跳转安全中心审批区域
  5. 用户可对运营告警执行确认、升级、关闭和通知
- API/service contract:
  - `getSecurityCenterOverview`
- Actions and states:
  - loading overview, healthy no-alert state, risk alert state, lifecycle action disabled/pending

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show metric cards, alert list, and action buttons.
- Keep layout within existing security center page.

Avoid:
- separate workflow page
- invented charts or backend fields
