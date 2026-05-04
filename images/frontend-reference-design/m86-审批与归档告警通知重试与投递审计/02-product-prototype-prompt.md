# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for notification delivery audit and retry on approval/archive operational alerts.

Route:
- `/security`

Main task flow:
1. User opens security center.
2. User reviews approval/archive operational alerts.
3. User opens `通知投递审计` area.
4. User filters failed notifications.
5. User clicks `重试` on failed or partial delivery.

API/service contract:
- `listSecurityOperationAlertNotifications({ status })`
- `retrySecurityOperationAlertNotification(notificationEventId)`

Prototype requirements:
- Show a compact audit list inside the existing operations card.
- Columns/fields: 状态, 告警, 渠道, Webhook, 重试次数, 投递时间, 操作.
- Show loading, empty, and retry pending state.
- Keep component boundaries obvious for Card, StatusBadge, Button, EmptyState.

Avoid:
- separate page
- complex modal
- invented subscriber editor
