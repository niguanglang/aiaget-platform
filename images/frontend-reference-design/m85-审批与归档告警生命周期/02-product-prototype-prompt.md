# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for lifecycle management on approval/archive operational alerts.

Route:
- `/security`

Main task flow:
1. User opens security center.
2. User reviews `运营告警闭环`.
3. User clicks `确认`, `升级`, or `关闭` on an alert.
4. UI updates lifecycle status and refreshes overview.

API/service contract:
- `updateSecurityOperationAlert(alertId, { action, note })`
- Response: alert_id, status, last_action, last_note, updated_at.

Prototype requirements:
- Show an alert card with severity, metric, lifecycle status, description.
- Show row of lifecycle buttons: 确认, 升级, 关闭.
- Show disabled button state for closed alert.
- Show latest action metadata.
- Preserve M84 notification result row.
- Include empty alert state.

Avoid:
- new route
- complex detail drawer
- invented assignee picker
