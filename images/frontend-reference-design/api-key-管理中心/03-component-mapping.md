# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/api-keys/page.tsx` -> new `ApiKeyContent` | Console layout route | Add independent `/api-keys` page under existing protected console layout. |
| Header and status badges | `motion.section`, `StatusBadge`, `Button` | `currentUser.user.permissions`, `tenant_admin` role | Chinese copy; show view-only/manage state. |
| Metrics | `MetricCard` | `TenantApiKeyListItem[]` | Compute locally from list: total, active, stream-enabled, quota risk, recently used. |
| Endpoint guidance | `Card`, `Button`, lucide `Copy` | `getExternalAgentChatEndpoint()` | Copy generic endpoint with `{agentId}`. |
| Create form | `Card`, `Input`, native select/textarea/checkbox, React Hook Form, Zod | `CreateTenantApiKeyInput`, `listAgents()` | Keep supported fields only. Disable fields without `system:api_key:manage`. |
| One-time key success panel | `Card`-style alert, `Button` | `CreateTenantApiKeyResult.api_key` | Plaintext key is shown once; copy button available. |
| API key list | `Card`, table/card rows, `StatusBadge`, `Button` | `TenantApiKeyListItem` | Show masked key, scopes, allowed Agents, quota, IP, stream, expiry, last used. |
| Filters | local state inputs/selects | list response fields | Client-side filter by keyword/status/risk. |
| Delete confirmation | local modal component | `deleteTenantApiKey(id)` | No invented revoke/update endpoint. |
| Feedback states | `EmptyState`, alerts, loading placeholders | React Query and mutations | Loading, empty, error, validation, disabled, success. |
| Navigation/menu | `moduleSpecs`, `navigation.ts`, `menu-navigation.ts`, `seed.ts` | permission `system:api_key:view` | Add `/api-keys` fallback nav and seeded system-management menu item. |

## Implementation Plan

1. Add module spec for `api_keys` with Chinese product copy and `system:api_key:view`.
2. Add fallback and dynamic navigation icon mapping for the new module.
3. Add seeded menu item under `system_management`.
4. Implement `apps/web/src/components/api-keys/api-key-content.tsx`.
5. Add route `apps/web/src/app/(console)/api-keys/page.tsx`.
6. Run web and control-api type checks.
