# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console route | Keep current route and protected layout. |
| Main content | `apps/web/src/components/channels/channel-content.tsx` | `PublishChannelOverview`, `PublishChannelListItem` | Extend existing page instead of creating a second Sender page. |
| Header / metrics / channel list | Existing `ChannelContent` regions | `getPublishChannelOverview()` | Preserve M63-4/M63-6/M63-8 behavior. |
| Sender delivery filters | `Input`, styled native `select`, `Button` | `listChannelSenderDeliveries({ channel_id, status, provider })` | Use selected channel as default filter; allow all channels with empty value. |
| Sender delivery metrics | `MetricCard` | `ListChannelSenderDeliveriesResult.items` | Compute total, success, failed, skipped, average latency locally. |
| Delivery list | `Card`, `StatusBadge`, `Button`, `motion` | `ChannelSenderDeliveryListItem[]` | Compact operational rows; click opens detail; failed rows show retry. |
| Delivery detail | `Card`, `DetailRow`, code block | `ChannelSenderDeliveryDetail` | Show request headers/body, response body, trace/run IDs. Mask sensitive headers. |
| Retry action | `useMutation`, `Button`, `RotateCcw` icon | `retryChannelSenderDelivery(deliveryId)` | Enabled only for failed records and `channel:publish:manage`. |
| Feedback states | `EmptyState`, inline alerts, skeleton blocks | React Query state | Loading, empty, error, success, selected-none, permission-disabled. |
| API client | `apps/web/src/lib/api-client.ts` | shared types | Add list/detail/retry functions. |
| Shared types | `packages/shared-types/src/index.ts` | `ChannelSenderDelivery*` interfaces | Keep snake_case API fields consistent with existing contracts. |
| Backend API | `apps/control-api/src/channels/channels.controller.ts` | `ExternalChannelSenderService` | Add list/detail/retry routes under `/channels/sender-deliveries`. |
| Delivery persistence | `apps/control-api/src/external-api/external-channel-sender.service.ts` | Prisma `ChannelSenderDelivery` | Create PENDING record before send, update after success/skip/fail. |
| Database migration | `apps/control-api/prisma/migrations/.../migration.sql` | `channel_sender_delivery` | Include table/column comments and indexes. |

## Implementation Plan

1. Add shared delivery types and Prisma model/migration comments.
2. Refactor Channel Sender to persist every delivery and support retry from stored request body/headers.
3. Add Channels API endpoints for list/detail/retry with existing channel permissions.
4. Add API client functions and import new shared types.
5. Extend `/channels` UI with a “主动回复投递” operational panel, metrics, list, detail and retry action.
6. Run control-api and web type checks.
