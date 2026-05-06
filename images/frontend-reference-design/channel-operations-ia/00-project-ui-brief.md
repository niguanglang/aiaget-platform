# Project UI Brief

- Page: Channel Operations IA
- Route family: `/channels`, `/channels/publish`, `/channels/accounts`, `/channels/templates`, `/channels/route-rules`, `/channels/jobs`, `/channels/deliveries`
- Feature goal: Keep `/channels` as the compatible channel command center, and make each `/channels/*` route a real, focused page with its own title, query, filters, list/detail summary, and actions instead of passing a mode into `ChannelContent`.
- Target users/roles: 渠道管理员、Agent 管理员、运营人员；view/read surfaces are gated by `channel:publish:view`, mutating configuration by `channel:publish:manage`, deploy/retry/cancel operations by `channel:publish:deploy`, disable/delete operations by `channel:publish:disable`; tenant admins bypass these checks through existing auth conventions.
- API/service contract from `apps/web/src/lib/api-client.ts`:
  - `/channels`: `getPublishChannelOverview`, `enablePublishChannel`, `disablePublishChannel`, `checkPublishChannel`
  - `/channels/accounts`: `listChannelProviders`, `listChannelAccounts`, `enableChannelAccount`, `disableChannelAccount`, `deleteChannelAccount`
  - `/channels/templates`: `listChannelTemplates`, `enableChannelTemplate`, `disableChannelTemplate`, `deleteChannelTemplate`
  - `/channels/route-rules`: `listChannelRouteRules`, `enableChannelRouteRule`, `disableChannelRouteRule`, `deleteChannelRouteRule`
  - `/channels/jobs`: `listChannelPublishJobs`, `cancelChannelPublishJob`, `retryChannelPublishJob`
  - `/channels/deliveries`: `listChannelDeliveries`
- Entities/fields/statuses: `PublishChannelListItem` (name, agent, channel, status, health_status, endpoint_url, request_count_24h, success_rate_24h), `ChannelAccountItem` (account_name, provider_name, account_key, owner, environment, readiness, credential_rotation, status), `ChannelTemplateItem` (name, template_code, template_type, language, version, provider_name, status), `ChannelRouteRuleItem` (name, priority, provider_name, match_type, target_type, fallback_target, status), `ChannelPublishJobItem` (job_no, title, job_type, status, progress_percent, retry_count, scheduled_at/started_at/finished_at, error_message), `ChannelDeliveryItem` (delivery_id, status, provider_name, account_name, target, response_status, latency_ms, retry_count, trace_id, error_message).
- Existing components/design system: Next App Router, React Query, `useAuth`, `Button`, `Card`, `Input`, `MetricCard`, `StatusBadge`, `EmptyState`, Tailwind utility classes, lucide icons. `ChannelContent` remains only for the legacy `/channels` overview route.
- Required states: loading skeletons, empty states, API error banner, action success/error banner, disabled buttons for missing permission, compact filter reset, pagination, row-level details via a contained details/action area.
- IA constraints: 子页面文件不能 import `ChannelContent`，不能传 `initialOperationsModule` 或 `focusOperationsOnly`；列表只展示核心字段，低频动作进入行内“更多”区域；不改后端 API，不做 Docker/container/middleware，不提交 git。
