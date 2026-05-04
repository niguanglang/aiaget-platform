# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / 用户管理中心
- Page/route: 用户管理中心 at `/users`
- Target users/roles: 租户管理员、系统管理员、组织管理员；查看权限 `system:user:view`，管理权限 `system:user:manage`
- Business goal: 管理租户用户账号、启停状态、部门归属和角色绑定，为 RBAC、ABAC、Resource ACL 提供用户主体基础。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui style local components, React Query, React Hook Form, Zod, motion, lucide icons.
- Existing page shell/layout: Console shell with sidebar/topbar. Use dashboard layout with metrics, filters, user table, detail panel, create/edit drawer, confirmation modal.

Interface contract that must appear in the UI:
- API/service functions: `listUsers`, `createUser`, `updateUser`, `deleteUser`, `listRoles`, `getDepartmentTree`
- Main entities and fields: user name, email, status, department, roles, last login time, created time, updated time
- Status values/enums: `ACTIVE`, `DISABLED`, `DELETED`
- User actions: search, filter status, filter department, create user, edit user, assign roles, assign department, soft delete user, view details
- Required states: loading, empty, error, validation, disabled, success, permission-denied, self-delete disabled

Design requirements:
- Production SaaS/admin look, dense but readable.
- Use Bento/Dashboard layout: header, metrics, filter toolbar, table, right detail panel.
- Use subtle borders, soft shadow, restrained backdrop blur, clean Chinese labels.
- Show primary workflow clearly: create user -> assign department and roles -> review detail -> edit or delete.
- Include form validation and no-permission disabled state.

Avoid:
- invented backend fields
- unsupported batch actions
- decorative charts without data
- emojis, excessive gradients, cheap glow
