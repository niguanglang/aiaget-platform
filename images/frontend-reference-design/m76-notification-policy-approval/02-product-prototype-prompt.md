# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the enterprise AI Agent platform approval center.

Project context:
- Page/route: `/approvals`
- Users/roles: 安全管理员、租户管理员、监控运营。
- Main task flow: 用户在设置中心提交高影响通知策略变更 -> 生成 PENDING 快照 -> 审批中心通知策略队列出现请求 -> 审批人查看前后值和影响摘要 -> 批准后写入系统设置并把快照置为 APPROVED -> 拒绝后快照置为 REJECTED 且不修改系统设置。
- API/service contract: `listNotificationPolicyApprovalRequests`, `getNotificationPolicyApproval`, `approveNotificationPolicyApproval`, `rejectNotificationPolicyApproval`.
- Data entities and fields: snapshot ID, version, setting key/name, action, previous/next value, previous/next status, impact level, impact summary, created_by, created_at, approval_status, decision note.
- Actions and states: type switch, status filter, detail selection, decision note, approve, reject, empty/error/loading/permission states.

Prototype requirements:
- Reuse current approval page layout.
- Show a segmented control for “工具审批”和“通知策略” above the queue.
- Notification queue table/card should show time, setting, action, impact, approval status, applicant.
- Detail panel should show diff and decision area.
- Empty state should explain no pending notification policy approvals.

Avoid:
- separate route
- fake approval chain
- invented unrelated fields
- dense full audit table
