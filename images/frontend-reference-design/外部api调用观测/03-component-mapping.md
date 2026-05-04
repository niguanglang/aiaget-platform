# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| API Key page shell | `apps/web/src/components/api-keys/api-key-content.tsx` | existing `/api-keys` route | Add a new observability section, do not create a new page. |
| Backend endpoint | `apps/control-api/src/api-keys/api-keys.controller.ts` | `GET /api-keys/external-observability` | Read-only, protected by `system:api_key:view`. |
| Backend aggregation | `apps/control-api/src/api-keys/api-keys.service.ts` | `api_key`, `operation_log`, `conversation_run`, `conversation`, `agent` | No new tables. |
| Shared types | `packages/shared-types/src/index.ts` | new `ExternalApiObservabilityOverview` contract | Keep frontend/backend aligned. |
| Summary cards | `MetricCard` | `summary` fields | Reuse current metric style. |
| Recent calls | `Card`, simple table/list | `recent_calls` | Include trace/request copy and monitor/audit links. |
| Quota watch | `Card`, `StatusBadge` | `quota_watch` | Reuse quota risk logic and no full key display. |
| Security denials | `Card`, `StatusBadge` | `security_denials` | Shows reason/source/request/trace. |
| Feedback states | existing loading divs and `EmptyState` | query state | Loading, empty, error. |
