# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/tenants/page.tsx` | Console layout | New independent route. |
| Header | `motion.section`, `StatusBadge`, `Button` | `currentUser.tenant`, permissions | Show scoped current tenant note. |
| Metrics | `MetricCard` | `TenantDetail`, `PaginatedResult<TenantListItem>` | Current backend returns current tenant context. |
| Tenant profile | `Card`, `StatusBadge` | `getTenant(currentUser.tenant.id)` | Show id/code/name/status/timestamps. |
| Tenant list | `Card`, native table | `listTenants` | Search/status filters supported. |
| Edit drawer | React Hook Form + Zod + `Input` + select | `updateTenant` | Only name/status supported. |
| Governance panel | `Card` | static product guidance from real constraints | Explain tenant-scoped current backend. |
| Navigation/menu | `moduleSpecs`, `navigation.ts`, `menu-navigation.ts`, `seed.ts` | `system:tenant:view/manage` | Add `/tenants` menu under system management. |
