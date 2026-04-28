# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe image for M02 authentication and Settings user management.

Project context:
- Page/routes: `/login`, `/settings`
- Users/roles: default tenant administrator
- Main task flow: admin logs in, token is stored, `/auth/me` loads tenant/user context, admin opens Settings, searches users, creates a user, edits status/name/roles, soft deletes a user, and sees audit/log placeholders.
- API/service contract:
  - `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/refresh`
  - `GET /tenants`
  - `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`
- Data entities and fields:
  - Tenant: code, name, status
  - User: id, email, name, status, roles, last_login_at, created_at, updated_at
  - Role: code, name
  - Logs: login status, operation action, request ID
- Actions and states:
  - Login validation/error/loading
  - Users list loading/empty/error
  - Create/edit validation
  - Delete confirmation and self-delete disabled state
  - Permission denied placeholder

Prototype requirements:
- Show login form regions: tenant code/email/password, submit, backend error, default admin hint.
- Show settings page regions: page header, tenant summary, user metrics, search/filter toolbar, users table, side detail panel, create/edit drawer, delete dialog, audit preview.
- Make component boundaries obvious: DataTable, MetricCard, StatusBadge, FormDrawer, ConfirmDialog, AuditTimeline placeholders.
- Keep every field tied to the API contract above.

Avoid:
- polished decorative rendering
- fake SSO, SCIM, LDAP, or advanced ABAC screens
- invented user fields not listed in the contract
