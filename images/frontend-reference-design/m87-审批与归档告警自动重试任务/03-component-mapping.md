# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Reuse existing page |
| Task overview query | api-client function | `GET /security-center/operation-alert-notification-tasks/overview` | TanStack Query |
| Manual run | api-client function | `POST /security-center/operation-alert-notification-tasks/run-auto-retry` | Mutation |
| Backend service | new `SecurityOperationAlertNotificationTaskService` | platform events + settings | No new table |
| Backend controller | `SecurityCenterController` | task endpoints | Secured by `security:rule:view` |
| Shared types | `packages/shared-types/src/index.ts` | task overview/result | Similar to platform usage task |
| UI card | new `OperationAlertNotificationTaskCard` | task overview | MetricCard + StatusBadge |
| Product docs | `docs/product/m87-approval-archive-alert-auto-retry-task.md` | milestone acceptance | Link from README |
