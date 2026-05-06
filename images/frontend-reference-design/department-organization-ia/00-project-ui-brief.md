# Project UI Brief

- Page/feature: 部门组织架构
- Route: `/departments`, `/departments/create`, `/departments/[id]`, `/departments/[id]/edit`
- Goal: 将部门列表页拆成路由级页面，列表页只负责查询、筛选、组织树、概览和行内操作，创建/详情/编辑各自独立。
- Target users/roles: 具备 `system:department:view` 或 `system:department:manage` 权限的控制台用户，tenant admin 可写。
- APIs/services: `getDepartmentOverview`, `getDepartmentTree`, `listDepartments`, `getDepartment`, `createDepartment`, `updateDepartment`, `deleteDepartment`, `enableDepartment`, `disableDepartment`, `listUsers`
- Entities/fields/statuses: Department overview counters; department tree/list/detail; `name`, `code`, `description`, `parent_id`, `leader_user_id`, `sort_order`, `status`, `members`, `leader`; status values `ACTIVE`, `DISABLED`, `DELETED`
- Existing components/design system: Tailwind + shadcn 风格，`Button`, `Card`, `EmptyState`, `MetricCard`, `StatusBadge`, `DepartmentFormPanel`, `DepartmentCenterBackground`
- Required states: loading, empty, error, validation, disabled, success, permission-denied, delete confirmation, optimistic refresh
- Constraints: 中文 UI；列表页不包含详情卡或创建/编辑表单状态；创建/编辑页必须是独立路由；菜单 seed 只保留 `/departments`
