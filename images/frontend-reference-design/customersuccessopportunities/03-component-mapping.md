# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell/background | `CustomerSuccessOpportunityBackground`, route pages under `apps/web/src/app/(console)/customer-success-opportunities` | Next.js App Router | Mirrors M125 page shell while using a commercial pipeline theme |
| Header actions | `Button`, `StatusBadge`, `Link` | `hasPermission`, `customer:success_opportunity:manage` | Primary action disabled when user lacks permission |
| Metrics | `MetricCard` | `CustomerSuccessOpportunityListItem[]` | Uses paginated total plus current-page opportunity values |
| Filters | native select + `Input` styling | `listCustomerSuccessOpportunities` params | Keeps list page as query/filter surface |
| Compact table | `customer-success-opportunities-content.tsx` | `CustomerSuccessOpportunityListItem` | Does not embed full commercial detail fields |
| Archive confirm | `Card`, destructive `Button` | `deleteCustomerSuccessOpportunity` | Soft archive with confirmation |
| Detail page | `customer-success-opportunity-detail-content.tsx` | `getCustomerSuccessOpportunity` / `CustomerSuccessOpportunityDetail` | Owns customer value, commercial strategy, decision path, risk summary and linked resources |
| Create/edit forms | `CustomerSuccessOpportunityFormPanel` | `CreateCustomerSuccessOpportunityInput`, `UpdateCustomerSuccessOpportunityInput` | Independent pages with grouped sections |
| Related resource selectors | `CustomerSuccessOpportunityFormPanel` | `listCustomerSuccessPlans`, `listCustomerSuccessActions`, `listDeliveryReviews`, `listDeliveryAssets`, `listSolutionPackages`, `listUsers` | Preserves source chain and ownership |
