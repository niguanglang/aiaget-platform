# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| API Key list page shell | `apps/web/src/components/api-keys/api-key-content.tsx` | `listTenantApiKeys`, `deleteTenantApiKey`, `TenantApiKeyListItem` | Keep browse/delete and route links only. |
| Create page shell | `apps/web/src/components/api-keys/api-key-create-content.tsx` | `createTenantApiKey`, `listAgents`, `getExternalAgentChatEndpoint` | Owns `createdSecret` and form state; no auto redirect after creation. |
| Observability page shell | `apps/web/src/components/api-keys/api-key-observability-content.tsx` | `getExternalApiObservability`, `ExternalApiObservabilityWindow` | Owns time window, recent calls, quota watch, security denials. |
| Webhook delivery list page | `apps/web/src/components/api-keys/webhook-deliveries-content.tsx` | `listWebhookDeliveries`, `listTenantApiKeys`, `retryWebhookDelivery` | Owns API Key filter and route links to detail. |
| Webhook delivery detail page | `apps/web/src/components/api-keys/webhook-delivery-detail-content.tsx` | `getWebhookDelivery`, `retryWebhookDelivery`, `WebhookDeliveryDetail` | Owns detail fetch, payload/response display and retry. |
| Shared UI helpers | `apps/web/src/components/api-keys/api-key-shared.tsx` | shared-types DTOs and existing UI components | Reuse formatting, badges, field/detail row, confirm dialog and governance card. |
| Routes | `apps/web/src/app/(console)/api-keys/**/page.tsx` | Next App Router | Route files import dedicated content components. |
| Menu seed contract | `apps/control-api/src/menus/api-key-menu-ia-contract.test.ts` | `apps/control-api/prisma/seed.ts` | Dynamic menu seed keeps only `/api-keys`; create/observability/detail routes stay route-level only. |
