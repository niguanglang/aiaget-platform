# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / 角色权限中心
- Page/route: 角色管理列表 at `/roles`
- Target users/roles: 租户管理员、系统管理员、安全管理员、审计员
- Business goal: 用户在列表页完成角色查询、状态识别、启停、删除和进入详情/配置入口；接口权限矩阵和菜单授权矩阵必须进入独立配置页。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-style Button/Card/EmptyState/MetricCard/StatusBadge, React Query, motion/react.
- Existing page shell/layout: console shell with left navigation and top bar, content max width 7xl, clean dashboard/list layout, subtle border and soft shadow.

Interface contract that must appear in the UI:
- API/service functions: `getRoleOverview`, `listRoles`, `enableRole`, `disableRole`, `deleteRole`; route links to `/roles/create`, `/roles/[id]`, `/roles/[id]/edit`, `/roles/[id]/permissions`, `/roles/[id]/menus`.
- Main entities and fields: `name`, `code`, `description`, `status`, `is_system`, `permission_count`, `menu_count`, `user_count`, `updated_at`.
- Status values/enums: `ACTIVE`, `DISABLED`, `DELETED`.
- User actions: 新建角色、搜索、按状态筛选、清空筛选、查看详情、编辑、权限配置、菜单授权、启用/停用、删除确认。
- Required states: loading, empty, error, disabled, permission-denied, mutation pending, delete confirmation, system role locked.

Design requirements:
- Make it look like a production SaaS/admin product.
- Use only fields/actions listed above.
- Show the primary workflow clearly: filter list -> scan counts/status -> open detail or dedicated config pages -> lifecycle actions.
- Use bento metrics above the table: 角色总数、启用角色、用户绑定、权限绑定.
- Keep list rows compact and scannable; do not render permission catalog, menu tree, user reference cards, or role detail panel.
- Style direction: 极简、科技、高级、产品感强；细边框、轻阴影、轻微玻璃质感、克制动效感。

Avoid:
- embedded role detail panel in `/roles`
- permission matrix, menu tree matrix, or role form drawer inside list page
- invented API fields not listed above
- unreadable tiny text or overpacked table rows
