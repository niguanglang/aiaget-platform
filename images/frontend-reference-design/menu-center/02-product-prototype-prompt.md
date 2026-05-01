# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 菜单中心 at `/menus`
- Users/roles: 租户管理员、系统管理员；read permission `menu.read`, write permission `menu.write`
- Main task flow: 管理员打开菜单中心，查看菜单树和指标，筛选菜单，创建/编辑目录、页面、按钮节点，保存角色菜单授权，刷新后左侧导航按授权菜单显示。
- API/service contract:
  - `GET /menus/tree`, `GET /menus`, `POST /menus`, `PATCH /menus/:id`, `DELETE /menus/:id`, enable/disable
  - `GET /menus/role-bindings`, `PUT /menus/role-bindings/:roleId`
  - `GET /auth/me` includes authorized menu tree
- Data entities and fields:
  - menu: name, code, type, parent_id, path, component, icon, permission_code, sort_order, visible, enabled
  - role binding: role id/name/code, selected menu ids
- Actions and states:
  - filters, create root, create child, edit, enable/disable, delete, save role binding
  - loading, empty, error, disabled no-write state, validation state

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show page regions clearly:
  1. header with module badges and primary create button
  2. metric cards
  3. menu tree/table area
  4. detail/preview panel for selected menu
  5. role binding matrix
  6. create/edit modal
- Make component boundaries obvious so a frontend engineer can map them to existing cards, buttons, inputs, selects, tables, badges, and dialogs.
- Keep layout realistic for the current console shell and responsive dashboard grid.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or actions
