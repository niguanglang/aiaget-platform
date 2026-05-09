# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell/background | `CustomerSuccessActionBackground`, route pages under `apps/web/src/app/(console)/customer-success-actions` | Next.js App Router | Reuses existing console layout conventions |
| Header actions | `Button`, `StatusBadge`, `Link` | `hasPermission`, `customer:success_action:manage` | Disabled primary action when user lacks permission |
| Metrics | `MetricCard` | `CustomerSuccessActionListItem[]` | Current page + total from paginated API |
| Filters | native select + `Input` styling | `listCustomerSuccessActions` params | Keeps list page as query/filter surface |
| Compact table | `customer-success-actions-content.tsx` | `CustomerSuccessActionListItem` | Does not embed full execution detail fields |
| Archive confirm | `Card`, destructive `Button` | `deleteCustomerSuccessAction` | Soft archive with confirmation |
| Detail page | `customer-success-action-detail-content.tsx` | `getCustomerSuccessAction` / `CustomerSuccessActionDetail` | Owns expected outcome, execution notes, blockers, evidence |
| Create/edit forms | `CustomerSuccessActionFormPanel` | `CreateCustomerSuccessActionInput`, `UpdateCustomerSuccessActionInput` | Independent pages with grouped sections |
| Related resource selectors | `CustomerSuccessActionFormPanel` | `listCustomerSuccessPlans`, `listDeliveryReviews`, `listDeliveryAssets`, `listSolutionPackages`, `listUsers` | Preserves source chain and ownership |
