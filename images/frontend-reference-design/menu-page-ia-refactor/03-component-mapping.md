# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell/header/background | `apps/web/src/components/menus/menu-content.tsx`, `MenuCenterBackground` | `/menus` route | Reuse current console shell and Chinese copy. |
| Metrics | `MetricCard` in `menu-content.tsx` | `getMenuOverview`, `MenuOverview` | Keep directory/menu/button/hidden-disabled counts. |
| Tree panel | `MenuContent` local tree rendering | `getMenuTree`, `MenuTreeItem` | Keep select/add-root/add-child behavior. |
| Filter/list table | `MenuTable` local component | `listMenus`, `MenuListItem` | Remove role authorization action and keep role count read-only. |
| Detail panel | `MenuDetailCard` local component | `getMenu`, `MenuDetail` | Show child nodes and read-only role references; no assignment controls. |
| Drawer form | `MenuFormPanel` | `CreateMenuInput`, `UpdateMenuInput` | Regroup fields only; no DB schema expansion. |
| Role menu authorization | `apps/web/src/components/roles/role-permission-content.tsx` | `listMenuRoleBindings`, `updateMenuRoleBinding`, `getMenuTree` | Move editable menu assignment here. |
| Feedback states | `EmptyState`, inline error banners, disabled `Button` | React Query and permission checks | Preserve loading/error/empty/disabled states. |
