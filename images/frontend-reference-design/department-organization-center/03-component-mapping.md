# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page route | `apps/web/src/app/(console)/departments/page.tsx` | `department.read` | New console page, Chinese UI |
| Page shell | Existing `ConsoleShell`, `Sidebar`, `MobileNav`, `Topbar` | route group layout and M31 dynamic menus | Reuse layout without shell rewrite |
| Dynamic menu entry | `seed.ts` defaultMenus + `navigation.ts` fallback | `department.read` | Add 系统管理 / 部门管理 entry |
| Header and metrics | `MetricCard`, `StatusBadge`, `Button` | `DepartmentOverview` | Shows total, active, disabled, members |
| Organization tree | `Card`, `StatusBadge`, lucide icons | `DepartmentTreeItem[]` | Indented tree, max six levels backend guard |
| Filters/table | `Card`, native select, `Input`, `Button` | `listDepartments` DTO and `DepartmentListItem` | keyword/status/parent filters |
| Detail/member panel | `Card`, `StatusBadge`, user summary rows | `DepartmentDetail`, `UserListItem.department` | Shows leader, members, child nodes |
| Create/edit drawer | `DepartmentFormPanel`, `Button`, form controls | `CreateDepartmentInput`, `UpdateDepartmentInput` | Validates code/name/sort/status/parent |
| Delete confirmation | local `ConfirmDialog` pattern | `deleteDepartment` | Soft delete, backend rejects child/member conflicts |
| Feedback states | `EmptyState`, error banners, disabled controls | React Query states | Loading, empty, error, permission-denied |
| Ambient depth | `department-center-background.tsx` | frontend-only | Subtle Three.js lines/points behind content |
