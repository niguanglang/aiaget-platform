# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/channels/channel-content.tsx` | `/channels` existing route | Reuse current channel center shell. |
| Self-healing query | `useQuery` in `ChannelContent` | `getChannelReleaseSelfHealing` | Query key `channel-release-self-healing`. |
| Strategy form | `ReleaseSelfHealingPanel`, `PolicyToggle`, `NumberField` | `ChannelReleaseSelfHealingPolicyInput` | Existing form style, no new component system. |
| Metrics cards | `MetricCard` | `ChannelReleaseSelfHealingEvaluation.metrics` | Four operational cards. |
| Workflow summary | `InfoRow`, `DetailRow`, `StatusBadge` | `workflow_mode`, `workflow_backend`, `last_run.workflow_id` | New M63-19 display fields. |
| Execute action | `Button` with `RotateCcw` | `runChannelReleaseSelfHealing` | Dispatches Control API workflow service. |
| Save action | `Button` with `Save` | `updateChannelReleaseSelfHealing` | Disabled by permission/loading state. |
| Event feed | Existing event list markup | `recent_events` | Shows event type, status, occurred time, trace. |
| Permission state | Inline muted hint | `hasPermission` checks | Requires manage/deploy permissions. |
| Empty/error/loading | `EmptyState`, skeleton blocks, error banner | query/mutation state | Preserve existing patterns. |

## Implementation Notes

- Add workflow fields to shared self-healing run/overview types.
- Route `POST /channels/:channelId/release-self-healing/run` through a new Control API workflow service.
- Runtime owns only dispatch and callback boundary; Control API still owns self-healing policy, evaluation, rollback and audit events.
- No database migration; store workflow metadata in existing `agent_publish_channel.config.release_self_healing_last_run`.
- Do not start Temporal or create containers.
