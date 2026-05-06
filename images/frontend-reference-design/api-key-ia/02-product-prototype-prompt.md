# Product Prototype Prompt

Create a mid-fidelity product prototype / wireframe for the AIAGET API Key external invocation management IA.

Project context:
- Routes: `/api-keys`, `/api-keys/create`, `/api-keys/observability`, `/api-keys/webhook-deliveries`, `/api-keys/webhook-deliveries/[deliveryId]`.
- Users/roles: view-only operators and manage-capable tenant admins.
- Main task flow: list credentials -> create key without leaving the page after success -> inspect usage observability -> inspect Webhook deliveries -> open one delivery detail -> retry failed delivery.
- Service contract: `listTenantApiKeys`, `createTenantApiKey`, `deleteTenantApiKey`, `getExternalApiObservability`, `listWebhookDeliveries`, `getWebhookDelivery`, `retryWebhookDelivery`, `listAgents`, `getExternalAgentChatEndpoint`.

Prototype requirements:
- Show five route-level screens, not tabs inside one page.
- `/api-keys`: header actions, endpoint copy, metric cards, search/status/risk filters, API Key rows, delete confirmation, governance side panel.
- `/api-keys/create`: endpoint sample, create form sections, Webhook settings, readonly permission hint, validation area, one-time secret success panel.
- `/api-keys/observability`: time window selector, summary metrics, recent calls list, quota watch panel, security denials panel.
- `/api-keys/webhook-deliveries`: API Key filter, delivery metrics, delivery rows, retry button disabled unless failed.
- `/api-keys/webhook-deliveries/[deliveryId]`: delivery metadata, request headers, payload, response body, error panel, retry action.
- Include loading, empty, error, success and disabled state placeholders.

Avoid:
- new backend concepts, route menu entries for create/detail pages, or hiding one-time secret in a modal that can be lost by navigation.
