# Project UI Brief

- Page: 续约机会成交入账
- Route: /customer-success-opportunities/:id
- Feature goal: 在续约机会详情页生成成交入账记录并联动计费调账
- Parent layout: Next.js App Router console shell, existing customer success opportunity detail page.
- Target users: 客户成功负责人、租户管理员、财务/运营管理员。
- Permissions: `customer:success_opportunity:manage` plus `billing:adjustment:manage`; tenant admin bypass follows current frontend permission pattern.
- APIs/services: new `POST /customer-success-opportunities/:id/close-won-adjustment`; existing `GET /customer-success-opportunities/:id`; existing billing adjustment and invoice pages for follow-up.
- Entities/fields/statuses: `CustomerSuccessOpportunityDetail` with amount, probability, stage/status, expected/closed time, linked resources; new result includes `BillingAdjustmentItem`; opportunity moves to `WON`/`WON`, `closed_at` is recorded, adjustment uses `source_type=CUSTOMER_SUCCESS_OPPORTUNITY`.
- Existing components/design system: `Card`, `Button`, `StatusBadge`, existing opportunity status labels, billing adjustment labels, lucide icons, React Query mutation/invalidation.
- Required states: loading, existing closed-won record, eligible to close, permission denied, validation error for amount/reason, confirmation modal, pending mutation, success notice, API error.
- IA constraints: this is an object-level action on the opportunity detail page; list page and analytics page remain read/query surfaces and must not own成交入账 mutation.
