# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell and background | `ChannelCenterBackground`, `ChannelFocusedHeader` in `channel-operations-pages.tsx` | `ChannelFocusedRoute` | Add `providers` as a focused route and navigation item. |
| Metrics row | `ChannelMetricGrid`, `MetricCard` | `ChannelProviderItem` counts and success rate | Keep metrics derived from current page data. |
| Filtered list | `ChannelOperationsListPage` | `listChannelProviders(params)` | Use the shared focused list shell. |
| Provider row | `ChannelOperationRow`, `ChannelOperationStatusBadge`, `StatusBadge` | `ChannelProviderItem` | Compact row plus expandable detail. |
| Provider create/edit | `ChannelProviderForm` | `createChannelProvider`, `updateChannelProvider`, `CreateChannelProviderInput`, `UpdateChannelProviderInput` | Independent page-owned form card, not `ChannelContent` wrapper. |
| Provider actions | `Button` with lucide `Power`, `PowerOff`, `Edit`, `Trash2`, `Plus` | `enableChannelProvider`, `disableChannelProvider`, `deleteChannelProvider` | Disable by backend permission-derived flags. Delete requires `confirm()`. |
| Menu seed | `apps/control-api/prisma/seed.ts` | `PERMISSION_CODES.channelPublishView` | Add `channel_providers` static child route. |
| IA tests | `channels-route-ia-contract.test.ts`, `menu-seed-contract.test.ts` | Route/file/menu contracts | RED before implementation. |
