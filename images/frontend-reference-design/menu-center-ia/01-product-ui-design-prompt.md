# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the AIAget console menu center IA refactor.

Project context:
- Product/module: AIAget 控制台 / 菜单中心
- Page/routes: `/menus` tree list, `/menus/create`, `/menus/[id]`, `/menus/[id]/edit`
- Target users/roles: 租户管理员 and users with `system:menu:manage`; read-only users see disabled write actions.
- Business goal: maintain console directory, page, and button menu definitions while keeping role menu authorization in `/roles/[id]/menus`.
- Existing frontend stack/design system: Next.js App Router, React, Tailwind CSS, shadcn-style local `Button`, `Card`, `EmptyState`, `MetricCard`, `StatusBadge`, lucide icons, TanStack Query.
- Existing page shell/layout: console route content in constrained `max-w-7xl` layout with metric cards, quiet admin styling, compact tables, Chinese UI.

Interface contract that must appear in the UI:
- API/service functions: list page uses `getMenuOverview`, `getMenuTree`, `listMenus`, `deleteMenu`, `enableMenu`, `disableMenu`; detail page uses `getMenu`; create page uses `createMenu`; edit page uses `getMenu` and `updateMenu`.
- Main entities and fields: menu name, code, type, parent, path, component, icon, permission code, sort order, visible, enabled, level, child count, role count, children, role bindings, created/updated time.
- Status values/enums: DIRECTORY / MENU / BUTTON, enabled/disabled, visible/hidden.
- User actions: search, filter by type/status/visibility, expand/collapse all, refresh, view detail, create root menu, create child via parentId query, edit, delete, enable/disable.
- Required states: loading, empty, error, validation, disabled write actions, API delete dependency error, success-ready state.

Design requirements:
- Make it a production SaaS/admin interface, not a marketing page.
- Show `/menus` as a tree table with toolbar and row actions, not a split detail/form workspace.
- Use Chinese labels and compact operational density.
- Detail route should read as an information page with grouped sections: 基础信息, 路由信息, 显示控制, 权限控制, 依赖/子节点.
- Create/edit routes should use a focused form surface with grouped fields and validation messages.
- Preserve the blue/slate Tailwind admin feel already used in the project, but avoid decorative excess.

Avoid:
- role authorization matrices inside menu center
- fake fields beyond the listed menu contracts
- oversized hero sections, unrelated charts, or invented settings
- inline create/edit drawers on the list page
