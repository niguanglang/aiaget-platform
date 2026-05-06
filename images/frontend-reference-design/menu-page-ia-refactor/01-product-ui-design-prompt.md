# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a production enterprise Agent platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台，系统管理 / 菜单中心
- Page/route: 菜单中心 at `/menus`
- Target users/roles: 租户管理员、平台管理员、具备菜单查看或管理权限的系统管理员
- Business goal: 管理控制台目录、页面菜单、按钮权限点；页面仅负责菜单定义，角色菜单授权应提示在角色权限中心完成
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-like components, lucide icons, restrained motion

Interface contract that must appear in the UI:
- API/service functions: `getMenuOverview`, `getMenuTree`, `listMenus`, `getMenu`, `createMenu`, `updateMenu`, `deleteMenu`, `enableMenu`, `disableMenu`
- Main entities and fields: menu name, code, type, parent, path, component, icon, permission code, sort order, visible, enabled, child count, role reference count, updated time
- Status values/enums: `DIRECTORY`, `MENU`, `BUTTON`, visible/hidden, enabled/disabled
- User actions: add root menu, add child menu, search, filter by type/status/visibility, select tree node, edit in right drawer, enable/disable, delete with dependency warning, refresh
- Required states: loading tree/list/detail, empty tree, validation error, backend delete dependency error, disabled actions when lacking `system:menu:manage`

Design requirements:
- Use a calm enterprise SaaS dashboard layout with a left tree panel, right list/detail area, and a focused drawer form.
- Keep the list compact: columns should be core identifiers and status only, not a full detail dump.
- Detail panel should show route, permission, display state, child summary, and a read-only role reference count.
- Show a clear notice: "角色菜单授权已移动到角色权限中心".
- Use subtle borders, soft shadows, light glass surfaces, restrained blue/neutral accents, and clear hierarchy.
- All visible text must be Chinese.

Avoid:
- Do not include role authorization checkboxes on this page.
- Do not add fake menu fields unsupported by the current type contract.
- Do not use overdone glow, oversized decorative gradients, emoji, or crowded dashboard cards.
