# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/channels/page.tsx` | Console layout | Keep current route. |
| Channel page | `apps/web/src/components/channels/channel-content.tsx` | `PublishChannelListItem` | Add policy card near Sender 投递中心. |
| Policy card | `Card`, `Button`, `Input`, native checkbox/select | `ChannelSenderPolicy` | New component in same file for scoped change. |
| Policy data | `apps/web/src/lib/api-client.ts` | `getChannelSenderPolicy`, `updateChannelSenderPolicy` | Add API client methods. |
| Shared contract | `packages/shared-types/src/index.ts` | `ChannelSenderPolicy`, `UpdateChannelSenderPolicyInput` | Reuse snake_case API naming. |
| Backend routes | `ChannelsController` | `GET/PUT /channels/:channelId/sender-policy` | Use `channel:publish:view/manage` and existing resource guards. |
| Backend persistence | `ChannelsService` | `agent_publish_channel.config.sender_policy` | No new table. |
| Retry enforcement | `ExternalChannelSenderService` | `retryDelivery` | Block retry if manual retry off or max retry count reached. |
| Feedback states | Existing alerts/EmptyState | React Query / mutation state | Loading, empty, validation, permission disabled, success/error. |

## Implementation Plan

1. Add shared policy types.
2. Add DTO and backend service/controller methods for get/update policy.
3. Enforce manual retry and max retry count in `ExternalChannelSenderService.retryDelivery`.
4. Add API client methods.
5. Add policy card in `/channels` with Chinese controls and validation.
6. Run control-api and web type checks.
