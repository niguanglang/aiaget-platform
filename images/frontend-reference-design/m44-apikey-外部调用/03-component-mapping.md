| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/settings/page.tsx`, `SettingsContent` | Console layout | Reuse current settings route. |
| External endpoint strip | `SettingsContent` + `Card` + `Button` | `getExternalAgentChatEndpoint()` | Shows `/external/agents/{agentId}/chat` and copy action. |
| Create API Key form | `SettingsContent`, React Hook Form, Zod | `CreateTenantApiKeyInput` | Adds name, expiry, scopes, allowed Agent ids, IP allowlist, rate limit, daily quota, stream switch. |
| Agent whitelist | native `select multiple` inside existing form style | `listAgents({ status: 'PUBLISHED' })` + `AgentListItem` | Empty selection means all authorized Agents. |
| Issued keys list | Existing rounded list rows + `StatusBadge` | `TenantApiKeyListItem` | Displays masked key, status, scope, Agent restriction, IP, quota, limit, stream flag. |
| One-time plaintext success | Existing green success panel | `CreateTenantApiKeyResult.api_key` | Plaintext displayed once after creation. |
| Delete confirmation | Existing `ConfirmDialog` | `deleteTenantApiKey(id)` | Disabled when user lacks manage permission. |
| Feedback states | Existing loading text, empty text, error alert | React Query and mutation errors | Keep Chinese text. |
