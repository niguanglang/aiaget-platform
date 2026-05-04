# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for an automatic retry task card on approval/archive alert notifications.

Route:
- `/security`

Task flow:
1. User opens security center.
2. User reviews notification delivery audit.
3. User reviews automatic retry task summary.
4. User clicks `立即扫描重试`.
5. UI shows running state and latest result.

API/service contract:
- `getSecurityOperationAlertNotificationTaskOverview()`
- `runSecurityOperationAlertNotificationAutoRetry()`

Prototype requirements:
- Show task card with badges: M87, 任务已启用/未启用, 空闲/执行中.
- Show four metrics: 待自动重试, 失败投递, 部分成功, 已重试.
- Show policy details.
- Show latest result.
- Show empty state when no retryable records exist.

Avoid:
- new route
- complex scheduler editor
- invented middleware status
