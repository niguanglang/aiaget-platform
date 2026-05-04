# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the Enterprise AI Agent Platform approval center at `/approvals`.

Users/roles:
- 安全管理员
- 租户管理员
- 审计员

Main task flow:
1. User chooses 工具审批 or 通知策略.
2. User filters by pending/approved/rejected and keyword.
3. User selects one approval request.
4. Detail panel shows business context, values/request payload, decision controls.
5. Audit timeline shows every approval lifecycle event.
6. User approves or rejects if allowed.

API/service contract:
- `getToolApproval`, `approveToolApproval`, `rejectToolApproval`
- `getNotificationPolicyApproval`, `approveNotificationPolicyApproval`, `rejectNotificationPolicyApproval`
- Detail responses include `audit_timeline`

Data entities and fields:
- approval id, status, source/type, created_at, reviewed_at
- operator name/email
- decision note
- request id, trace id
- metadata JSON

Prototype requirements:
- Low- to mid-fidelity wireframe.
- Show page header, metric cards, lane switch, queue table, detail panel, audit timeline rail.
- Show loading/empty/error placeholders.
- Show disabled approval buttons for users without `security:approval:handle`.
- Make component boundaries obvious for frontend implementation.

Avoid:
- invented routes or unrelated modules
- decorative charts
- non-Chinese UI text
