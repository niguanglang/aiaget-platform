# Billing Cost IA Project UI Brief

## Feature Goal

将后台成本与计费中心从单一混合页面拆分为保守的一级页面边界：`/billing` 只做成本总览、筛选、近期摘要和入口；订阅、额度策略、发票、调账、用量明细分别进入独立中文职责页。

## Route And Layout

- Parent layout: Next.js App Router console shell under `apps/web/src/app/(console)`.
- Overview route: `/billing` backed by `apps/web/src/components/billing/billing-content.tsx`.
- Child routes: `/billing/usage`, `/billing/quota-policy`, `/billing/invoices`, `/billing/adjustments`, `/billing/subscription`.

## Users And Permissions

- View users need `billing:center:view` for overview, usage, invoices, quota assessment, and cost data.
- Adjustment actions require tenant admin role or `billing:adjustment:manage`.
- Subscription and quota policy mutations are backed by backend `system:settings:manage`; UI should gate write actions with the same practical permission pattern used elsewhere.

## API Contract

- `getBillingOverview({ window })` returns `BillingOverview` with summary, plans, subscription, invoices, quota policies, adjustments, cost trend, provider/model cost, API key quota and conversation costs.
- Existing mutations only: `updateBillingSubscription`, `updateBillingQuotaPolicy`, `createBillingAdjustment`, `approveBillingAdjustment`, `applyBillingAdjustment`, `voidBillingAdjustment`, `recalculateCurrentBillingInvoice`, `lockBillingInvoice`, `markBillingInvoicePaid`, `voidBillingInvoice`, `markBillingInvoiceOverdue`, `enforceBillingQuota`.
- Do not invent new backend list/detail APIs for this split.

## Entities And Fields

- Summary: total cost, model cost, run step cost, tokens, model calls, projected monthly cost, current period cost, overage, adjustment total, next invoice estimate, quota policy counts, risky API key count.
- Usage: cost trend, provider costs, model costs, API key quota, conversation costs.
- Quota policy: subject, metric, period, limit, warning/hard thresholds, action, status, usage rate, risk level, last evaluation.
- Invoices: invoice number, status, period, subtotal, discount, tax, total, paid/outstanding amount, due/paid time, line items.
- Adjustments: adjustment number, type, status, signed amount, invoice link, reason, description, approval/effective metadata.
- Subscription: plan catalog, current subscription, cycle, price, included cost/tokens/calls/storage, auto renew, current period.

## Components And States

- Reuse `Card`, `MetricCard`, `StatusBadge`, `EmptyState`, `Button`, `Input`, lucide icons, React Query, and existing format helpers.
- Each page should include loading, empty, error, permission-disabled and action feedback states where applicable.
- Keep SaaS/admin density: compact headers, metrics, filters, tables and side summaries; no landing-page hero or decorative marketing sections.

## Constraints

- Chinese UI copy.
- `/billing` must not contain full adjustment form, quota policy editing form, invoice status editing surface, or subscription editing/catalog form.
- Dynamic or form-detail routes are out of menu seed; only static IA child pages may be seeded if needed.
