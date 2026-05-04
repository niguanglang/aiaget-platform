# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console layout | Keep current route. |
| Channel content | `apps/web/src/components/channels/channel-content.tsx` | Existing `ChannelContent` | Add panel after `ReleaseGatePanel`. |
| Executor query | `apps/web/src/lib/api-client.ts` | `ChannelReleaseAutomationOverview` | `getChannelReleaseAutomation`. |
| Policy save | `apps/web/src/lib/api-client.ts` | `ChannelReleaseAutomationPolicyInput` | `updateChannelReleaseAutomation`. |
| Manual run | `apps/web/src/lib/api-client.ts` | `ChannelReleaseAutomationOverview` | `runChannelReleaseAutomation`. |
| Shared contract | `packages/shared-types/src/index.ts` | automation policy/run/overview types | Snake_case fields. |
| Metrics row | `MetricCard`, `StatusBadge` | overview policy/gate/last_run | Chinese labels. |
| Policy controls | `PolicyToggle`, `NumberField`, `Button` | automation policy input | Reuse existing helpers. |
| Execution detail | `Card`, `InfoRow`, `DetailRow`, `EmptyState` | last run and current batch | Read-only summary. |
| Recent events | `Card`, `StatusBadge`, `EmptyState` | `PlatformEventListItem[]` | Show event type/time/trace. |
| Backend storage | `ChannelsService` | `agent_publish_channel.config` | No table or migration. |
