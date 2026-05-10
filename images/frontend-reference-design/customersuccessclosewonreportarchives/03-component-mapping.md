# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/customer-success-opportunities/customer-success-opportunity-close-won-report-content.tsx` | App route `/customer-success-opportunities/[id]/close-won-report` | Reuse current report layout and background. |
| Header status/action row | `Button`, `StatusBadge`, lucide icons | `CustomerSuccessOpportunityCloseWonReport.opportunity` | Add archive action next to existing export action; keep Chinese labels. |
| Report metrics | Existing `MetricCard` in report component | `CustomerSuccessOpportunityCloseWonReport.summary` | No change to current KPI contract. |
| Archive retention card | New local section inside report component | `CustomerSuccessOpportunityCloseWonReportArchiveListResult`, `CreateCustomerSuccessOpportunityCloseWonReportArchiveResult` | Owns archive creation/list/download state. |
| Archive row action | `Button` row operation | `getCustomerSuccessOpportunityCloseWonReportArchiveDownloadUrl` | Opens signed URL in a new tab. |
| Report detail cards | Existing `ReviewBlock`, `SourceChainItem`, `BillingTraceRow`, `InsightList` | Existing report DTO | Keep read-only; no create/edit/close-won actions. |
| API client | `apps/web/src/lib/api-client.ts` | New shared types in `packages/shared-types/src/index.ts` | Preserve request wrapper and auth/trace behavior. |
| Backend routes | `apps/control-api/src/customer-success-opportunities/customer-success-opportunities.controller.ts` | Service methods + storage service | Use existing guards and `customer:success_opportunity:view`. |
| Storage persistence | `apps/control-api/src/storage/storage.service.ts` via Customer Success service | `putTenantObject`, `listTenantObjects`, `getTenantObjectDownloadUrl` | No new middleware/container. |
