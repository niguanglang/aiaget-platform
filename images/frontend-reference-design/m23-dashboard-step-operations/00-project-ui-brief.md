# Project UI Brief

- Project: AIAget Enterprise Agent Platform
- Page: M23 Dashboard Step Operations
- Route: `/dashboard`
- Feature goal: add run-step operations summary to the dashboard and let operators drill down into monitor filters
- Parent layout: protected console shell under `apps/web/src/app/(console)/dashboard/page.tsx`
- Target users: tenant operators and admins with dashboard and monitor access

## APIs and Services

- `GET /api/v1/monitor/overview`
  - frontend: `getMonitorOverview({ window })`
  - response: `MonitorOverview`
  - fields used: `summary`, `latency_trend`, `health`, `agent_rankings`, `tool_rankings`, `knowledge_rankings`, `errors`, `run_step_summary`, `run_step_breakdown`
- `GET /api/v1/audit/overview`
  - frontend: `getAuditOverview({ window })`
  - response: `AuditOverview`
  - fields used: `summary`, `failures`
- `GET /api/v1/monitor/events`
  - route target from dashboard links: `/monitor?source_type=conversation_step&step_type=<type>`

## Entities and Fields

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

## Existing Components and Design System

- `DashboardContent`
- `Card`, `Button`, `EmptyState`, `StatusBadge`
- `Link` for drilldown into monitor
- `motion/react`, `lucide-react`, Tailwind CSS, shadcn-style local primitives

## Required States and Actions

- loading: dashboard overview skeleton text
- empty: no run-step metrics in the selected window
- error: existing monitor/audit error banner remains
- success: step summary, step distribution rows, monitor drilldown links
- actions: switch window, refresh dashboard, drill down to monitor event filters

## Constraints

- Keep visible UI text in Chinese.
- Remove nonessential emoji from dashboard copy.
- Do not add middleware, containers, database tables, or migrations.
- Reuse M22 monitor overview contracts and existing dashboard layout.
