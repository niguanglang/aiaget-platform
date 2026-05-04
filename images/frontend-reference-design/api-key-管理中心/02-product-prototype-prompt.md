# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: API Key 管理中心 at `/api-keys`
- Users/roles: tenants admins and integration operators with `system:api_key:view`; creation/deletion requires `system:api_key:manage`
- Main task flow: view API key overview -> copy external chat endpoint -> create a scoped key -> save one-time plaintext key -> monitor quota/risk -> delete obsolete key
- API/service contract: `listTenantApiKeys`, `createTenantApiKey`, `deleteTenantApiKey`, `listAgents`, `getExternalAgentChatEndpoint`
- Data entities and fields: name, masked key, status, scopes, allowed_agent_ids, ip_allowlist, rate_limit_per_minute, daily_quota, used_count_today, allow_stream, expires_at, last_used_at, created_at
- Actions and states: refresh, copy endpoint, copy plaintext key, create, delete, filter, loading, empty, error, validation, disabled, success, permission-denied

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on information architecture and interaction flow.
- Show clear regions:
  1. Header with M50 badge and permission state.
  2. Four to six metric tiles for total keys, active keys, quota usage, stream-enabled keys, expired/risky keys.
  3. Endpoint and request header guidance block.
  4. Create key form with name, expiry, Agent multi-select, rate limit, daily quota, scopes, IP allowlist, stream switch.
  5. One-time plaintext key success panel.
  6. API key list/table cards with delete action.
  7. Right-side integration example and governance notes.
- Component boundaries must map to existing `Card`, `MetricCard`, `Button`, `Input`, `StatusBadge`, `EmptyState`.
- Include loading skeletons, empty block, error alert, form validation messages and view-only disabled state.

Avoid:
- polished decorative rendering
- invented backend fields or unsupported edit/revoke actions
- unrealistic navigation or unrelated settings panels
