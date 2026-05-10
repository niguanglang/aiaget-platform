# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security event detail page | `apps/web/src/components/security/security-event-detail-content.tsx` | `getSecurityCenterEvent(eventId)` | No component change required; existing `JsonBlock` displays context. |
| Export audit payload | `SecurityApprovalWorkbenchService.exportCsv` | `platform.security.approval_workbench.exported` payload | Writes `exported_fields` and `notification_archive_filter_fields`. |
| Platform event mapping | `mapPlatformSecurityEvent` in `security-center.service.ts` | `SecurityCenterEventDetail.context` | Copies field arrays into event context. |
| Backend tests | `security-approval-workbench.service.test.ts`, `security-events-ledger.test.ts` | export and event detail behavior | Covers payload write and detail context mapping. |
| Product docs | `docs/product/m145-approval-export-audit-field-ledger.md` | milestone acceptance | Documents audit field ledger scope. |
