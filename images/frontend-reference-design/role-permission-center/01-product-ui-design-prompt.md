# Product UI Design Image Prompt
Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 Agent 平台，系统管理下的角色权限中心。
- Page/route: 角色权限中心 at `/roles`.
- Target users/roles: 租户管理员、安全管理员、审计员；写操作需要 `system:role:manage`，只读需要 `system:role:view`.
- Business goal: 让管理员在一个页面完成角色查看、角色创建编辑、权限分组授权、菜单授权摘要和用户引用检查。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui-style components, Card/Button/MetricCard/StatusBadge/EmptyState, Motion micro-interactions.
- Existing page shell/layout: console shell with sidebar/topbar; page content uses max-width dashboard layout.

Interface contract that must appear in the UI:
- API/service functions: `getRoleOverview`, `listRoles`, `getRole`, `createRole`, `updateRole`, `deleteRole`, `enableRole`, `disableRole`, `getPermissionCatalog`, `updateRolePermissions`, `getMenuTree`, `listMenuRoleBindings`, `updateMenuRoleBinding`.
- Main entities and fields: role id, code, name, description, status, is_system, permission_count, menu_count, user_count, created_at, updated_at; permission id, code, name, module, resource, action; menu tree summary; role users.
- Status values/enums: `ACTIVE`, `DISABLED`, `DELETED`.
- User actions: create role, edit role, enable/disable, delete custom role, select role, search role, filter status, assign permissions by module, view menu binding count, inspect users bound to role.
- Required states: loading, empty, error, validation, disabled, success, permission-denied.

Design requirements:
- Chinese UI labels only.
- Layout: top metric cards, left role list/table, center permission matrix grouped by module/resource, right role detail and users panel.
- Use Bento Grid / Dashboard Layout, subtle borders, soft shadow, backdrop blur and restrained motion states.
- Permission matrix should feel operational and scannable, with module groups and action chips/checkboxes.
- System roles must show guarded controls and clear disabled action states.
- Make it look like a production enterprise product, not a template.

Avoid:
- overdecorated gradients, emoji, cheap glow, unrelated charts, invented fields, excessive density.
Paste the high-fidelity product UI prompt here.
