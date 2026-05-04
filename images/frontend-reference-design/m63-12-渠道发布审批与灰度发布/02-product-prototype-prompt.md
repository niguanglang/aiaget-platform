# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M63-12 渠道发布审批与灰度发布 at `/channels`
- Users/roles: 租户管理员、渠道管理员、安全管理员、审计人员
- Main task flow:
  1. 用户选择一个发布渠道。
  2. 查看当前审批状态、灰度比例和回滚可用性。
  3. 渠道管理员开启审批要求并发起审批。
  4. 有审批权限的用户通过或拒绝。
  5. 管理员设置灰度比例，必要时全量发布或回滚。
- API/service contract:
  - GET /channels/:channelId/publish-control
  - PUT /channels/:channelId/publish-control
  - POST /channels/:channelId/publish-control/request-approval
  - POST /channels/:channelId/publish-control/approve
  - POST /channels/:channelId/publish-control/reject
  - POST /channels/:channelId/publish-control/rollout
  - POST /channels/:channelId/publish-control/rollback
- Data entities and fields:
  - approval_required, approval_status, approval_note, requested_by, requested_at, reviewed_by, reviewed_at, decision_note
  - rollout_enabled, rollout_percentage, rollout_status
  - rollback_available, last_stable_status, last_stable_config, last_rollback_at, last_rollback_by
- Actions and states:
  - save config, request approval, approve, reject, set rollout, full release, rollback
  - loading, empty, error, disabled, permission hint, success result

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show a single panel under the existing channel operational sections.
- Define clear regions:
  - header with M63-12 status badges and refresh button
  - metric cards row
  - approval workflow card
  - rollout percentage card
  - rollback card
  - decision/audit summary card
  - permission and validation message areas
- Make component boundaries obvious for Card, Button, Input, MetricCard, StatusBadge, EmptyState.
- All labels should be Chinese.

Avoid:
- decorative rendering
- invented backend fields
- unrelated navigation changes
