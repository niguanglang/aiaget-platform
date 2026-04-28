# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/models/page.tsx` | Console layout | Replace placeholder `ModulePageShell` with real M04 content. |
| Metrics strip | `MetricCard` | model provider list aggregate | Providers, enabled models, today's calls, today's cost. |
| Status chips | `StatusBadge` | provider/model status | Map ACTIVE/DISABLED/DELETED to existing tones. |
| Toolbar/search/filter | new `models-content.tsx` | `GET /model-providers` query params | Keyword, provider type, status, capability. |
| Provider table | new `models-content.tsx` | `ModelProviderListItem` | Name, type, base URL, status, default, models, updated, actions. |
| Model table | new `models-content.tsx` | nested `ModelConfigItem` | Name/model, capabilities, context, price, rate limit, status. |
| Provider form drawer | new `provider-form-panel.tsx` | `CreateModelProviderInput`, `UpdateModelProviderInput` | React Hook Form + Zod. |
| Model form drawer | new `model-form-panel.tsx` | `CreateModelConfigInput`, `UpdateModelConfigInput` | Capabilities checkboxes, price/rate fields. |
| API key panel | new `provider-detail-panel.tsx` | `POST/DELETE /model-providers/:id/api-keys` | Only masked key is displayed. |
| Test panel | new `provider-detail-panel.tsx` | `POST /model-providers/:id/test` | First version returns structured mock result and writes call log. |
| Call logs | new `provider-detail-panel.tsx` | Provider detail logs | Show status, trace id, tokens, cost, latency, errors. |
| Ambient depth | new `model-center-background.tsx` | frontend-only | Optional Three.js canvas if dependencies are present; background must stay non-interactive and subdued. |
| Backend Prisma | `apps/control-api/prisma/schema.prisma` | M04 tables | Provider, config, key, cost rule, call log. |
| Backend module | `apps/control-api/src/models/*` | M04 APIs | Tenant-scoped, RBAC guarded, encrypted/hash key storage, masked return. |
