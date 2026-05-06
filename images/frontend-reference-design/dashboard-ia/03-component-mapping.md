# Component Mapping

| Reference region | Existing/new file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell and queries | `apps/web/src/components/dashboard/dashboard-content.tsx` | `getMonitorOverview`, `getAuditOverview` | Owns query orchestration and page layout only. |
| Shared types/helpers | `apps/web/src/components/dashboard/dashboard-shared.tsx` | `MonitorOverview`, `AuditOverview`, helper types | Metrics, incident mapping, health rows, format helpers, chart math. |
| Metric and health cards | `apps/web/src/components/dashboard/dashboard-overview-cards.tsx` | derived dashboard view models | Metric tile, health card, sparkline, status pill. |
| Trend and run-step cards | `apps/web/src/components/dashboard/dashboard-operations-cards.tsx` | `MonitorTrendPoint`, `MonitorRunStep*` | Operations trend chart and run-step drilldown rows. |
| Ranking/alert cards | `apps/web/src/components/dashboard/dashboard-insight-cards.tsx` | agent rankings, error segments, incidents | Agent ranking, error distribution, recent alerts. |
| Route contract | `apps/web/src/components/dashboard/dashboard-route-ia-contract.test.ts` | source-level IA contract | Protect that dashboard stays overview-only and split into focused components. |
| Reference assets | `images/frontend-reference-design/dashboard-ia/` | design prompt records | Records UI brief and prompts before implementation. |
