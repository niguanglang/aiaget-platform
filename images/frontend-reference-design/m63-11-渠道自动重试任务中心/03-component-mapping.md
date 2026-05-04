# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console layout | Keep current route. |
| Main channel page | `apps/web/src/components/channels/channel-content.tsx` | Existing `ChannelContent` | Add panel near Sender Policy / Sender Delivery sections. |
| Task overview data | `apps/web/src/lib/api-client.ts` | `getChannelSenderTaskOverview` | New client method. |
| Manual auto retry action | `Button` + React Query mutation | `runChannelSenderAutoRetry` / `ChannelSenderTaskRunResult` | Disabled without `channel:publish:manage`. |
| Manual cleanup action | `Button` + React Query mutation | `runChannelSenderCleanup` / `ChannelSenderTaskRunResult` | Disabled without `channel:publish:manage`. |
| Metrics row | `MetricCard` | `ChannelSenderTaskOverview.summary` | Pending retry, expired records, enabled channels, failed deliveries. |
| Status badges | `StatusBadge` | `scheduler_enabled`, `running`, `last_tick_at` | Chinese labels. |
| Result detail | `Card`, `MiniMetric`, `DetailRow` helpers | `last_auto_retry_result`, `last_cleanup_result` | Reuse local helper components already in file. |
| Feedback states | Existing alert blocks + `EmptyState` | React Query loading/error/mutation states | Loading, empty, error, permission hint. |
| Backend service | `apps/control-api/src/channels/channel-sender-task.service.ts` | Prisma `channel_sender_delivery`, `agent_publish_channel.config.sender_policy` | No new table; no middleware/container. |
| Backend routes | `ChannelsController` | `GET/POST /channels/sender-tasks/*` | Uses `channel:publish:view/manage`. |
