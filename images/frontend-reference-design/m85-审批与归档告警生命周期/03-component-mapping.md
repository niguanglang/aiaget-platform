# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Reuse existing page |
| Overview query | `getSecurityCenterOverview()` | `SecurityCenterOverview` | Include derived lifecycle fields |
| Backend derivation | `SecurityCenterService.getOverview` | `platform_event` lifecycle events | No new table |
| Lifecycle action API | `SecurityCenterController` | `POST /operation-alerts/:alertId/actions` | Secured by `security:rule:view` |
| Shared types | `packages/shared-types/src/index.ts` | status/action/result types | Add lifecycle contract |
| API client | `apps/web/src/lib/api-client.ts` | `updateSecurityOperationAlert` | POST action |
| Alert card | `OperationAlertCard` | `SecurityCenterOperationalAlert` | Add status badge and action buttons |
| Product docs | `docs/product/m85-approval-archive-alert-lifecycle.md` | milestone acceptance | Link from README |
