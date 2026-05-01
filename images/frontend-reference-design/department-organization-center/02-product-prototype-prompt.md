# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the AIAget 部门/组织架构中心 page.

Project context:
- Page/route: 部门/组织架构中心 at `/departments`
- Users/roles: 租户管理员、系统管理员；`department.read` 查看，`department.write` 编辑
- Main task flow: 管理员打开部门中心 -> 查看部门树和指标 -> 新建或编辑部门 -> 设置上级部门和负责人 -> 查看部门成员 -> 保存后动态菜单和用户归属可继续用于 ABAC
- API/service contract:
  - overview, tree, paginated list, create/update/delete/enable/disable department
  - users list supports department filter; user create/update supports department assignment
- Data entities and fields:
  - department: name, code, parent, description, leader, sort_order, status, level, child_count, member_count, timestamps
  - user: name, email, status, roles, department summary
- Actions and states:
  - Create child department, edit, enable/disable, delete with confirmation
  - Filter by keyword/status/parent
  - Loading/empty/error/validation/permission-denied states

Prototype requirements:
- Low- to mid-fidelity wireframe style.
- Show clear layout regions:
  - Header + action
  - Metrics row
  - Organization tree card
  - Department table card with filters
  - Selected department detail panel
  - Member list panel
  - Create/edit drawer with fields and validation messages
  - Delete confirmation modal
- Make component boundaries obvious and map each section to existing local components.
- Keep menu hierarchy practical and readable on desktop and mobile.

Avoid:
- polished decorative rendering, fake charts, unrelated settings, invented backend fields, deep navigation beyond three levels in the shell.
