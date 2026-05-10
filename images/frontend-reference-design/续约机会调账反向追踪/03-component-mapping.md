# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Detail page shell | `apps/web/src/components/customer-success-opportunities/customer-success-opportunity-detail-content.tsx` | `getCustomerSuccessOpportunity(opportunityId)` | Reuse current layout and background. |
| Close-won card | `CloseWonAdjustmentCard` in same file | `CustomerSuccessOpportunityDetail.billing_adjustments` + close-won mutation | Extend card props with adjustment array. |
| Adjustment summary rows | New small helper inside detail component | `BillingAdjustmentItem` fields | Keep compact; no approval actions. |
| Billing route entry | `Button asChild` + `Link` | `/billing/adjustments` | Use query keyword if supported only by route convention; otherwise plain route. |
| Audit route entry | `Button asChild` + `Link` | `/audit?keyword=<adjustment_no>` | Audit search already supports keyword style. |
| Feedback states | Existing notice/error blocks | React Query and mutation state | Chinese copy only. |
