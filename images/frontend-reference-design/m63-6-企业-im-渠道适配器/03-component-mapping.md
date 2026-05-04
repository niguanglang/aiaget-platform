# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/channels/channel-content.tsx` | existing `/channels` route | Reuse current layout and `ChannelCenterBackground`; no route change. |
| Header badges/toolbar | `ChannelContent` + `StatusBadge` + `Button` | `getPublishChannelOverview`, auth permissions | Add `M63-6`/回调适配 badge only. |
| Metrics strip | `MetricCard` | `PublishChannelOverview.summary` | No data contract change. |
| Channel list/filter | `Input`, `SelectFilter`, motion list | `PublishChannelListItem[]` | Reuse current keyword/type/status/health filters. |
| Selected channel detail | `ChannelDetailPanel`, `InfoRow`, `MiniMetric` | `PublishChannelListItem`, `getExternalChannelChatEndpoint`, `getExternalChannelStreamEndpoint` | Add `getExternalChannelCallbackEndpoint(channel.id)` row. |
| 企业 IM 回调适配 | New local helper inside `channel-content.tsx` | `PublishChannelType`, `status`, `secret_masked`, `config` | Show supported state for `WECHAT_WORK`, `DINGTALK`, `FEISHU`, `SLACK`, `CUSTOM_WEBHOOK`. |
| Channel form | `ChannelFormPanel` | `UpsertPublishChannelInput`, `UpdatePublishChannelInput` | Existing fields remain; no new form fields. |
| Feedback states | existing notice/error/empty/loading blocks | React Query state + mutation errors | Keep existing states and Chinese text. |
| Backend callback route | `apps/control-api/src/external-api/external-api.controller.ts` | `POST/GET /external/channels/:channelId/callback` | Returns provider-specific sync response. |
