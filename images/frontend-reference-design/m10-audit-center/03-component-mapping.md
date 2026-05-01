# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/audit/page.tsx` | Console layout | Replace placeholder shell with real M10 page. |
| Background atmosphere | `audit-center-background.tsx` | visual only | Subtle grid/signal background, low opacity. |
| Summary metrics | `MetricCard` | audit overview | Login logs, operations, security events, config changes, success rate. |
| Filter toolbar | new `audit-content.tsx` | list query params | Source type, status, time window, keyword. |
| Unified audit table | new `audit-content.tsx` | `AuditEventListItem` | Time, user, source, module, action, result, request ID. |
| Selected-event detail panel | new `audit-content.tsx` | `AuditEventDetail` | IP, user-agent, path, method, status code, request summary, error. |
| Rankings/failure panels | new `audit-content.tsx` | audit overview rankings | Top users, top modules, recent failures. |
| Backend module | `apps/control-api/src/audit/*` | M10 APIs | Aggregates existing login and operation logs, no new tables required. |
| Shared contracts | `packages/shared-types/src/index.ts` | audit overview/event types | Used by API client and audit page. |
