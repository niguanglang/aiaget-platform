# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/monitor/page.tsx` | Console layout | Replace placeholder shell with real M09 page. |
| Background atmosphere | `monitor-center-background.tsx` | visual only | Subtle signal/grid background behind metrics and table. |
| Summary metrics | `MetricCard` | monitor overview | Total events, success rate, average latency, P95, cost, active conversations. |
| Health cards | reuse `ServiceHealthCard` or monitor-specific card | monitor overview health | Control service + runtime service. |
| Filter toolbar | new `monitor-content.tsx` | list query params | Module, status, time window, keyword/trace filter. |
| Event table | new `monitor-content.tsx` | `MonitorEventListItem` | Trace/event ID, module, status, latency, tokens, cost, occurred at. |
| Selected-event detail panel | new `monitor-content.tsx` | `MonitorEventDetail` | Request/response summary, error, JSON payloads, steps. |
| Ranking panels | new `monitor-content.tsx` | overview rankings | Agents, models, tools, recalls, module errors. |
| Backend module | `apps/control-api/src/monitor/*` | M09 APIs | Aggregates existing log tables, no new log sources required. |
| Shared contracts | `packages/shared-types/src/index.ts` | overview/event types | Used by API client and monitor page. |
