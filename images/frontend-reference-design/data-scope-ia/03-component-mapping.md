# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/data-scopes/**/page.tsx` | Next.js console layout | Keep `/data-scopes` and add role detail/edit route files. |
| Shared visual background/status labels | `DataScopeBackground`, `data-scope-status.ts` | data-scope enums from `@aiaget/shared-types` | Reuse labels, tone helpers, date formatting, resource order. |
| Shared IA helpers | `data-scope-shared.tsx` | `RoleDataScopeItem`, `RoleDataScopeValue`, `DataScopePreviewResult` | Hold metrics, role list, matrix, selector, preview summary, flatten helpers. |
| List page header/metrics | `data-scope-content.tsx` | `getDataScopeOverview`, `listRoles`, `listRoleDataScopes` | List-only overview, role/scope filters, route links; no draft/edit/preview state. |
| Role/scope list | `data-scope-content.tsx` | `RoleListItem`, `RoleDataScopeItem[]` | Surface role rows and current scope records; links to detail/edit routes. |
| Detail route | `data-scope-detail-content.tsx` | `getRoleDataScopes` | Read-only role summary, resource matrix, scope value summary, impact summary. |
| Edit route | `data-scope-edit-content.tsx` | `getRoleDataScopes`, `getDepartmentTree`, `listUsers`, `replaceRoleDataScopes`, `previewDataScope` | Owns draft state, preview mutation, save/reset, tenant-admin disabled state. |
| Custom selectors | `data-scope-shared.tsx` | `DepartmentTreeItem`, `UserListItem`, `RoleDataScopeValue` | Reuse current department/user/resource ID UI only on edit page. |
| Preview panel | `data-scope-shared.tsx` | `DataScopePreviewResult` | Button-enabled preview panel only in edit route; read-only summary in detail route. |
| Menu IA contract | `apps/control-api/src/menus/data-scope-menu-ia-contract.test.ts` | `apps/control-api/prisma/seed.ts` | Assert only `/data-scopes` is seeded; role detail/edit routes stay out of menu seed. |
