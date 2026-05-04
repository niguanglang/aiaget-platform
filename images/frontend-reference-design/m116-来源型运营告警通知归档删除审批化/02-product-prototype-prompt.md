# Product Prototype Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 来源型运营告警通知归档删除审批化 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: 创建通知审计归档后，用户在归档列表点击“申请删除”；系统创建删除审批；安全管理员在审批队列筛选待审批记录，查看详情和时间线，填写意见后批准或拒绝；批准后对象存储文件被删除并写入删除生效事件。
- API/service contract:
  - `DELETE /security-center/operation-alert-notifications/archives/:archiveId`
  - `GET /security-center/operation-alert-notifications/archive-approvals/overview`
  - `GET /security-center/operation-alert-notifications/archive-approvals`
  - `GET /security-center/operation-alert-notifications/archive-approvals/:approvalId`
  - `POST /security-center/operation-alert-notifications/archive-approvals/:approvalId/approve`
  - `POST /security-center/operation-alert-notifications/archive-approvals/:approvalId/reject`
- Data entities and fields:
  - archive file cards/table
  - approval summary counters
  - approval queue rows
  - approval detail summary
  - event timeline with request_id and trace_id
- Actions and states:
  - request delete, approve, reject, filter, clear filter, refresh, download
  - loading, empty, filtered empty, success, error, disabled

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show clear labels for these sections:
  - 通知归档列表
  - 删除审批概览
  - 审批筛选工具条
  - 删除审批队列
  - 审批详情与事件时间线
- Make component boundaries obvious so a frontend engineer can map each region to existing components.
- Keep layout realistic for the current `/security` page: compact, dashboard-like, table/card mixed layout.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or unrelated modules
