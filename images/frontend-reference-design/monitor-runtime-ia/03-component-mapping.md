# Component Mapping

## Shared Shell

- Page background: `MonitorCenterBackground`.
- Cards: `Card`.
- Commands: `Button` with lucide icons.
- Empty states: `EmptyState`.
- Metrics: `MetricCard` and compact bordered stat blocks.
- Status: `StatusBadge` plus helpers from `monitor-status.ts`.

## Route Mapping

- `/monitor` -> `MonitorContent`.
  - APIs: `getMonitorOverview`, `listMonitorEvents`.
  - Keeps filters, overview metrics, service health, step summary, rankings, event table, and quick entrances.
  - Does not own `selectedEvent`, `getMonitorEvent`, `getMonitorTrace`, or `getMonitorObservabilityOverview` detail state.

- `/monitor/events/[eventId]` -> `MonitorEventDetailContent`.
  - API: `getMonitorEvent(eventId)`.
  - Reuses `EventDetailPanel`, `JsonCard`, `DetailRow`, and status helpers.
  - Links back to `/monitor` and to `/monitor/traces/{trace_id}`.

- `/monitor/traces/[traceId]` -> `MonitorTraceContent`.
  - API: `getMonitorTrace(traceId, { window })`.
  - Reuses `TraceDetailPanel` and propagation/timeline helpers.
  - Supports copy action and back links.

- `/monitor/observability` -> `MonitorObservabilityContent`.
  - API: `getMonitorObservabilityOverview({ window })`.
  - Reuses `ObservabilityOverviewCard`, `TraceSignalCards`, and trace summary lists with route navigation.

- `/runtime/workflows` -> `RuntimeWorkflowsContent`.
  - APIs: existing workflow fetches to `/runtime/workflows/status` and `/runtime/workflows/retry`.
  - Reuses `WorkflowBackendCard` and workflow label helpers.

## Implementation Note

The current monolithic `monitor-content.tsx` already contains the visual building blocks. Split by exporting focused components and moving API ownership to route-level content components rather than introducing a new UI system.
