# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console page shell and background | `apps/web/src/components/menus/menu-center-background.tsx`, route pages under `apps/web/src/app/(console)/menus` | Next app console layout | Reuse existing animated background and constrained content width. |
| Metrics and list toolbar | `apps/web/src/components/menus/menu-content.tsx` | `getMenuOverview`, `listMenus` query params | Keep `/menus` focused on search/list entry. |
| Tree table | `apps/web/src/components/menus/menu-content.tsx` | `MenuListItem`, `MenuTreeItem` | Render hierarchical rows with expand/collapse, search/filter, refresh, and row actions. |
| Detail route | `apps/web/src/components/menus/menu-detail-content.tsx` | `getMenu`, `MenuDetail` | Owns read-only grouped details, children, role dependency display, and navigation actions. |
| Create route | `apps/web/src/components/menus/menu-create-content.tsx` | `createMenu`, `CreateMenuInput`, `MenuFormPanel` | Reads `parentId` search param, preloads parent options through menu tree/list data. |
| Edit route | `apps/web/src/components/menus/menu-edit-content.tsx` | `getMenu`, `updateMenu`, `UpdateMenuInput`, `MenuFormPanel` | Reuses form panel in page layout; code remains read-only through existing form behavior. |
| Delete confirmation | `menu-content.tsx` and `menu-detail-content.tsx` local confirm dialog | `deleteMenu` error response | Preserve dependency-check copy; backend remains source of truth. |
| Permission disabled states | all menu content components | `useAuth`, `hasPermission`, `system:menu:manage` | Disable write buttons when user lacks manage permission. |
| Feedback states | `EmptyState`, inline error blocks, loading text | TanStack Query and mutation states | Cover loading, empty, error, validation, disabled. |
