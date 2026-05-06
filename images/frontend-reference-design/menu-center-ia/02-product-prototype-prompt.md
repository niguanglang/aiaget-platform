# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the AIAget menu center IA refactor.

Project context:
- Page/routes: `/menus`, `/menus/create`, `/menus/[id]`, `/menus/[id]/edit`
- Users/roles: tenant admin / `system:menu:manage` can write; other users see disabled write controls.
- Main task flow: list and search tree nodes -> open detail route -> create root or child node -> edit node -> enable/disable or delete with dependency warning.
- API/service contract: `getMenuOverview`, `getMenuTree`, `listMenus`, `getMenu`, `createMenu`, `updateMenu`, `deleteMenu`, `enableMenu`, `disableMenu`.
- Data entities and fields: `MenuTreeItem`, `MenuListItem`, `MenuDetail`; `name`, `code`, `type`, `parent_name`, `path`, `component`, `icon`, `permission_code`, `sort_order`, `visible`, `enabled`, `children`, `role_bindings`.
- Actions and states: search/filter, expand/collapse, refresh, view, child create, edit, delete confirm, toggle status, loading, empty, error, validation, disabled.

Prototype requirements:
- Show four route-level frames or clearly labeled panels for list, detail, create, and edit.
- List frame must be a full-width tree table with metric summary, toolbar, search filters, expand/collapse and refresh buttons, and row actions.
- Detail frame must contain grouped read-only sections and dependency/children lists.
- Create frame must show parent preset from `parentId` query and grouped form fields.
- Edit frame must reuse the same form structure with code read-only.
- Component boundaries should map to existing `Card`, `Button`, `EmptyState`, `StatusBadge`, table markup, and `MenuFormPanel`.

Avoid:
- embedding detail cards or form drawers inside the list route
- role menu authorization UI
- invented navigation outside the existing console shell
