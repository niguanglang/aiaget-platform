# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console page shell and background | `apps/web/src/components/menus/menu-center-background.tsx`, route pages under `apps/web/src/app/(console)/menus` | Next app console layout | Reuse existing animated background and constrained content width. |
| Metrics and list toolbar | `apps/web/src/components/menus/menu-content.tsx` | `getMenuOverview`, `listMenus` query params | Keep `/menus` focused on search/list entry. |
| Tree table | `apps/web/src/components/menus/menu-content.tsx` | `MenuListItem`, `MenuTreeItem` | Render multi-level hierarchical rows with expand/collapse, hierarchy path display, search/filter, refresh, and row actions. |
| Detail route | `apps/web/src/components/menus/menu-detail-content.tsx` | `getMenu`, `MenuDetail` | Owns read-only grouped details, children, role dependency display, and navigation actions. |
| Create route | `apps/web/src/components/menus/menu-create-content.tsx` | `createMenu`, `CreateMenuInput`, `MenuFormPanel` | Reads `parentId` search param, preloads multi-level parent options through menu tree/list data. |
| Edit route | `apps/web/src/components/menus/menu-edit-content.tsx` | `getMenu`, `updateMenu`, `UpdateMenuInput`, `MenuFormPanel` | Reuses form panel in page layout; code remains read-only, current node and descendants are excluded from parent options. |
| Advanced route config | `apps/web/src/components/menus/menu-form-panel.tsx`, `menu-form-converters.ts`, `menu-detail-content.tsx` | `is_external`, `external_url`, `redirect_path`, `keep_alive`, `affix`, `hide_breadcrumb`, `route_meta` | Form owns grouped advanced controls and JSON validation; detail page renders read-only advanced route state. |
| Dynamic navigation | `apps/web/src/components/layout/menu-navigation.ts`, `sidebar.tsx`, `mobile-nav.tsx` | `AuthorizedMenuItem` advanced route fields | External menu nodes resolve to `external_url` and open in a new tab; normal menu nodes keep existing `path` behavior. |
| Status and delete confirmation | `menu-content.tsx` and `menu-detail-content.tsx` local confirm dialog | `enableMenu`, `disableMenu`, `deleteMenu` error response | Enable/disable actions open a Chinese confirmation dialog before mutation because they affect navigation visibility and role authorization entry; delete preserves dependency-check copy and backend remains source of truth. |
| Permission disabled states | all menu content components | `useAuth`, `hasPermission`, `system:menu:manage` | Disable write buttons when user lacks manage permission. |
| Feedback states | `EmptyState`, inline error blocks, loading text | TanStack Query and mutation states | Cover loading, empty, error, validation, disabled. |
