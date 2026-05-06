# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 角色管理列表 at `/roles`
- Users/roles: 租户管理员、系统管理员、安全管理员、审计员
- Main task flow: open role list -> search/filter -> review status and binding counts -> open detail/edit/permission/menu pages -> lifecycle actions.
- API/service contract: `getRoleOverview`, `listRoles`, `enableRole`, `disableRole`, `deleteRole`; route links `/roles/create`, `/roles/[id]`, `/roles/[id]/edit`, `/roles/[id]/permissions`, `/roles/[id]/menus`.
- Data entities and fields: role identity, status, system/custom marker, user count, permission count, menu count, updated time.
- Actions and states: 新建、筛选、清空、查看、编辑、权限配置、菜单授权、启停、删除确认、loading、empty、error、disabled.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on page boundaries and route-level IA.
- Clearly label regions: 页面标题区、指标卡、筛选工具条、角色表格、行内操作、删除确认、空状态/错误状态.
- Show detail/edit/permission/menu authorization as route navigation, not embedded panels.
- Keep layout realistic for current console shell and responsive behavior.

Avoid:
- permission matrix or menu tree in the list page
- role detail side panel in the list page
- invented navigation or unrelated backend fields
