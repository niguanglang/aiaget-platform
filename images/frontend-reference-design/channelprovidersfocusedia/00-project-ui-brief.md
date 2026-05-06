# Project UI Brief

- Page: ChannelProvidersFocusedIA
- Route: /channels/providers
- Feature goal: 渠道提供方独立列表、状态治理和详情操作边界
- Target users and permissions: 租户管理员、渠道运营、Agent 发布管理员；查看需要 `channel:publish:view`，启用/创建/编辑/删除需要 `channel:publish:manage`，停用需要 `channel:publish:disable`。
- APIs/services: `listChannelProviders`, `createChannelProvider`, `updateChannelProvider`, `enableChannelProvider`, `disableChannelProvider`, `deleteChannelProvider` from `apps/web/src/lib/api-client.ts`.
- Entities/fields/statuses: `ChannelProviderItem` with `id`, `name`, `code`, `type`, `status`, `health_status`, `account_count`, `template_count`, `route_rule_count`, `delivery_count_24h`, `success_rate_24h`, `readiness`, `credential_rotation`, `last_checked_at`, `metadata`; statuses `ACTIVE`, `DISABLED`, `ERROR`, `DRAFT`.
- Existing components/design system: Next.js App Router under `apps/web/src/app/(console)/channels`, Tailwind CSS, shadcn-like `Button`, `Card`, `Input`, `EmptyState`, `MetricCard`, `StatusBadge`, shared `ChannelOperationsListPage`, `ChannelOperationRow`, `ChannelProviderForm`.
- Required states: loading skeleton, empty state, API error alert, permission denied state, disabled action buttons, mutation success/error notices, selected row detail, create/edit form surface, destructive delete confirmation.
- IA constraint: `/channels/providers` is a focused menu-level page. `/channels` remains compatibility overview; list page should not embed all channel operation modules.
