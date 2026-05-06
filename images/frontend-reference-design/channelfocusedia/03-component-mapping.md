# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Shared focused shell | `channel-operations-pages.tsx` | `ChannelFocusedRoute`, permissions | Extend nav with `replies`, `sender`, `release`. |
| Replies list | `channel-replies-content.tsx` | `listChannelReplies`, `ChannelReplyItem` | Focused list/detail row only; no editor. |
| Sender page shell | `channel-sender-content.tsx` | Sender delivery/task APIs | Uses direct React Query because detail and task actions exceed generic list shell. |
| Sender row/detail | `channel-sender-content.tsx` | `ChannelSenderDeliveryListItem`, `ChannelSenderDeliveryDetail` | Show request/response summaries and retry failed delivery. |
| Release page shell | `channel-release-content.tsx` | publish overview + release APIs | Read-focused governance summary with scheduler action. |
| Route files | `app/(console)/channels/{replies,sender,release}/page.tsx` | Next.js App Router | Dedicated route pages, not `ChannelContent` mode wrappers. |
| Menu seed | `apps/control-api/prisma/seed.ts` | `PERMISSION_CODES.channelPublishView` | Add static child menus under `channels`. |
