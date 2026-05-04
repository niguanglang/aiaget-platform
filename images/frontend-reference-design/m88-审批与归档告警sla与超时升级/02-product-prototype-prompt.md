# Product Prototype / Wireframe Prompt

Create a mid-fidelity wireframe for the `/security` page section "审批与归档告警 SLA 与超时升级".

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow:
  1. User opens security center.
  2. User reviews approval/archive operation alerts and notification retry status.
  3. User checks SLA summary: within SLA, warning, overdue, auto escalated, closed.
  4. User scans overdue alerts and triggers "立即扫描升级".
  5. User follows action links to approvals or audit pages.
- API/service contract:
  - `getSecurityOperationAlertSlaOverview()`
  - `runSecurityOperationAlertSlaEscalation()`
  - response includes policy, summary, items, latest run result.
- Data entities:
  - Policy block with enable state, due minutes, warning minutes, auto escalate, lookback hours.
  - Metrics grid with total, warning, overdue, auto escalated.
  - Alert SLA list with title, severity, status, SLA status, due time, remaining/overdue minutes.
  - Last run result block.
- Actions and states:
  - 刷新 SLA
  - 立即扫描升级
  - loading placeholder
  - empty state
  - disabled state when policy is off
  - running state
  - error/result feedback

Prototype requirements:
- Low-to-mid fidelity admin wireframe.
- Show component boundaries clearly: header, metric grid, policy panel, SLA list/table, last result panel.
- Keep it inside the existing approval/archive operations card, under operation alerts and before notification delivery audit.
- Use Chinese labels in every visible text area.
- Make it responsive: cards stack on mobile, list/table stays readable.

Avoid:
- adding new top-level navigation
- invented backend fields
- decorative artwork
- dense unreadable tables
