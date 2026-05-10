# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Header export action | `customer-success-opportunity-close-won-report-content.tsx` | `exportCustomerSuccessOpportunityCloseWonReport` | Add read-only Markdown download button. |
| Download helper | report content or shared local helper | Browser Blob API | Reuse local `downloadBlob` pattern from agent team reports. |
| Backend export | `customer-success-opportunities.controller.ts` | `exportCloseWonReportMarkdown` | Return `text/markdown; charset=utf-8` with attachment filename. |
| Report content | `customer-success-opportunities.service.ts` | existing `getCloseWonReport` | Build Markdown from existing report data. |
| IA tests | `customer-success-opportunities-route-ia-contract.test.ts` | source assertions | Keep export out of list and analytics pages. |
