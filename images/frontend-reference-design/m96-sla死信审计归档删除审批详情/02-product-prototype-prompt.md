# Product Prototype / Wireframe Image Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M96 SLA 死信审计归档删除审批详情 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. 用户在归档删除审批队列中选择一条审批记录
  2. 右侧或下方显示审批详情
  3. 用户查看申请人、审批人、归档对象、审批状态和意见
  4. 用户沿时间线查看申请、批准、拒绝、生效事件
  5. 用户可跳转审计中心或 Trace 定位链路
  6. 待审批记录仍可批准或拒绝
- API/service contract:
  - `getSecurityOperationAlertSlaDeadLetterAuditArchiveApproval(approvalId)`
  - approve/reject/list approval APIs
- Data entities and fields:
  - approval detail and `audit_timeline`
- Actions and states:
  - select row, refresh, approve, reject, open audit, open trace, loading, empty, error, disabled

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on component boundaries: queue list, approval note, selected detail summary, timeline, action links.
- Show empty/error/loading placeholders for detail area.
- Keep layout realistic for the existing security center card and responsive dashboard page.

Avoid:
- decorative rendering
- invented backend fields
- separate unrelated route or modal-heavy flow
