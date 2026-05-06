# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe for the same page.

Project context:
- Page/route: 菜单中心 at `/menus`
- Users/roles: 租户管理员、平台管理员、系统管理员
- Main task flow: search/select menu node -> inspect route/permission/detail -> create or edit node in drawer -> enable/disable or delete with dependency confirmation
- API/service contract: `getMenuOverview`, `getMenuTree`, `listMenus`, `getMenu`, `createMenu`, `updateMenu`, `deleteMenu`, `enableMenu`, `disableMenu`
- Data entities and fields: `MenuListItem`, `MenuDetail`, `MenuTreeItem`; name, code, type, parent, path, component, icon, permission code, sort order, visible, enabled, child count, role count, updated time
- Actions and states: add root, add child, edit, enable, disable, delete, clear filters, loading, empty, error, validation, permission-disabled

Prototype requirements:
- Show these regions clearly: header actions, metrics row, dependency notice, tree panel, filter toolbar, tree table/list, detail panel, right drawer form.
- Drawer field groups: 基础信息, 路由信息, 显示控制, 权限控制, 高级配置说明.
- Delete flow must show dependency checks: child menus, role bindings, plugin menu bindings.
- Mark role-menu authorization as moved to 角色权限中心; no role assignment matrix on this page.
- Use realistic component boundaries that map to existing React components.

Avoid decorative rendering. Focus on information architecture and action placement.
