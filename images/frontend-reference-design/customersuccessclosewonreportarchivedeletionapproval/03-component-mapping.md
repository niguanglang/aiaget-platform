# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Report archive card | `apps/web/src/components/customer-success-opportunities/customer-success-opportunity-close-won-report-content.tsx` | `CustomerSuccessOpportunityCloseWonReportArchiveItem` | Add row-level request delete with confirmation. |
| Report API client | `apps/web/src/lib/api-client.ts` | `deleteCustomerSuccessOpportunityCloseWonReportArchive` | DELETE creates approval only. |
| Approval aggregate page | `apps/web/src/components/approvals/archive-deletion-approvals-content.tsx` | `CustomerSuccessOpportunityCloseWonReportArchiveApprovalItem` | Add customer success source as peer source. |
| Approval decisions | `DecisionActions` in `approval-shared` | approve/reject API functions | Keep decision note and permission behavior. |
| Backend controller | `apps/control-api/src/customer-success-opportunities/customer-success-opportunities.controller.ts` | DELETE + list/approve/reject approval routes | Reuse auth, data scope/resource ACL for report archive request; security approval permissions for review. |
| Backend service | `apps/control-api/src/customer-success-opportunities/customer-success-opportunities.service.ts` | `approvalAuditEvent`, `StorageService.deleteTenantObject` | Approval applies deletion only after approve. |
| Product docs | `docs/product/m137-...md` | Milestone acceptance | Document no middleware/table changes. |
