# Project UI Brief

- Page: ChannelFocusedIA
- Route: /channels/replies,/channels/sender,/channels/release
- Feature goal: 渠道发布中心回复记录、Sender投递、发布治理独立页面收口
- Target users/permissions: 拥有 `channel:publish:view` 的用户可查看；`channel:publish:manage` 可重试 Sender 投递和运行 Sender 任务；`channel:publish:deploy` 可触发发布巡检。
- APIs/services: `listChannelReplies`, `listChannelSenderDeliveries`, `getChannelSenderDelivery`, `retryChannelSenderDelivery`, `getChannelSenderTaskOverview`, `runChannelSenderAutoRetry`, `runChannelSenderCleanup`, `getPublishChannelOverview`, `getChannelReleaseSchedulerOverview`, `runChannelReleaseSchedulerOnce`, `getChannelReleasePipeline`, `getChannelReleaseGate`, `getChannelReleaseAutomation`, `getChannelReleaseSelfHealing`, `getChannelReleaseReport`.
- Entities/fields/statuses: `ChannelReplyItem`, `ChannelSenderDeliveryListItem`, `ChannelSenderDeliveryDetail`, `ChannelSenderTaskOverview`, `PublishChannelListItem`, `ChannelReleaseSchedulerOverview`, release pipeline/gate/automation/self-healing/report overviews.
- Existing components/design system: Next.js App Router, React Query, Tailwind, shadcn-style `Card`/`Button`/`Input`, shared `ChannelOperationsListPage`, `ChannelOperationRow`, `MetricCard`, `StatusBadge`, `EmptyState`.
- Required states: loading, empty, error, disabled, permission-denied, operation success/failure notice.
- IA constraints: `/channels` remains overview/compatibility entry; replies, Sender and release governance must be route-level pages, not modes inside the overview page.
