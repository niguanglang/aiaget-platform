# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/dashboard/page.tsx` and `DashboardContent` | protected console route | Keep current dashboard route and shell. |
| Header and refresh | `DashboardContent` header section | `getMonitorOverview`, `getAuditOverview` query state | Remove emoji and keep Chinese copy. |
| Metric tile grid | `MetricTile` | `MonitorOverview.summary`, rankings, trends | Preserve existing cards; add step context through the new card rather than overloading tiles. |
| Health and trend | `HealthOverviewCard`, `OperationsTrendCard` | `MonitorOverview.health`, `MonitorTrendPoint[]` | Keep current behavior. |
| Run-step operations | new local helper in `dashboard-content.tsx` | `MonitorRunStepSummary`, `MonitorRunStepMetricItem[]` | Add summary tiles, distribution bars, and monitor drilldown links. |
| Monitor drilldown | `/monitor` query params | `source_type=conversation_step`, `step_type` | Update monitor page to initialize filters from query params. |
| Error and ranking cards | `AgentRankingCard`, `ErrorDistributionCard`, `RecentAlertsCard` | monitor and audit overview data | Preserve existing cards below the new run-step section. |
| Feedback states | `EmptyState`, loading text, error banner | react-query state | Keep loading, empty and error states visible. |
