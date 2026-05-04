# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console layout | Existing route. |
| Channel content | `apps/web/src/components/channels/channel-content.tsx` | `ChannelContent` | Add panel after `ReleaseAutomationPanel`. |
| Self-healing query | `apps/web/src/lib/api-client.ts` | `ChannelReleaseSelfHealingOverview` | New get/update/run functions. |
| Shared contract | `packages/shared-types/src/index.ts` | self-healing policy/evaluation/run types | Snake_case fields. |
| Metrics row | `MetricCard`, `StatusBadge` | evaluation metrics and decision | Chinese labels. |
| Policy form | `PolicyToggle`, `NumberField`, `Button` | `ChannelReleaseSelfHealingPolicyInput` | Reuse helpers. |
| Evaluation detail | `Card`, `InfoRow`, `DetailRow`, `EmptyState` | `ChannelReleaseSelfHealingEvaluation` | Read-only summary. |
| Recent events | `Card`, `StatusBadge`, `EmptyState` | `PlatformEventListItem[]` | Event audit feed. |
| Backend storage | `ChannelsService` | `agent_publish_channel.config` | No table or migration. |
