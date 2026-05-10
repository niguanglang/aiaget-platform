# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security alerts approval workbench | `apps/web/src/components/security/security-alerts-content.tsx` | `exportSecurityApprovalWorkbenchItems` | Existing UI remains; export payload changes server-side. |
| Export button | Existing “导出当前筛选” button | `ListSecurityApprovalWorkbenchQuery` | No new button; keeps current placement and disabled/error states. |
| CSV generation | `apps/control-api/src/security-center/security-approval-workbench.service.ts` | `WorkbenchSourceRecord.metadata` | Adds notification filter context columns. |
| Backend test | `security-approval-workbench.service.test.ts` | `exportCsv` | Locks CSV header and Chinese values for customer success notification archive context. |
| Product docs | `docs/product/m143-approval-workbench-export-filter-context.md` | Milestone acceptance | Documents that this is an export-contract enhancement only. |
