# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/customer-success-plans/page.tsx` + `CustomerSuccessPlansContent` | App Router console layout | Reuse M123 dashboard density and subtle background |
| Header and metrics | `MetricCard`, `StatusBadge`, `Button` | `PaginatedResult<CustomerSuccessPlanListItem>` | Metrics are current-page summaries plus total, not invented analytics |
| Search/filter toolbar | native inputs/selects + `Button` | `listCustomerSuccessPlans` query params | Stage/status/priority/health/owner/review/asset/package filters |
| Compact table | `customer-success-plans-content.tsx` | `CustomerSuccessPlanListItem` | Only core fields and previews; no full long text in rows |
| Detail view | `customer-success-plan-detail-content.tsx` | `getCustomerSuccessPlan` / `CustomerSuccessPlanDetail` | Owns success objectives, stakeholder plan, asset reuse, renewal, risk, next action |
| Create/edit form | `customer-success-plan-form-panel.tsx` | `CreateCustomerSuccessPlanInput`, `UpdateCustomerSuccessPlanInput` | Independent create/edit pages, grouped fields, validation |
| Archive confirmation | Inline confirmation card pattern from M123 | `deleteCustomerSuccessPlan` | Requires second confirmation and error display |
| Feedback states | `EmptyState`, loading/error blocks, disabled buttons | React Query state and permissions | Chinese visible text |
