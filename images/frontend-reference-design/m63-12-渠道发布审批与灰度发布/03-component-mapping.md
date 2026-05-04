# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console layout | Keep current route. |
| Channel page | `apps/web/src/components/channels/channel-content.tsx` | Existing `ChannelContent` | Add M63-12 panel under channel operations. |
| Publish control data | `apps/web/src/lib/api-client.ts` | `ChannelPublishControl` | Add API client methods. |
| Shared contract | `packages/shared-types/src/index.ts` | `ChannelPublishControl`, action input/result types | Snake_case fields. |
| Approval status metrics | `MetricCard`, `StatusBadge` | `approval_status`, `requested_at`, `reviewed_at` | Chinese status labels. |
| Approval workflow card | `Card`, `Button`, `Input`, textarea | request/approve/reject APIs | Disable by permissions. |
| Rollout card | `Card`, `Input`, `Button` | `rollout_percentage`, `rollout_status` | Numeric input 0-100. |
| Rollback card | `Card`, `Button`, `DetailRow` | `rollback_available`, `last_stable_status`, `last_rollback_at` | Disable when unavailable. |
| Feedback states | existing alerts + `EmptyState` | React Query loading/error/mutation state | Show Chinese errors. |
| Backend persistence | `apps/control-api/src/channels/channels.service.ts` | `agent_publish_channel.config.publish_control` | No new table. |
| Backend routes | `ChannelsController` | `/channels/:channelId/publish-control/*` | Use channel permissions + data/resource guards. |
| Audit events | `PlatformEventsService` | `channel.publish_control.*` | Record decisions and rollout changes. |
