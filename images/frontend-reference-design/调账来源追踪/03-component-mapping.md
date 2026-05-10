# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell and header | `apps/web/src/components/billing/billing-adjustments-content.tsx` / `BillingWorkspaceHeader` | `/billing/adjustments` route, `BillingWindow` | Reuse current header and refresh/window control. |
| Summary metrics | `MetricCard` in adjustment page | `BillingOverview.adjustments` | No new metrics; source tracking is row-level. |
| Create adjustment form | `AdjustmentForm` in `billing-adjustments-content.tsx` | `CreateBillingAdjustmentInput`, `createBillingAdjustment` | Keep manual creation separate from source-tracked auto adjustments. |
| Adjustment table | `AdjustmentTable` in `billing-adjustments-content.tsx` | `BillingAdjustmentItem[]` from `getBillingOverview` | Add compact source column; do not embed opportunity details. |
| Source link | `next/link` + small text/button style | `BillingAdjustmentItem.source_label/source_href` | If href exists, link to `/customer-success-opportunities/:id`; otherwise show fallback source text. |
| Row actions | Existing `getAdjustmentActions` + `BillingConfirmDialog` | approve/apply/void mutation APIs | Keep high-risk actions confirmed. |
| Feedback states | `PageError`, `ActionMessage`, `EmptyState` | React Query loading/error and permission checks | Chinese copy only. |
