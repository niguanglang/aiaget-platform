# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Reuse existing page |
| Audit list query | new api-client function | `GET /security-center/operation-alert-notifications` | TanStack Query |
| Retry action | new api-client function | `POST /security-center/operation-alert-notifications/:id/retry` | Mutation |
| Backend controller | `SecurityCenterController` | two new endpoints | Secured by `security:rule:view` |
| Backend service | `SecurityCenterService` | `platform_event` notification events | No new table |
| Shared types | `packages/shared-types/src/index.ts` | notification item/overview | Add audit contract |
| UI region | new `OperationAlertNotificationAuditCard` inside security content | overview/list data | Compact table |
| Product docs | `docs/product/m86-approval-archive-alert-notification-retry-audit.md` | milestone acceptance | Link from README |
