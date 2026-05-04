# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 用户管理中心 at `/users`
- Users/roles: tenant admins and system admins with `system:user:view`; write operations need `system:user:manage`
- Main task flow: view user metrics -> search/filter -> select user -> create/edit user -> assign department and roles -> soft delete obsolete user
- API/service contract: `listUsers`, `createUser`, `updateUser`, `deleteUser`, `listRoles`, `getDepartmentTree`
- Data entities and fields: name, email, status, department, roles, last_login_at, created_at, updated_at
- Actions and states: search, status filter, department filter, create, edit, delete, loading, empty, error, validation, disabled, success, permission-denied

Prototype requirements:
- Low- to mid-fidelity wireframe.
- Show page regions:
  1. Header with M51 badge and permission state.
  2. Metric tiles for total users, active users, disabled users, department coverage, role assignments.
  3. Filter toolbar.
  4. Main user table.
  5. Right user detail panel.
  6. Create/edit drawer.
  7. Delete confirmation modal.
- Component boundaries should map to existing `Card`, `MetricCard`, `Button`, `Input`, `StatusBadge`, `EmptyState`.

Avoid:
- unsupported fields
- unrealistic navigation
- polished decorative rendering over interaction clarity
