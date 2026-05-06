# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell | `apps/web/src/app/(console)/layout.tsx` | App Router shell | Reuse existing console layout |
| Role list page | `apps/web/src/components/roles/role-permission-content.tsx` | `getRoleOverview`, `listRoles`, `RoleListItem` | Keep overview/filter/table/lifecycle only |
| Role create page | `apps/web/src/components/roles/role-create-content.tsx` | `createRole`, `CreateRoleInput` | New route `/roles/create` |
| Role detail page | `apps/web/src/components/roles/role-detail-content.tsx` | `getRole`, `RoleDetail` | New route `/roles/[id]` owns references |
| Role edit page | `apps/web/src/components/roles/role-edit-content.tsx` | `getRole`, `updateRole` | New route `/roles/[id]/edit` |
| Permission config page | `apps/web/src/components/roles/role-permissions-content.tsx` | `getRole`, `listRolePermissionCatalog`, `updateRolePermissions` | New route `/roles/[id]/permissions` |
| Menu auth page | `apps/web/src/components/roles/role-menus-content.tsx` | `getRole`, `getMenuTree`, `listMenuRoleBindings`, `updateMenuRoleBinding` | New route `/roles/[id]/menus` |
| Role form | `apps/web/src/components/roles/role-form-panel.tsx` | `RoleFormValues` | Add `presentation="page"` while preserving drawer mode |
| List row actions | `role-permission-content.tsx` | status/delete APIs + route links | View, edit, permissions, menus, enable/disable, delete |
| Empty/error states | `EmptyState`, `Card`, `StatusBadge` | query/mutation states | Reuse current UI primitives |
