# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page route | `apps/web/src/app/(console)/channels/page.tsx` | Next.js App Router | New route renders module content only; shell stays in existing layout |
| Page content | `apps/web/src/components/channels/channel-content.tsx` | `PublishChannelOverview`, `PublishChannelListItem` | New module component, Chinese UI |
| Background | `apps/web/src/components/channels/channel-center-background.tsx` | visual only | Reuse current Three.js ambient pattern, subtle and non-blocking |
| Header / toolbar | `Button`, `StatusBadge`, lucide icons | permissions from `useAuth`, `getPublishChannelOverview` | Refresh, create, permission chips, generated time |
| Summary metrics | `MetricCard` + custom compact cards | `PublishChannelOverview.summary` | Bento row: total, active, error, requests, success rate, active agents |
| Filters | `Input`, native select styled with Tailwind | local state | keyword, channel type, status, health status |
| Channel list | `Card`, `StatusBadge`, `Button`, motion row feedback | `PublishChannelListItem[]` | Select row, show agent, channel, health, 24h metrics, endpoints |
| Detail inspector | `Card`, `StatusBadge`, code blocks | selected `PublishChannelListItem` | Endpoint, callback, secret mask, config JSON, health message, timestamps |
| Create/edit form | Inline right panel in same component | `UpsertPublishChannelInput`, `UpdatePublishChannelInput`, `listAgents` | Validate name/Agent/channel/config JSON before mutation |
| Actions | `useMutation`, `Button` | `upsertPublishChannel`, `updatePublishChannel`, `enablePublishChannel`, `disablePublishChannel`, `checkPublishChannel` | Disable by permission and channel state |
| Channel mix | `Card` mini bars | `PublishChannelOverview.channel_mix` | Operational mix by channel type |
| Recent events | Existing `PlatformEventListItem` fields | `PublishChannelOverview.recent_events` | Show type/status/summary/time |
| Feedback states | `EmptyState`, inline alerts | query/mutation errors | Loading, empty, API error, validation, success, no permission |
| API client | `apps/web/src/lib/api-client.ts` | shared types | Add six channel service functions and imports |
| Navigation | `apps/web/src/config/modules.ts`, `apps/web/src/config/navigation.ts`, `menu-navigation.ts` | permission `channel:publish:view` | Add `channels` module and `RadioTower` icon fallback |
