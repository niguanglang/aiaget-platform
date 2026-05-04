# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for a security center approval and archive operations alert closure area.

Project context:
- Page/route: `/security`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow:
  1. User opens security center.
  2. User reviews the existing `审批与归档运营` card.
  3. User sees `运营告警闭环` derived from approval/archive/audit metrics.
  4. User clicks the alert action to handle approvals or inspect audit/archive risk.

API/service contract:
- `getSecurityCenterOverview()`
- `SecurityCenterOverview.approval_operations.operational_alerts`

Data entities and fields:
- alert id
- title
- description
- severity
- metric
- href
- action_label

Actions and states:
- Loading placeholder while overview loads.
- Empty state when no operational alerts exist.
- Alert cards for medium/high risk.
- Button links to `/approvals`, `/approval-audits`, `/audit`, `/security`.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show existing `审批与归档运营` metric area.
- Add a clearly bounded `运营告警闭环` region between metrics and quick links.
- Show two example alert rows with severity, metric, description and action button.
- Show stable empty state.
- Keep component boundaries obvious for mapping to Card, StatusBadge, Button and Link.

Avoid:
- new pages
- table-heavy layout
- invented backend fields
- unrelated alert channels
