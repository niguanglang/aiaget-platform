# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for notification delivery on approval/archive operational alerts.

Project context:
- Page/route: `/security`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow:
  1. User opens security center.
  2. User reviews `审批与归档运营`.
  3. User sees operational alert cards.
  4. User clicks `通知` on an alert.
  5. UI shows delivery status and message.

API/service contract:
- `notifySecurityOperationAlert(alertId, { channels, note })`
- Response: alert_id, status, channels, targets, delivery_event_id, webhook_status, message, delivered_at.

Prototype requirements:
- Show existing operational alert card with severity, metric, description and处理 action.
- Add secondary notification row with `通知` button.
- Show pending state text.
- Show latest delivery result row with status badge, channel list, Webhook status and delivery time.
- Include empty alert state.
- Keep component boundaries obvious for Card, StatusBadge, Button, Link and inline result notice.

Avoid:
- new notification center page
- table-only layout
- invented settings fields
