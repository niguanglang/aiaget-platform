# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the data-scope route IA refactor.

Project context:
- Page/routes: `/data-scopes`, `/data-scopes/roles/[roleId]`, `/data-scopes/roles/[roleId]/edit`
- Users/roles: view-only security operators, manage-capable administrators, tenant-admin role with immutable all-scope defaults
- Main task flow: find a role on the list page, inspect role data-scope detail, optionally open edit, adjust one resource scope, preview impact, save or reset
- API/service contract: overview/list endpoints for list; `getRoleDataScopes` for detail; `replaceRoleDataScopes` and `previewDataScope` only for edit
- Data entities and fields: role identity/status/counts/system flag, resource type, scope type/status, department/user/resource counts, scope value details, preview counts and note
- Actions and states: filtering, route navigation, read-only detail, draft edit, preview, save/reset, loading/empty/error/permission-disabled/success

Prototype requirements:
- Low- to mid-fidelity wireframe with three route panels or frames.
- `/data-scopes`: header + metrics + filters + roles/scope overview list; rows include “详情” and “编辑” links.
- `/data-scopes/roles/[roleId]`: breadcrumb/back link, role summary, read-only resource matrix, scope value summary, read-only impact preview summary.
- `/data-scopes/roles/[roleId]/edit`: breadcrumb/back link, edit toolbar, matrix/resource selector, scope type controls, custom selectors, preview result panel, save/reset controls.
- Mark component boundaries and state placeholders clearly for loading, empty, error, permission denied, and tenant-admin read-only.
- Keep layout realistic for the current console shell and responsive admin pages.

Avoid:
- polished decorative rendering, new backend fields, dynamic menu seed routes, unrelated global navigation changes
