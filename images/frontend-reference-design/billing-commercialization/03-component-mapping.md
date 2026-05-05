# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell/header | `apps/web/src/components/billing/billing-content.tsx` | `/billing` route | Reuse current max-width grid and header badges |
| Window toolbar | `BillingContent` local segmented buttons + `Button` | `getBillingOverview({ window })` | Preserve `24h/7d` query key behavior |
| Metric cards | `MetricCard` | `BillingSummary` | Keep existing summary cards |
| Subscription and plan catalog | `SubscriptionCard`, `PlanCatalogCard` | `BillingSubscriptionItem`, `BillingPlanItem`, `updateBillingSubscription` | Keep existing action contract |
| Quota policy editor | `QuotaPolicyCard`, `Input`, local `SegmentedSelect` | `BillingQuotaPolicyItem`, `updateBillingQuotaPolicy` | Keep validation and mutation behavior |
| Invoice workbench | Replace `InvoiceCard` internals in `billing-content.tsx` | `BillingInvoiceItem`, `BillingAdjustmentItem` | Add status filter, selected invoice detail, parsed line items, linked adjustments |
| Adjustment center | `AdjustmentCard` | `BillingAdjustmentItem`, `CreateBillingAdjustmentInput`, `createBillingAdjustment` | Keep permission disabled state; use invoice list from overview |
| Feedback states | Existing banners, `EmptyState`, loading text | React Query state + mutation state | Preserve Chinese messages |
| Cost/risk sections | Existing cards/tables | Cost/risk DTOs from `BillingOverview` | No unrelated redesign |

## Implementation Plan

1. Keep API function signatures unchanged; no backend changes.
2. Add local UI state for selected invoice and invoice status filter.
3. Convert the invoice list into a two-column billing detail workbench.
4. Parse `line_items` defensively from known array/object shapes and fall back to a single subtotal line.
5. Show linked adjustments for the selected invoice and calculate outstanding amount from existing invoice fields.
6. Validate with the web typecheck/lint commands where possible.
