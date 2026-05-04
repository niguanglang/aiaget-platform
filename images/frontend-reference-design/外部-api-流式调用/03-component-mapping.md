# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/api-reference/page.tsx` | existing `/api-reference` route | Keep current console layout and URL. |
| Endpoint comparison | `Card`, `StatusBadge`, `Button` | `/external/agents/{agentId}/chat`, `/chat/stream` | Add stream endpoint beside non-stream endpoint. |
| Metrics | `MetricCard` | static documentation facts | Update counts to include stream endpoint and event types. |
| Auth policy | `Card`, `AuthMethod` | API Key scopes and `allow_stream` | Replace old “reserved for future” message. |
| Request fields | `SchemaCard` | `ExternalAgentChatDto` | Same fields for both modes. |
| Stream events | new static data rendered by `SchemaCard`/cards | `ConversationStreamEvent` shared type | Document `start`, `delta`, `done`, `error`. |
| Code examples | `CodeCard` | curl/fetch SSE examples | Add streaming curl and fetch reader example. |
| Security checks | existing security check card | `ExternalApiKeyService.authenticate` | Include `external:agent:stream` and `allow_stream=true`. |
| Errors | existing error table | External API exceptions | Add stream-specific 403 cause. |
| Observability links | existing buttons | `/api-keys`, `/monitor`, `/audit` | Point users to M57 observability. |
