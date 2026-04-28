# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the Enterprise Agent Platform M02 authentication and settings foundation.

Project context:
- Product/module: Enterprise Agent Platform Control Console
- Page/route: Login at `/login` and Settings user management at `/settings`
- Target users/roles: default tenant administrator and future tenant operators
- Business goal: authenticate with real JWT, show current tenant/user context, manage tenant users, and expose RBAC/audit foundations for later modules
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-compatible primitives, lucide-react icons, TanStack Query
- Existing page shell/layout: left sidebar, top bar, mobile nav, protected console route group, Button, MetricCard, StatusBadge

Interface contract that must appear in the UI:
- API/service functions:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/refresh`
  - `GET /api/v1/tenants`
  - `GET /api/v1/users?page&page_size&keyword&status`
  - `POST /api/v1/users`
  - `PATCH /api/v1/users/:id`
  - `DELETE /api/v1/users/:id`
- Main entities and fields:
  - Tenant: code, name, status
  - User: email, name, status, roles, last_login_at, created_at, updated_at
  - Role: code, name, description
  - LoginLog and OperationLog summaries for audit preview
- Status values/enums: active, disabled, deleted; login success/failed; operation success/error
- User actions: login, logout, refresh session, search users, filter by status, create user, edit user, soft delete user, open user detail panel
- Required states: loading, empty, error, validation, disabled, success, permission-denied

Design requirements:
- Make the login page look like a serious enterprise admin login, not a landing page.
- Show default admin credential hints as development-only helper text.
- Settings page should be dense and operational: metric cards, tenant summary, search/filter toolbar, users table, create/edit form drawer or side panel, delete confirmation, detail panel, audit preview.
- Table columns must include name, email, status, roles, last login, updated at, actions.
- Detail panel must show basic info, tenant, roles, permissions preview, login activity, operation audit summary.
- Keep visual style white, compact, neutral borders, blue primary, clear status colors, no decorative gradients or marketing hero.

Avoid:
- fake unrelated modules
- pretending advanced ABAC or enterprise SSO is already complete
- storing or displaying passwords or secrets in the UI
