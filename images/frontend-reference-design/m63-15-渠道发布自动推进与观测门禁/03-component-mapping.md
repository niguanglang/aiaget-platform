# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console layout | Keep current route. |
| Channel content | `apps/web/src/components/channels/channel-content.tsx` | Existing `ChannelContent` | Add panel after `ReleasePipelinePanel`. |
| Gate query | `apps/web/src/lib/api-client.ts` | `ChannelReleaseGateOverview` | Add get/update/evaluate methods. |
| Shared contract | `packages/shared-types/src/index.ts` | release gate policy/evaluation types | Snake_case fields. |
| Metrics row | `MetricCard`, `StatusBadge` | evaluation metrics | Chinese labels. |
| Policy form | `Card`, `Input`, `PolicyToggle`, `NumberField` | `ChannelReleaseGatePolicyInput` | Reuse existing helper components. |
| Decision detail | `Card`, `InfoRow`, `DetailRow` | `ChannelReleaseGateEvaluation` | Read-only summary. |
| Feedback states | `EmptyState`, alerts | React Query loading/error | Include no channel/no batch/read-only states. |
| Backend storage | `ChannelsService` | `config.release_gate_policy`, platform usage/events | No new table or migration. |
