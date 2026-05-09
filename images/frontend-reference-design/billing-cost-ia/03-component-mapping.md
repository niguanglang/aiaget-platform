# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console page shell | Route files under `apps/web/src/app/(console)/billing/**/page.tsx` | Next App Router | One route page per IA boundary. |
| Billing workspace header | New shared helper in `apps/web/src/components/billing/billing-shared.tsx` | `BillingWindow` | Chinese titles, back link on child pages, refresh/window actions. |
| Overview metrics | `MetricCard`, `StatusBadge`, `Card` | `BillingOverview.summary` | Keep `/billing` read-oriented; show cost, tokens, forecast, period cost, quota risk. |
| Route entry grid | `Card`, `Button` with `Link` and lucide icons | Static routes | Entrypoints for usage, quota, invoices, adjustments, subscription. |
| Usage details | `billing-usage-content.tsx` | `getBillingOverview`, `BillingProviderCostItem`, `BillingModelCostItem`, `BillingApiKeyQuotaItem`, `BillingConversationCostItem`, `BillingCostTrendPoint` | Focused list/table page for Token and cost details. |
| Quota policy | `billing-quota-policy-content.tsx` | `getBillingOverview`, `updateBillingQuotaPolicy`, `enforceBillingQuota`, `BillingQuotaPolicyItem` | Owns quota edit controls and quota execution result. |
| Invoices | `billing-invoices-content.tsx` | `getBillingOverview`, `recalculateCurrentBillingInvoice`, `BillingInvoiceItem` | 发票列表页只展示发票识别、状态、账期、总额、未结清和详情入口；单张发票状态流转不在列表页内展开。 |
| Invoice detail | `apps/web/src/app/(console)/billing/invoices/[invoiceId]/page.tsx`, `billing-invoice-detail-content.tsx` | `getBillingInvoiceDetail`, invoice status mutation APIs, `BillingInvoiceDetail` |独立详情页承载账单项明细、关联调账、状态操作和确认弹窗；后端提供 `GET /billing/invoices/:id`。 |
| Adjustments | `billing-adjustments-content.tsx` | `getBillingOverview`, adjustment mutation APIs, `BillingAdjustmentItem` | Owns adjustment creation form and approval/apply/void actions. |
| Subscription | `billing-subscription-content.tsx` | `getBillingOverview`, `updateBillingSubscription`, `BillingPlanItem`, `BillingSubscriptionItem` | Owns plan catalog and subscription edit controls. |
| High-impact confirmation | `BillingConfirmDialog` in `billing-shared.tsx` | invoice, quota, adjustment and subscription mutation flows | Recalculating invoices, changing invoice status, saving quota policy, running quota checks, creating/applying/voiding adjustments and switching plans require explicit confirmation before mutation. |
| Shared labels/formatting | `billing-shared.tsx` | Billing enums from `@aiaget/shared-types` | Prevent duplicated enum maps and format helpers across pages. |
| Menu seed | `apps/control-api/prisma/seed.ts` | `PERMISSION_CODES.billingCenterView` | Add only static child pages if contract proves necessary; no dynamic or form-detail routes. |
| Feedback states | `EmptyState`, inline error/status panels | React Query state and mutation errors | Loading, empty, error, disabled and success message states per focused page. |
