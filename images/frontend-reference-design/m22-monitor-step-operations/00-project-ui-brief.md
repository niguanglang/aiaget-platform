# Project UI Brief

- Project: AIAget Enterprise Agent Platform
- Page: M22 Monitor Step Operations
- Route: `/monitor`
- Feature goal: bring M21 conversation run-step observability into the monitor center with aggregated step metrics and operational filtering
- Parent layout: protected console shell under `apps/web/src/app/(console)/monitor/page.tsx`
- Target users: tenant operators and admins with `monitor.read`

## APIs and Services

- `GET /api/v1/monitor/overview`
  - frontend: `getMonitorOverview({ window })`
  - response: `MonitorOverview`
- `GET /api/v1/monitor/events`
  - frontend: `listMonitorEvents({ page, page_size, window, module, status, source_type, step_type, keyword })`
  - response: `PaginatedResult<MonitorEventListItem>`
- `GET /api/v1/monitor/events/:eventId`
  - frontend: `getMonitorEvent(eventId)`
  - response: `MonitorEventDetail`

## Entities and Fields

- `MonitorSummary`
  - `events_total`
  - `success_rate`
  - `average_latency_ms`
  - `p95_latency_ms`
  - `total_cost`
  - `active_conversations`
- `MonitorRunStepSummary`
  - `steps_total`
  - `failed_steps`
  - `average_latency_ms`
  - `total_tokens`
  - `total_cost`
  - `tool_steps`
  - `knowledge_steps`
  - `model_steps`
- `MonitorRunStepMetricItem`
  - `step_type`
  - `step_count`
  - `failed_count`
  - `average_latency_ms`
  - `p95_latency_ms`
  - `total_tokens`
  - `total_cost`
- `MonitorEventListItem`
  - `source_type`
  - `module`
  - `status`
  - `title`
  - `summary`
  - `latency_ms`
  - `token_total`
  - `cost_total`
  - `step_type`
  - `occurred_at`

## Existing Components and Design System

- `MonitorContent` for the monitor page body
- `ServiceHealthCard`, `MetricCard`, `Card`, `Button`, `EmptyState`, `StatusBadge`
- Tailwind CSS, shadcn-style local primitives, `motion/react`, `lucide-react`
- Existing monitor background: `MonitorCenterBackground`

## Required States and Actions

- loading: overview and event list placeholders
- empty: no step metrics or no filtered events
- error: event query failure
- success: step summary, step breakdown, unified event stream, event detail
- filters: window, module, status, source type, step type, keyword
- refresh: refetch overview, event list, selected detail

## Constraints

- Keep all visible UI copy in Chinese.
- Do not add middleware, containers, or new database tables.
- Reuse `conversation_run.steps` JSON generated in M21.
- Preserve current monitor route and API naming conventions.
