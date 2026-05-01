# Component Mapping
| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page route | `apps/web/src/app/(console)/roles/page.tsx` | Console app router | New route under existing shell |
| Page content | `apps/web/src/components/roles/role-permission-content.tsx` | role APIs | New focused component |
| Metrics | `MetricCard` | `RoleOverview` | total/active/system/custom/users |
| Role list | `Card` + table/list | `RoleListItem` | Search/status filter, selected state |
| Role detail | right panel/card | `RoleDetail` | profile, users, menu summary |
| Permission matrix | grouped checkbox cards | `PermissionCatalogGroup` + `UpdateRolePermissionsInput` | Group by module/resource |
| Role form | drawer panel | `CreateRoleInput`, `UpdateRoleInput` | zod validation, code read-only on edit |
| Feedback states | `EmptyState`, inline errors | query/mutation states | Loading/error/empty/disabled |
| Navigation/menu | seed + dynamic menu | `system:role:view` | Add role page menu under system management |
| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
