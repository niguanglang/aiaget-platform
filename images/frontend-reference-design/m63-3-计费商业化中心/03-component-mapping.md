# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/billing/billing-content.tsx` | `/billing` route | Reuse current console shell and max-width layout. |
| Header toolbar | `Button`, `StatusBadge`, local segmented buttons | `BillingWindow` | Keep existing 24h/7d window and refresh action. |
| Metric grid | `MetricCard` | `BillingOverview.summary` | Extend current six cards with subscription/cycle metrics. |
| Current subscription | `Card`, `StatusBadge`, `Button` | `BillingSubscriptionItem`, `BillingSummary` | Show plan, period, base price, included quota, overage estimate, auto renew. |
| Plan catalog | `Card`, `Button`, `StatusBadge` | `BillingPlanItem[]`, `updateBillingSubscription` | Three cards, current plan highlighted, monthly/yearly switch. |
| Invoice list | Responsive `table` in `Card` | `BillingInvoiceItem[]` | Show latest invoices with Chinese status labels and empty state. |
| Quota policies | `Card`, `Input`, `Button`, usage bars | `BillingQuotaPolicyItem[]`, `updateBillingQuotaPolicy` | Inline editor for selected policy; validate threshold before PATCH. |
| Existing cost trend | `CostTrendCard` | `BillingCostTrendPoint[]` | Keep M47 behavior. |
| Existing provider/model/API key/conversation sections | Existing local cards | Existing M47 types | Keep current operational cost visibility. |
| Feedback states | Loading skeletons, error banner, `EmptyState`, disabled buttons | React Query state | Use current local patterns, no toast dependency introduced. |

## Files To Edit

- `packages/shared-types/src/index.ts`
- `apps/control-api/prisma/schema.prisma`
- `apps/control-api/prisma/migrations/20260502123000_m63_billing_commercialization/migration.sql`
- `apps/control-api/prisma/seed.ts`
- `apps/control-api/src/billing/*`
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/components/billing/billing-content.tsx`

## Validation

- `pnpm --filter @aiaget/control-api prisma:generate`
- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/web typecheck`
