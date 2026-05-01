# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/settings/page.tsx` | Console layout | Upgrade existing real-but-partial page into M11 final settings page. |
| Tenant profile card | `settings-content.tsx` | tenant detail/update | Extend current tenant summary into editable profile card. |
| Metrics | `MetricCard` | users / roles / api keys aggregate | Reuse current metrics surface. |
| User management table | existing `settings-content.tsx` | users CRUD | Preserve working behavior and refine layout. |
| User form drawer | existing local form | user create/update DTO | Keep current pattern, add role sourcing from API. |
| Roles panel | new section in `settings-content.tsx` | roles list | Read-only role catalog with permission counts. |
| API key panel | new section in `settings-content.tsx` | api key list/create/delete | One-time key reveal after creation. |
| Tenant edit drawer | new local panel | tenant update DTO | Simple form for tenant name/status. |
| Delete confirmation | local modal pattern | user delete / api key delete | Reuse current confirmation pattern. |
| Backend modules | `tenants`, `users`, new `roles`, new `api-keys` | M11 APIs | Minimal extension on top of existing auth and tenant scope. |
| Shared contracts | `packages/shared-types/src/index.ts` | tenant detail, roles, api keys | Used by API client and settings page. |
