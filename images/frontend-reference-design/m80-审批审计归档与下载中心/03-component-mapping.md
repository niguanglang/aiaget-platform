# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/approval-audits/page.tsx` | route `/approval-audits` | Reuse existing M78/M79 page |
| Approval audit content | `apps/web/src/components/approval-audits/approval-audit-content.tsx` | approval audit APIs | Add archive card, keep existing table/detail |
| Archive actions | `Button`, `StatusBadge` | create/list/delete/download archive endpoints | Chinese UI |
| Archive list | `Card`, table/list | `ApprovalAuditArchiveItem[]` | Derived from MinIO objects |
| Backend archive endpoints | `ApprovalsController` | `ApprovalsService` | No new DB table |
| Storage integration | `StorageService` | MinIO object operations | Add internal helper methods for raw object write/list/delete/download |
| Shared types | `packages/shared-types/src/index.ts` | `ApprovalAuditArchiveItem`, `ApprovalAuditArchiveListResult` | Keep fields minimal |
| API client | `apps/web/src/lib/api-client.ts` | new archive functions | Use existing request helper |
| Product docs | `docs/product/m80-approval-audit-archive-center.md` | milestone acceptance | Link from product README |
