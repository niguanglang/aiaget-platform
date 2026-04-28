# M02 Auth, Tenant, User

## Scope

M02 replaces the M01 demo session with real Control Plane authentication and tenant-scoped user management.

Implemented contracts:

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
GET  /api/v1/tenants
GET  /api/v1/users
POST /api/v1/users
PATCH /api/v1/users/:id
DELETE /api/v1/users/:id
```

## Default Seed

```text
tenant code: default
admin email: oss-admin-7f4c2a@local.invalid
admin password: AIAgetDev!9sK4pQ7m
```

## Tables

```text
tenant
user
role
permission
user_role
role_permission
api_key
login_log
operation_log
refresh_token
```

`role_permission` and `refresh_token` are supporting tables added to make RBAC and logout/refresh token rotation concrete.

## Settings Page Design

The Settings page now owns the M02 user management workflow:

1. Tenant summary.
2. User metrics.
3. Search and status filter.
4. User table with name, email, status, roles, last login, updated at, actions.
5. Create/edit panel.
6. Soft delete confirmation.
7. Detail panel with tenant/user/role/audit-relevant fields.

## Security Notes

Passwords and refresh tokens are stored only as hashes. API keys are modeled with prefix and hash fields; key creation UI is deferred.

