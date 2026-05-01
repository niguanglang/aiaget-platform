# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/monitor/page.tsx` and `MonitorContent` | protected console route | Keep existing route and parent layout. |
| Health cards | `ServiceHealthCard` | `MonitorOverview.health` | Existing M09 section remains near the top. |
| Summary metric grid | `MetricCard` | `MonitorSummary` and `MonitorRunStepSummary` | Add step metrics without replacing existing operation metrics. |
| Run-step operations band | `MonitorContent` local helper component | `MonitorRunStepSummary`, `MonitorRunStepMetricItem[]` | New dashboard section for prompt/tool/knowledge/response distribution. |
| Latency and error cards | `TrendCard`, `ErrorCard` | `MonitorTrendPoint[]`, `MonitorErrorSampleItem[]` | Preserve current behavior. |
| Event filters | `MonitorContent` filter toolbar | `ListMonitorEventsDto`, `listMonitorEvents` | Add source type and step type filters. |
| Event table | `MonitorContent` table | `MonitorEventListItem` | Add source type and step type columns; keep Chinese labels. |
| Detail panel | `EventDetailPanel` | `MonitorEventDetail` | Step events reuse existing JSON payload cards. |
| Feedback states | `EmptyState`, inline error copy | react-query loading/error states | Keep loading, empty and error states visible. |
