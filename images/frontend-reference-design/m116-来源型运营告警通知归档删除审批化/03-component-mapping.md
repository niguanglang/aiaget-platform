# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Reuse existing Security Center page and Approval Archive Operations section. |
| Notification archive list | `OperationAlertNotificationAuditCard` | `SecurityOperationAlertNotificationArchiveItem` | Add delete request action beside download. |
| Delete approval metrics | new local panel inside `OperationAlertNotificationAuditCard` | `SecurityOperationAlertNotificationArchiveApprovalOverview` | Match existing SLA/recovery archive approval metric style. |
| Approval filters | local state in `OperationAlertNotificationAuditCard` | approval item fields | Filter by keyword, status and pending-only. |
| Approval queue | local table/card rows | `SecurityOperationAlertNotificationArchiveApprovalItem` | Reuse `StatusBadge`, `Button`, `formatDateTime`, `formatBytes`. |
| Approval detail | local detail panel | `SecurityOperationAlertNotificationArchiveApprovalDetail` | Show summary and timeline. |
| Timeline | local timeline rows | `SecurityOperationAlertNotificationArchiveApprovalTimelineItem` | Show event type, status, request_id, trace_id and actor. |
| API client | `apps/web/src/lib/api-client.ts` | shared types | Add delete/approval functions using existing request helper. |
| Backend controller | `apps/control-api/src/security-center/security-center.controller.ts` | DTO + shared types | Add DELETE and archive-approvals endpoints. |
| Backend service | `apps/control-api/src/security-center/security-center.service.ts` | `platform_event`, `StorageService` | Reuse event-sourced approval pattern; delete object only after approve. |
| Shared contracts | `packages/shared-types/src/index.ts` | TypeScript interfaces | Add notification archive approval types. |
| Product docs | `docs/product/m116-operation-alert-notification-archive-delete-approval.md` | milestone acceptance | Document boundary and endpoints. |

Implementation constraints:

- Do not add database tables or migrations.
- Do not start containers or install dependencies.
- Do not operate external object storage during implementation.
- Keep Chinese UI text.
- Keep changes scoped to M116 files and existing Security Center patterns.
