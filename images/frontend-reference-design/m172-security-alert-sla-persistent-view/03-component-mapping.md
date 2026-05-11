# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-alerts-content.tsx` | `/security/alerts` route | Reuse existing security workspace; do not create a new route. |
| Page header/refresh | `SecurityWorkspaceHeader`, `RefreshButton` | Existing React Query queries plus new SLA retry/dead-letter queries | Refresh should refetch the new SLA persistence queries too. |
| SLA alert summary | Existing `SLA 告警` card | `getSecurityOperationAlertSlaOverview()` | Keep existing SLA alert list behavior. |
| SLA auto retry panel | New section inside `security-alerts-content.tsx` | `getSecurityOperationAlertSlaNotificationRetryOverview()` / `retryable_items` | Read-only compact list with persistent replay identifiers. |
| SLA retry dead-letter panel | New section inside `security-alerts-content.tsx` | `getSecurityOperationAlertSlaNotificationRetryOverview()` / `dead_letter_items` | Shows notifications already classified as dead letters by retry policy. |
| SLA dead-letter disposition panel | New section inside `security-alerts-content.tsx` | `getSecurityOperationAlertSlaDeadLetterOverview()` / `items` | Shows `latest_action`, `latest_action_event_id`, `latest_action_at`; no inline action form on this page. |
| Status badges | `StatusBadge`, `notificationStatusLabel`, local dead-letter label helpers | Shared types `SecurityOperationAlertSlaDeadLetterAction`, `SecurityOperationAlertSlaDeadLetterDispositionStatus` | Add small local helpers for dead-letter labels/tone. |
| Empty/error/loading | `EmptyState`, `PageError`, `LoadingRows` | React Query loading/error states | Match existing page patterns. |
| Field formatting | `shortId`, `formatDateTime`, `formatNumber` | Persistent fields from shared DTOs | Keep long identifiers compact and scannable. |
