# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real SaaS/admin console page group.

Project context:
- Product/module: AIAget 成本与计费中心.
- Page/route: `/billing` overview with linked child pages `/billing/usage`, `/billing/quota-policy`, `/billing/invoices`, `/billing/adjustments`, `/billing/subscription`.
- Target users/roles: tenant operators, finance operators, platform administrators; view users have `billing:center:view`, adjustment managers have `billing:adjustment:manage`, quota/subscription editors use system settings management permission.
- Business goal: turn usage and model costs into a clear operational cost center while separating configuration and finance operations into focused pages.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, React Query, Tailwind utility classes, compact admin components (`Card`, `MetricCard`, `StatusBadge`, `Button`, `Input`, `EmptyState`) and lucide icons.
- Existing page shell/layout: console layout with constrained max-width content, dense cards, tables, filters, and no marketing hero.

Interface contract that must appear in the UI:
- API/service functions: `getBillingOverview`, `updateBillingSubscription`, `updateBillingQuotaPolicy`, `createBillingAdjustment`, `approveBillingAdjustment`, `applyBillingAdjustment`, `voidBillingAdjustment`, `recalculateCurrentBillingInvoice`, `lockBillingInvoice`, `markBillingInvoicePaid`, `voidBillingInvoice`, `markBillingInvoiceOverdue`, `enforceBillingQuota`.
- Main entities and fields: billing summary metrics, cost trend buckets, provider costs, model costs, API key quota rows, conversation cost rows, quota policies, invoices, adjustments, plans and current subscription.
- Status values/enums: invoice status DRAFT/OPEN/PAID/VOID/OVERDUE; adjustment PENDING/APPROVED/APPLIED/REJECTED/VOID; quota risk NORMAL/WARNING/CRITICAL/UNLIMITED; subscription TRIALING/ACTIVE/PAST_DUE/SUSPENDED/CANCELED.
- User actions: change time window, refresh, navigate to child pages, enforce quota check, edit quota policy, invoice status actions, create/approve/apply/void adjustment, change subscription plan/cycle.
- Required states: loading, empty, error, disabled actions for missing permission, success/error action message.

Design requirements:
- Show `/billing` as a calm cost overview with top metrics, cost trend, recent invoice/adjustment/quota summaries and a compact entry grid to child pages.
- Show child pages as focused admin surfaces: usage tables, quota policy editor, invoices table with detail drawer/panel, adjustment creation and approval records, subscription plan/catalog controls.
- Use Chinese titles and operational labels.
- Use a restrained admin palette with clear status color coding; avoid one-note purple/blue gradients and decorative orbs.
- Preserve compact, repeatable workflow density suitable for finance/ops staff.

Avoid:
- Invented backend fields not listed above.
- Marketing landing-page composition.
- Oversized hero cards, nested cards, fake charts with unrelated data, unreadable tiny text, or global navigation redesign.
