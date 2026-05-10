# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Export toolbar | `SecurityAlertsContent` approval workbench card | `approvalTotal`, `exportMutation` | Update Chinese helper/success copy |
| Backend CSV | `SecurityApprovalWorkbenchService` | `buildApprovalWorkbenchCsv` | Add three CSV columns from metadata |
| Audit payload | `platform.security.approval_workbench.exported` | `APPROVAL_WORKBENCH_EXPORT_FIELDS` | Field list must include ledger columns |
| Tests | `security-approval-workbench.service.test.ts`, `security-route-ia-contract.test.ts` | CSV + UI contract | TDD red/green |
| Product docs | `docs/product/m153-approval-workbench-export-field-ledger-count.md` | acceptance criteria | Document no-list-column rule |
