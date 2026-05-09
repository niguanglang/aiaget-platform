# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/monitor/monitor-content.tsx`, `apps/web/src/components/platform-event-usage/platform-usage-*.tsx` | `/monitor`, `/monitor/platform-usage/*` route shell | monitor home keeps entry only; platform usage owns focused pages |
| Summary metrics | `MetricCard` | `PlatformEventUsageOverview.summary`, `MonitorOverview.summary`, `BillingOverview.summary` | show total events, usage, relations, rollups, trace coverage |
| Filter bar | existing select/input/button patterns in monitor/audit/billing pages | query params for `window`, `source`, `resource_type`, `metric_type` | keep table-first admin density |
| Unified event table | `PlatformUsageOverviewContent`, `PlatformEventTable` | `PlatformEventListItem` | list route only shows core identifying fields and detail link |
| Event detail panel | `PlatformEventDetailContent`, `PlatformEventDetailPanel` | `PlatformEventDetail` | show payload, relations, and linked usage items without using legacy monitor event APIs |
| Usage ledger table | `apps/web/src/components/billing/billing-content.tsx` table pattern | `PlatformUsageLedgerItem` | show quantity, amount, cost, trace/request IDs |
| Rollup cards/table | `MetricCard`, card grids, table layouts | `PlatformUsageRollupItem` | period-type and totals for cost aggregation |
| Relation timeline | `apps/web/src/components/conversations/conversation-detail-content.tsx` timeline pattern | `PlatformEventRelationItem` | parent/child/source/target relations with metadata |
| Empty/loading/error states | `EmptyState`, inline loading text, error banners | all unified event endpoints | preserve current admin UX language |
| Permission states | `StatusBadge`, `hasPermission` patterns | monitor/security/billing permissions | route-specific access control |

## M64 收口映射

| Enhancement | File | Contract | Notes |
| --- | --- | --- | --- |
| Platform event filters | `PlatformUsageOverviewContent` | `listPlatformEvents`, `listPlatformUsageLedger`, `listPlatformUsageTrends` | window/source/event/resource/metric/trace/request/keyword |
| Platform event detail | `PlatformEventDetailContent` | `getPlatformEvent` | detail route loads payload, relations and linked usage |
| Alert lifecycle | `PlatformUsageAlertsContent` + `PlatformUsageConfirmDialog` | `detectPlatformUsageAnomalies`, `rebuildPlatformUsageRollups`, `listPlatformUsageAlerts`, `updatePlatformUsageAlert`, `notifyPlatformUsageAlert` | governance actions stay off overview route; anomaly detection, Rollup rebuild, alert notification and status changes require explicit confirmation |
| Notification audit | `PlatformUsageNotificationsContent` + `PlatformUsageConfirmDialog` | `listPlatformUsageAlertNotifications`, `retryPlatformUsageAlertNotification` | notification retry stays off overview route and requires explicit confirmation |
| Retry task | `PlatformUsageTasksContent` + `PlatformUsageConfirmDialog` | `getPlatformUsageAlertNotificationTaskOverview`, `runPlatformUsageAlertNotificationAutoRetry` | scheduler/task controls stay off overview route; manual auto-retry scan requires explicit confirmation |
| Monitor integration | `MonitorContent` | `getMonitorOverview`, `listMonitorEvents` | homepage links into platform usage pages without importing platform usage data APIs |
