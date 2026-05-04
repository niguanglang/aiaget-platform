# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Approval audit archive card | `apps/web/src/components/approval-audits/approval-audit-content.tsx` | archive APIs | Change delete to request deletion |
| Approval center tabs | `apps/web/src/components/approvals/approval-content.tsx` | approval APIs | Add `ARCHIVE_DELETE` approval type |
| Archive delete list | new section inside `ApprovalContent` | `ArchiveDeleteApprovalItem[]` | No new route |
| Archive delete detail | new panel inside `ApprovalContent` | `ArchiveDeleteApprovalDetail` | Approve/reject buttons |
| Backend endpoints | `ApprovalsController` | archive approval service methods | Use existing controller namespace |
| Service state derivation | `ApprovalsService` | `approval_audit_event` | No new DB table |
| Shared types | `packages/shared-types/src/index.ts` | archive approval item/detail/overview/input | Add minimal DTOs |
| API client | `apps/web/src/lib/api-client.ts` | new list/get/approve/reject functions | Use existing request helper |
| Product docs | `docs/product/m81-archive-operation-audit-approval.md` | milestone acceptance | Link from README |
