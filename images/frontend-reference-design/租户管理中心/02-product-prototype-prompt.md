# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 租户管理中心 at `/tenants`
- Users/roles: admins with `system:tenant:view`; edit requires `system:tenant:manage`
- Main task flow: view current tenant -> inspect status and timestamps -> edit name/status -> refresh and verify list
- API/service contract: `listTenants`, `getTenant`, `updateTenant`
- Data entities and fields: id, code, name, status, created_at, updated_at
- Actions and states: refresh, filter, edit, loading, empty, error, validation, disabled, success, permission-denied

Prototype requirements:
- Low- to mid-fidelity wireframe focused on page regions.
- Show:
  1. Header with M51 badge and permission state.
  2. Tenant metric cards.
  3. Current tenant profile card.
  4. Tenant scoped list/table.
  5. Governance notes panel.
  6. Edit drawer with name/status.
  7. Loading, empty, error and view-only states.

Avoid:
- unsupported cross-tenant admin affordances
- create/delete tenant controls
- invented fields
