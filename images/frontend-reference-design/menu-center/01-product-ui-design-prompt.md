# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: AIAget 企业 Agent 平台，系统管理模块。
- Page/route: 菜单中心 at `/menus`.
- Target users/roles: 租户管理员、系统管理员；读取权限 `menu.read`，写入权限 `menu.write`。
- Business goal: 管理控制台多级菜单、目录/页面/按钮节点、角色菜单授权，并驱动左侧导航的授权菜单树。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style primitives, existing `Button`, `Card`, `Input`, `MetricCard`, `StatusBadge`, `EmptyState`, lucide icons, React Query.
- Existing page shell/layout: console layout with left sidebar, topbar, responsive mobile nav. Page content uses max-width dashboard layout, glass cards, subtle borders, soft shadows, restrained motion.

Interface contract that must appear in the UI:
- API/service functions:
  - `getMenuTree`, `listMenus`, `createMenu`, `getMenu`, `updateMenu`, `deleteMenu`, `enableMenu`, `disableMenu`
  - `listMenuRoleBindings`, `updateMenuRoleBinding`
  - `getMe` returns authorized `menus`
- Main entities and fields:
  - menu: `name`, `code`, `type`, `parent_id`, `path`, `component`, `icon`, `permission_code`, `sort_order`, `visible`, `enabled`, `created_at`, `updated_at`
  - role menu binding: `role_id`, `role_name`, `checked_menu_ids`
- Status values/enums:
  - menu type: `DIRECTORY`, `MENU`, `BUTTON`
  - enabled/visible boolean states
- User actions:
  - create root menu, create child menu, edit, enable, disable, delete, filter by type/status, role binding save, refresh navigation
- Required states:
  - loading menu tree, empty menu tree, API error banner, disabled write controls without `menu.write`, form validation error, save success state, role binding pending state

Design requirements:
- Make it look like a production SaaS/admin product, not a generic landing page.
- Use a Bento/Dashboard layout: top metric cards, left tree/list panel, right detail/editor panel, lower role binding matrix.
- Show a clear multi-level menu tree with indentation and type badges.
- Include a compact create/edit modal for menu fields and a role authorization panel with checkboxes.
- Keep text Chinese and use realistic labels from the contract.
- Visual style: minimal, enterprise, technical, clean hierarchy, subtle border, soft shadow, light glass feel, restrained teal/slate/blue accents.

Avoid:
- fake unrelated modules
- four-level menu examples
- decorative oversized hero areas
- excessive gradients, emoji, cheap glow, large rounded blobs, information overload
