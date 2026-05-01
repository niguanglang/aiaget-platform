# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise Agent platform console page.

Project context:
- Product/module: AIAget 企业 Agent 平台
- Page/route: 部门/组织架构中心 at `/departments`
- Target users/roles: 租户管理员、系统管理员；`department.read` 可查看，`department.write` 可编辑；`tenant_admin` 全量访问
- Business goal: 管理租户内组织架构，维护部门树、负责人、成员归属、启停状态，为 ABAC 数据权限和资源授权提供组织属性
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-like local components, React Query, lucide icons, Motion micro-interactions
- Existing page shell/layout: 左侧动态导航 + 顶部栏；页面内容在 `max-w-7xl` 容器内，使用细边框、轻阴影、玻璃质感卡片

Interface contract that must appear in the UI:
- API/service functions:
  - `getDepartmentOverview`, `getDepartmentTree`, `listDepartments`, `createDepartment`, `getDepartment`, `updateDepartment`, `deleteDepartment`, `enableDepartment`, `disableDepartment`
  - `listUsers({ department_id })` and user create/update with `department_id`
- Main entities and fields:
  - Department: id, tenant_id, parent_id, parent_name, name, code, description, leader_user_id, leader, sort_order, status, level, child_count, member_count, created_at, updated_at
  - User: id, email, name, status, roles, department
- Status values/enums: `ACTIVE` 启用, `DISABLED` 停用, `DELETED` 已删除
- User actions: 新建部门、编辑部门、删除部门、启用/停用、创建子部门、选择部门查看成员、按关键词/状态/父级筛选、设置负责人
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make it look like a production SaaS/admin product, not a generic template.
- Use a Dashboard/Bento layout:
  - top header with M32 badge, permission/status badges, primary action
  - metrics row: 部门总数、启用部门、成员数、根部门数
  - left card: organization tree with indentation and status pills
  - right top card: department table with filters
  - right bottom card: selected department detail and member list
  - bottom card: lightweight ABAC readiness panel showing department_id usage
- Use Chinese labels and realistic enterprise copy.
- Use thin borders, soft shadows, subtle backdrop blur, sparse grid/noise texture, restrained blue/teal accent.
- Include subdued Motion-style hover feedback and staggered row reveal cues.
- Optional ambient Three.js particle/wireframe background must stay behind content and not distract.

Avoid:
- overdone gradients, cheap glow, oversized rounded cards, emoji, decorative-only charts, invented fields not listed above, unreadable tiny text, overcrowded tables.
