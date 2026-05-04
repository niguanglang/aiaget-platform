# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/users/page.tsx` | Console layout | New independent route. |
| Header | `motion.section`, `StatusBadge`, `Button` | `currentUser.permissions` | Show management permission state. |
| Metrics | `MetricCard` | `PaginatedResult<UserListItem>` | Compute from current page results and total. |
| Filters | `Input`, native selects | `listUsers` query params | Keyword, status, department. |
| Table | `Card`, native table, `StatusBadge` | `UserListItem` | No invented columns. |
| Detail panel | `Card` | selected `UserListItem` | Show roles, department, timestamps. |
| Create/edit drawer | `react-hook-form`, `zod`, `Input`, native select/checkbox | `CreateUserInput`, `UpdateUserInput`, `RoleListItem`, `DepartmentTreeItem` | Password required on create, optional on edit. |
| Delete modal | local confirm dialog | `deleteUser` | Self-delete disabled. |
| Navigation/menu | `moduleSpecs`, `navigation.ts`, `menu-navigation.ts`, `seed.ts` | `system:user:view/manage` | Add `/users` menu under system management. |
