# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Reuse existing page |
| Overview query | `getSecurityCenterOverview()` | `SecurityCenterOverview` | No new endpoint |
| Backend derivation | `SecurityCenterService.getOverview` | `approval_operations` | Add derived alerts from existing counters |
| Shared alert type | `packages/shared-types/src/index.ts` | `SecurityCenterOperationalAlert` | Reusable alert item contract |
| Operations card | `ApprovalArchiveOperationsCard` | `overview.approval_operations.operational_alerts` | Add alert closure region |
| Alert card | new local `OperationAlertCard` | alert item fields | Link-only action |
| Empty state | existing `EmptyState` | zero alerts | Stable operation message |
| Product docs | `docs/product/m83-approval-archive-operation-alert-closure.md` | milestone acceptance | Link from README |
