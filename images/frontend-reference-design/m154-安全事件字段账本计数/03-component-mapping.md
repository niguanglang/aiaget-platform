# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-events-content.tsx` | `/security/events` route | Reuse existing `SecurityWorkspaceHeader` and `SecurityPolicyBackground`. |
| Metric cards | `MetricCard` | `PaginatedResult<SecurityCenterEventListItem>` | Keep existing event total, Trace count and filter mode metrics. |
| Filter toolbar | Existing search/select/checkbox controls | `ListSecurityCenterEventsParams` | No API changes beyond response fields. |
| Event list row | `SecurityEventRow` | `SecurityCenterEventListItem` | Add lightweight field ledger chips after request summary. |
| Field ledger chips | Inline small spans in row | `has_export_field_ledger`, `exported_field_count`, `notification_archive_filter_field_count` | Show only counts; never render full arrays. |
| Detail navigation | Existing `Link` to `/security/events/{id}` | `getSecurityCenterEvent` in detail page | Full field names remain in detail page. |
| Loading/empty/error | `LoadingRows`, `EmptyState`, `PageError` | React Query states | Preserve existing behavior. |
