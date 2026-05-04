# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/channels/channel-content.tsx` | `/channels` route | Reuse current channel detail dashboard. |
| Report query | `useQuery` | `getChannelReleaseReport(channelId)` | Query key `channel-release-report`. |
| Header | `StatusBadge`, `Button` | `incident_level`, `generated_at` | Refresh-only action. |
| Conclusion | `Card`, `InfoRow` | `ChannelReleaseReport.summary` | Read-only. |
| Metrics | `MetricCard` | `ChannelReleaseReport.metrics` | Existing metric card styling. |
| Risk list | bordered rows + `StatusBadge` | `ChannelReleaseReport.risks` | Severity tone mapping. |
| Timeline | bordered rows + `StatusBadge` | `ChannelReleaseReport.timeline` | Shows Trace when present. |
| Report body | `pre` in card | `markdown` | No export action in this milestone. |
| States | `EmptyState`, skeleton, error banner | query state | Existing UX pattern. |

## Implementation Notes

- Backend generates report from existing `agent_publish_channel.config`, `platform_event`, and `platform_usage_event`.
- No schema changes.
- No middleware/container actions.
- Report text is Chinese and suitable for audit/change review.
