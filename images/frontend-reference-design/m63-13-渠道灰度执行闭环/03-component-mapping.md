# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console layout | Keep current route. |
| Channel content | `apps/web/src/components/channels/channel-content.tsx` | Existing `ChannelContent` | Add M63-13 panel after `PublishControlPanel`. |
| Gate overview query | `apps/web/src/lib/api-client.ts` | `ChannelRolloutGateOverview` | Add `getChannelRolloutGateOverview(channelId)`. |
| Shared contract | `packages/shared-types/src/index.ts` | `ChannelRolloutGateOverview`, `ChannelRolloutGateDecision` | Snake_case fields. |
| Metrics | `MetricCard`, `StatusBadge` | overview counts and status | Chinese labels and tones. |
| Decision detail | `Card`, `InfoRow`, `DetailRow` | `last_decision` | No editing; read-only execution state. |
| Progress bar | Tailwind divs | `rollout_percentage`, `allowed_rate_24h` | Visual compare of configured vs observed. |
| Feedback states | `EmptyState`, existing error alert | React Query loading/error | Include no channel and permission states. |
| Backend gate | New service under `apps/control-api/src/external-api/` | `agent_publish_channel.config.publish_control` | Reused by external API and callbacks. |
| Backend overview | `ChannelsController` + `ChannelsService` | platform events and usage | No new table. |
