# Product Prototype / Wireframe Prompt
Create a product prototype / wireframe image for the `/roles` 角色权限中心 page.

Project context:
- Page/route: 角色权限中心 at `/roles`.
- Users/roles: 租户管理员 manages roles and permissions;审计员 reads role configuration.
- Main task flow: select a role -> inspect details -> edit role profile -> assign permissions grouped by module -> review menu authorization count -> inspect users bound to role.
- API/service contract: role overview/list/detail/CRUD/status/delete, permission catalog, role permission binding, menu tree and role menu binding endpoints.
- Data entities and fields: role code/name/description/status/is_system/user_count/permission_count/menu_count/timestamps; permission code/name/module/resource/action; users bound to role.
- Actions and states: create/edit/delete/enable/disable role, save permission binding, search/filter, loading/empty/error/disabled/validation.

Prototype requirements:
- Low- to mid-fidelity wireframe.
- Show page sections: header/metrics, role filter toolbar, role table/list, role detail drawer/panel, permission group matrix, menu authorization summary, user references.
- Show disabled actions for system roles and permission-denied states.
- Mark loading/empty/error placeholders.
- Keep component boundaries obvious for frontend implementation.

Avoid:
- fake modules, fake charts, unrelated settings, decorative-only UI.
Paste the low/mid-fidelity prototype prompt here.
