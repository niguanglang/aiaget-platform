# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Login form | `apps/web/src/app/login/page.tsx` | `POST /api/v1/auth/login` | Replace M01 demo session with real API login and validation. |
| Auth provider | `apps/web/src/components/auth/auth-provider.tsx` | `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout` | Store access/refresh token and current user/tenant. |
| API client | `apps/web/src/lib/api-client.ts` | Unified Control API calls | Keep request ID + bearer injection; add JSON helpers and auth/user APIs. |
| Protected shell | `apps/web/src/components/auth/console-auth-guard.tsx` | Auth provider state | Redirect unauthenticated users; keep loading state. |
| Top bar user/tenant | `apps/web/src/components/layout/topbar.tsx` | `CurrentUser` from `/auth/me` | Show real tenant and user context. |
| Settings page | `apps/web/src/app/(console)/settings/page.tsx` | users/tenants APIs | Replace generic module placeholder with user management. |
| User table | new `settings-content.tsx` | `GET /users` response | Columns: name, email, status, roles, last login, updated at, actions. |
| Create/edit form | new Settings component | `POST /users`, `PATCH /users/:id` | Inline panel for M02, can become FormDrawer later. |
| Delete confirmation | new Settings component | `DELETE /users/:id` | Soft delete; disable current user self-delete. |
| Tenant summary | Settings page | `GET /tenants`, `/auth/me` | Default tenant admin context. |
| Backend Prisma | `apps/control-api/prisma/schema.prisma` | M02 tables | tenant/user/role/permission/user_role/api_key/login_log/operation_log/refresh_token. |
| Backend auth | `apps/control-api/src/auth/*` | JWT + password hash | Login, me, refresh, logout, guards. |
| Backend users | `apps/control-api/src/users/*` | User CRUD DTOs | Pagination, keyword, status, tenant isolation, soft delete. |
| Backend logs | operation interceptor | operation_log | All write routes record operation logs. |
