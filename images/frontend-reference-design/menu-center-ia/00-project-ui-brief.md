# Project UI Brief

- Page/feature: 菜单中心 IA 重构与高级路由配置
- Routes: `/menus`, `/menus/create`, `/menus/[id]`, `/menus/[id]/edit`
- Parent layout: Next.js App Router console shell under `apps/web/src/app/(console)`.
- Target users and permissions: 租户管理员或拥有 `system:menu:manage` 的用户可新增、编辑、删除、启停；普通可访问用户以查看为主。角色菜单授权保留在 `/roles/[id]/menus`，菜单中心只维护菜单定义。
- API/services: `getMenuOverview`, `getMenuTree`, `listMenus`, `getMenu`, `createMenu`, `updateMenu`, `deleteMenu`, `enableMenu`, `disableMenu` from `@/lib/api-client`.
- Data entities: `MenuTreeItem`, `MenuListItem`, `MenuDetail`, `CreateMenuInput`, `UpdateMenuInput`; core fields include `id`, `parent_id`, `parent_name`, `name`, `code`, `type`, `path`, `component`, `icon`, `permission_code`, `is_external`, `external_url`, `redirect_path`, `keep_alive`, `affix`, `hide_breadcrumb`, `route_meta`, `sort_order`, `visible`, `enabled`, `level`, `child_count`, `role_count`, `children`, `role_bindings`, `created_at`, `updated_at`.
- Status/enums: `MenuType` values `DIRECTORY`, `MENU`, `BUTTON`; enabled/disabled; visible/hidden.
- Available UI system: Tailwind CSS with shadcn-style local primitives `Button`, `Card`, `EmptyState`, `MetricCard`, `StatusBadge`, lucide icons, TanStack Query, React Hook Form, existing `MenuFormPanel`.
- Required states/actions: loading, empty, error, disabled permission state, validation error, API error, delete confirmation with dependency rejection copy, refresh, search/filter, expand/collapse tree rows, view detail, create root, create child with `parentId`, edit, delete, enable/disable, multi-level parent selection, hierarchy path display, external link configuration, redirect path, keep-alive, affix, breadcrumb visibility, and route metadata JSON validation.
- Multi-level constraint: menu management supports deep multi-level menu trees through a configurable backend maximum. Button nodes cannot be parents, and edit forms must exclude the current node and its descendants from parent options to prevent cycles.
- Constraints: `/menus` must be a tree list/search entry only. It must not own detail cards, create/edit form state, `getMenu`, `createMenu`, `updateMenu`, `selectedMenu`, `editingMenu`, or `formMode`. Dedicated create/edit pages reuse `MenuFormPanel`; detail page owns `getMenu`.
