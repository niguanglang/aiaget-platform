# Component Mapping

Reference image used for this implementation:

```text
images/frontend-reference-design/m12-dashboard-operations/references/reference-01-dashboard-ui.png
```

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console shell | `ConsoleShell`, `Sidebar`, `Topbar` | Existing auth session and console navigation | Recreated the light console frame, blue active nav, search bar, tenant pill, health pill and avatar treatment without changing routes. |
| Page coating / layers | `DashboardBackdrop`, local dashboard surface classes, `MobileNav` | Visual-only layer system | Added isolated page backdrop, glass-card coatings, soft rings/shadows, translucent sticky shell and mobile nav coating to prevent background/card/topbar layer conflicts. |
| Page hero | `DashboardContent` | `useAuth`, `monitor.overview.health.control_api.timestamp` | Greeting, M12/status chips, live-update cue, latest refresh timestamp and refresh action. |
| Headline metric strip | `MetricTile` in `dashboard-content.tsx` | `monitor.overview.summary`, `latency_trend`, `*_rankings` | Eight compact cards with icons and sparklines; labels adapted to real available fields instead of fake totals. |
| System health card | `HealthOverviewCard`, `HealthGauge` | `monitor.overview.health`, monitor/audit query status and success rates | Circular score and service table derived from real health and aggregate success data. |
| Operations trend | `OperationsTrendCard`, `TrendChart` | `monitor.overview.latency_trend` | Multi-line SVG chart for calls, failures and average latency with 24h/7d switching. |
| Agent ranking | `AgentRankingCard` | `monitor.overview.agent_rankings` | Top-five ranking with progress bars and link to `/agents`. |
| Error distribution | `ErrorDistributionCard` | `monitor.overview.errors`, `audit.overview.failures` | Donut visualization grouped by model/tool/knowledge/auth/other samples. |
| Recent alerts | `RecentAlertsCard` | `monitor.overview.errors`, `audit.overview.failures` | Merged recent incident list with severity labels and link to `/audit`. |
| Backend/data layer | existing `monitor` and `audit` modules | no new API required | Compose existing contracts, do not invent new tables. |
