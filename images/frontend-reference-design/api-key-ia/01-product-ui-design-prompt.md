# Product UI Design Prompt

Create a high-fidelity product UI design image for a production SaaS/admin console.

Project context:
- Product/module: AIAGET API Key external invocation management.
- Page group/routes: `/api-keys`, `/api-keys/create`, `/api-keys/observability`, `/api-keys/webhook-deliveries`, `/api-keys/webhook-deliveries/[deliveryId]`.
- Target users/roles: tenant admins and operators with `system:api_key:view` or `system:api_key:manage`.
- Business goal: manage external service credentials for controlled Agent calls, observe usage and quota risk, inspect Webhook delivery records, and retry failed deliveries.
- Frontend stack/design system: Next.js App Router, React client components, Tailwind utility classes, existing Card/Button/Input/MetricCard/StatusBadge/EmptyState components, lucide icons.
- Layout: quiet operational console, dense but organized, Chinese UI, max-width content, route-level pages rather than a single dashboard.

Interface contract that must appear in the UI:
- API/service functions: `listTenantApiKeys`, `createTenantApiKey`, `deleteTenantApiKey`, `getExternalApiObservability`, `listWebhookDeliveries`, `getWebhookDelivery`, `retryWebhookDelivery`, `listAgents`, `getExternalAgentChatEndpoint`.
- Main entities and fields: API Key name, masked key, status, scopes, allowed Agent ids/names, IP allowlist, rate limit, daily quota, used count today, last used time, Webhook enabled/status/error; observability summary, recent calls, quota watch, security denials; Webhook delivery id, API Key name/prefix, event, target URL, status, response status, latency, retry count, request headers, payload, response body, error.
- Status values/enums: ACTIVE/DISABLED/DELETED, quota NORMAL/WARNING/CRITICAL/UNLIMITED, delivery SUCCESS/FAILED/PENDING/RETRYING, call SUCCESS/DEGRADED/FAILED.
- User actions: create API Key, copy external endpoint, copy created secret, delete API Key, filter/search list, open observability, open Webhook deliveries, filter delivery by API Key, open delivery detail, retry failed delivery, copy IDs, jump to API reference/audit/monitor links.
- Required states: loading skeletons, empty state, error banner, validation messages, disabled actions without manage permission, success notice, permission-denied/readonly hints.

Design requirements:
- Use Chinese labels throughout.
- Make `/api-keys` feel like a focused credential inventory with clear primary navigation buttons to create, observability and Webhook deliveries.
- Make `/api-keys/create` a form-first operational page with the one-time secret result visible in the same page after submission.
- Make `/api-keys/observability` metric-and-investigation focused.
- Make Webhook list/detail pages optimized for troubleshooting and retry.
- Use restrained SaaS admin styling, compact cards, readable tables/cards, consistent spacing and status badges.

Avoid:
- marketing hero sections, decorative gradients/orbs, fake fields, unrelated integrations, or a single-page omnibus layout.
