# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Reuse existing security center page |
| SLA notification overview query | `apps/web/src/lib/api-client.ts` | `GET /security-center/operation-alert-sla/notifications/overview` | TanStack Query |
| Notify overdue action | `apps/web/src/lib/api-client.ts` | `POST /security-center/operation-alert-sla/notify-overdue` | Mutation |
| Backend service | `SecurityOperationAlertSlaService` | `platform_event` + `system_setting` | Extend M88 service |
| Backend controller | `SecurityCenterController` | SLA notification endpoints | Secured by `security:rule:view` |
| Shared types | `packages/shared-types/src/index.ts` | SLA notification overview/result | Used by web and control API |
| UI card | `OperationAlertSlaNotificationCard` | notification overview | `MetricCard`, `StatusBadge`, `EmptyState`, `Button` |
| Product docs | `docs/product/m89-approval-archive-alert-sla-notifications.md` | milestone acceptance | Link from product README |
