# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Audit page shell | `apps/web/src/app/(console)/audit/page.tsx`, `AuditContent` | route `/audit`, permission `security:audit:view` | Reuse existing page |
| Audit metrics | `MetricCard` in `AuditContent` | `AuditOverview.summary` | Keep current metrics |
| Approval audit linkage card | new small section inside `AuditContent` | `getApprovalAuditOverview({ window })` | Shows approval audit count, failures, trace count, action link |
| Audit event table/detail | existing table + `AuditDetailPanel` | `listAuditEvents`, `getAuditEvent` | Preserve current contract |
| Approval audit page shell | `apps/web/src/app/(console)/approval-audits/page.tsx`, `ApprovalAuditContent` | route `/approval-audits`, permission `security:approval:view` | Existing M78 page |
| Approval audit filters | Tailwind inputs/selects + `Button` | `ListApprovalAuditEventsQuery` | Add export button beside refresh/clear |
| Approval audit export | `exportApprovalAuditEvents` in API client | `GET /tool-approvals/audit-events/export` | Browser downloads CSV blob |
| Approval audit table/detail | existing M78 table/detail panel | `ApprovalAuditEventItem` | Keep Chinese text and links |
| Backend export route | `ApprovalsController`, `ApprovalsService` | `approval_audit_event` | CSV generated from current filters, no DB changes |
| Shared types | `packages/shared-types/src/index.ts` | export result / audit source expansion | Add only necessary fields |
| Product docs | `docs/product/m79-approval-audit-export-linkage.md` | milestone acceptance | Link from product README |
