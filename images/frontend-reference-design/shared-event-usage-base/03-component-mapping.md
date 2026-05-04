# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/monitor/monitor-content.tsx`, `apps/web/src/components/billing/billing-content.tsx` | `/monitor`, `/billing` route shell | reuse current admin page spacing and cards |
| Summary metrics | `MetricCard` | `PlatformEventUsageOverview.summary`, `MonitorOverview.summary`, `BillingOverview.summary` | show total events, usage, relations, rollups, trace coverage |
| Filter bar | existing select/input/button patterns in monitor/audit/billing pages | query params for `window`, `source`, `resource_type`, `metric_type` | keep table-first admin density |
| Unified event table | `apps/web/src/components/monitor/monitor-content.tsx` | `PlatformEventListItem` | extend with linked usage counts and relation summary |
| Event detail panel | `apps/web/src/components/platform-event-usage/platform-event-usage-panel.tsx` | `PlatformEventDetail` | show payload, relations, and linked usage items without using legacy monitor event APIs |
| Usage ledger table | `apps/web/src/components/billing/billing-content.tsx` table pattern | `PlatformUsageLedgerItem` | show quantity, amount, cost, trace/request IDs |
| Rollup cards/table | `MetricCard`, card grids, table layouts | `PlatformUsageRollupItem` | period-type and totals for cost aggregation |
| Relation timeline | `apps/web/src/components/conversations/conversation-detail-content.tsx` timeline pattern | `PlatformEventRelationItem` | parent/child/source/target relations with metadata |
| Empty/loading/error states | `EmptyState`, inline loading text, error banners | all unified event endpoints | preserve current admin UX language |
| Permission states | `StatusBadge`, `hasPermission` patterns | monitor/security/billing permissions | route-specific access control |

## M64 收口映射

| Enhancement | File | Contract | Notes |
| --- | --- | --- | --- |
| Platform event filters | `PlatformEventUsagePanel` | `listPlatformEvents`, `listPlatformUsageLedger`, `listPlatformUsageTrends` | window/source/event/resource/metric/trace/request/keyword |
| Platform event detail | `PlatformEventUsagePanel` | `getPlatformEvent` | selected event loads payload, relations and linked usage |
| Linked usage mode | `PlatformEventUsagePanel` | `listPlatformUsageLedger({ event_id, trace_id, request_id })` | selecting event filters ledger by event first |
| Monitor integration | `MonitorContent` | local panel callback | avoid sending platform event id into legacy `/monitor/events/:id` |
| Compact billing integration | `BillingContent` | same panel with `compact` | keep lower density but preserve filters |
