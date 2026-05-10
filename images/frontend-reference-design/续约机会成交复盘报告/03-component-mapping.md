# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Route page | `apps/web/src/app/(console)/customer-success-opportunities/[id]/close-won-report/page.tsx` | App Router params | New read-only report route. |
| Report content | `customer-success-opportunity-close-won-report-content.tsx` | `getCustomerSuccessOpportunityCloseWonReport` | Reuse existing background, Card, Button, StatusBadge. |
| Header actions | report content | route links | Back to detail, billing adjustments, audit search. |
| Summary metrics | report content | `report.summary` | Estimated amount, close amount, weighted amount, adjustment count. |
| Source chain | report content | `report.source_chain` | Plan/action/review/asset/package links as compact cards. |
| Billing trace | report content | `report.billing_trace` | Compact rows; no approval mutations. |
| IA tests | `customer-success-opportunities-route-ia-contract.test.ts` | source assertions | Ensure report route exists and mutations stay out. |
