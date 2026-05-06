# Monitor / Runtime IA Brief

## Goal

Split the current monitor center from a single dense operations surface into route-level pages with clear ownership:

- `/monitor`: overview, event list, service health, and quick entrances.
- `/monitor/events/[eventId]`: event detail with request, response, error, and payload inspection.
- `/monitor/traces/[traceId]`: trace timeline and propagation quality.
- `/monitor/observability`: observability quality, trace coverage, slow traces, error traces, and module signals.
- `/runtime/workflows`: runtime workflow backend status and recoverable task retry.

## Existing Contracts

- Framework: Next.js app router under `apps/web/src/app/(console)`.
- UI: React client components, Tailwind utility classes, `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`, lucide icons, and TanStack Query.
- Data APIs: `getMonitorOverview`, `listMonitorEvents`, `getMonitorEvent`, `getMonitorTrace`, `getMonitorObservabilityOverview` from `@/lib/api-client`.
- Runtime workflow API: existing authenticated fetch calls to `/runtime/workflows/status` and `/runtime/workflows/retry`.
- Auth: `useAuth()` supplies `session.accessToken` for workflow endpoints.

## Users And Permissions

Operations, platform admins, and support engineers with `monitor:log:view` need fast triage. The menu seed should expose `/monitor` only; dynamic detail routes stay route-level and out of menu seed. `/runtime/workflows` may remain route-only.

## Required States And Actions

- Loading, empty, and error states for overview, lists, details, traces, observability, and workflow status.
- Event rows navigate to event detail pages.
- Trace IDs navigate to trace timeline pages.
- Legacy `/monitor?trace_id=xxx` links remain useful by showing a route-level handoff to `/monitor/traces/xxx`.
- Workflow page can refresh status and retry recoverable tasks.

## Constraints

- Keep edits inside monitor/runtime route and component ownership plus the two contract tests and this reference-design folder.
- Do not modify `api-client.ts` unless required; current monitor API functions are available.
- Keep the monitor list page free of selected-event state and detail API calls.
