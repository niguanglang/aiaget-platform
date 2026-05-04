# Project UI Brief

- Page: M70 Alert Notification Delivery
- Route: /monitor
- Feature goal: 告警通知投递适配
- Target users/roles: 监控、审计、成本运营人员；后端接口使用 `monitor:log:view` 权限。
- APIs/services:
  - `notifyPlatformUsageAlert(alertId, { channels, note })`
  - `listPlatformUsageAlerts({ window })`
  - `updatePlatformUsageAlert(alertId, { action, note })`
- Entities/fields/statuses:
  - `PlatformUsageAlertNotificationResult`: alert_id, status, channels, targets, delivery_event_id, webhook_status, message, delivered_at
  - Channels: `IN_APP`, `WEBHOOK`
  - Status: `SENT`, `PARTIAL`, `SKIPPED`, `FAILED`
- Existing components/design system: Next.js client component, Tailwind CSS, shadcn-style `Card` / `Button`, shared `StatusBadge`, `EmptyState`, React Query, lucide icons, `motion/react`.
- Required states: loading, empty, error, disabled while notifying, success/partial/skipped/failed result notice.
- Constraints:
  - Do not add notification tables; notification delivery is recorded as `platform_event`.
  - Webhook uses existing `external_webhook_url` system setting when configured.
  - UI text must be Chinese.
