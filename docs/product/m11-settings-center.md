# M11 Settings Center

## Scope

M11 completes the real settings surface for the current tenant, including tenant profile, user CRUD, role catalog, and machine API key management.

Implemented contracts:

```text
GET    /api/v1/tenants
GET    /api/v1/tenants/:id
PATCH  /api/v1/tenants/:id
GET    /api/v1/users
POST   /api/v1/users
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/roles
GET    /api/v1/api-keys
POST   /api/v1/api-keys
DELETE /api/v1/api-keys/:id
```

## Page Design

The `/settings` page now supports:

1. Tenant profile summary and edit drawer.
2. User management table with create, edit, delete, and role assignment.
3. Role catalog with permission counts.
4. Tenant machine API key list, one-time key reveal on creation, and delete action.
5. Security summary linking the module to audit behavior and access control.

## Architecture Notes

All APIs are tenant-scoped. Tenant profile edits require `tenant.write`, user mutations require `user.write`, role listing requires `role.read`, and machine key management requires `api_key.read` / `api_key.write`. Role editing is intentionally out of scope for M11; the page treats roles as a read-only system catalog and uses them during user assignment only.
