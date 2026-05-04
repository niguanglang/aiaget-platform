# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/channels/channel-content.tsx` | `/channels` route | Reuse current channel dashboard. |
| Scheduler query | `useQuery` in `ChannelContent` | `getChannelReleaseSchedulerOverview` | Query key `channel-release-scheduler-overview`. |
| Manual run action | `Button` + mutation | `runChannelReleaseSchedulerOnce` | Requires `channel:publish:deploy`. |
| Header badges | `StatusBadge` | `scheduler_enabled`, `running`, `last_run.status` | Chinese status labels. |
| Metrics | `MetricCard` | `summary`, `last_run` | Four cards. |
| Scheduling status | `InfoRow` | `workflow_modes`, `last_tick_at`, `next_tick_after_seconds` | Left detail panel. |
| Last run summary | `DetailRow` | `ChannelReleaseSchedulerRunResult` | Right detail panel. |
| Result feed | Existing rounded border rows | `ChannelReleaseSchedulerChannelResult[]` | Shows task, decision, backend. |
| Empty/error/permission states | `EmptyState`, error banner, muted hint | query/mutation/permission state | Preserve current patterns. |

## Implementation Notes

- Scheduler service lives in Control API and uses an internal timer only when `CHANNEL_RELEASE_SCHEDULER_ENABLED=true`.
- Scheduler calls existing workflow services; it does not duplicate publish, rollback, approval, or policy logic.
- No database migration; latest run is in service memory and audit is persisted through `platform_event`.
- No new middleware/container action.
