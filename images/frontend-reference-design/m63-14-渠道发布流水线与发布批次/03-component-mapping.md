# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console layout | Keep current route. |
| Channel content | `apps/web/src/components/channels/channel-content.tsx` | Existing `ChannelContent` | Add panel after `RolloutGatePanel`. |
| Pipeline query | `apps/web/src/lib/api-client.ts` | `ChannelReleasePipeline` | Add `getChannelReleasePipeline`. |
| Pipeline actions | `apps/web/src/lib/api-client.ts` | `ChannelReleaseBatchInput` | Add start/full/abort calls. |
| Shared contract | `packages/shared-types/src/index.ts` | release pipeline types | Snake_case fields. |
| Metrics | `MetricCard`, `StatusBadge` | current batch and status | Chinese labels. |
| Timeline | `Card`, `StatusBadge`, Tailwind grid | `steps` | Reuse existing styles; no new package. |
| Action form | `Card`, `Input`, textarea, `Button` | start/full/abort inputs | Validate title and percentage. |
| Recent batches/events | `Card`, `InfoRow`, `DetailRow` | recent batches/events | Use existing `PlatformEventListItem`. |
| Feedback states | `EmptyState`, alerts | React Query loading/error | Include no channel and read-only state. |
| Backend storage | `ChannelsService` | `config.release_pipeline`, `platform_events` | No new table or migration. |
