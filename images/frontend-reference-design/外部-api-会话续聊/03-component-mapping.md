# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/api-reference/page.tsx` | `/api-reference` | Extend current documentation page. |
| Endpoint matrix | `Card`, `StatusBadge`, `Button` | four external endpoints | Add continue conversation endpoints. |
| Flow section | existing quick steps | `conversation_id` response field | Explain storing and reusing conversation id. |
| Request/response schema | `SchemaCard` | `ExternalAgentChatDto`, `ExternalAgentChatResponse` | `title` only affects create calls. |
| Continue examples | `CodeCard` | `POST .../conversations/{conversationId}/messages` | Add curl/fetch examples. |
| Stream continue examples | `CodeCard` | `POST .../messages/stream` | Reuse SSE reader pattern. |
| Security notes | security chain card | `ExternalApiKeyService.authenticateConversation` | Mention conversation belongs to Agent, data scope, ACL. |
