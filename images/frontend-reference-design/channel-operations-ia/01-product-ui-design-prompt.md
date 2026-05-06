# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend route family.

Project context:
- Product/module: 企业 AI Agent 平台，渠道运营信息架构
- Page/route: compatible overview `/channels` plus focused pages `/channels/publish`, `/channels/accounts`, `/channels/templates`, `/channels/route-rules`, `/channels/jobs`, `/channels/deliveries`
- Target users/roles: 渠道管理员、运营人员、Agent 管理员；show read-only states when `channel:publish:view` is present but manage/deploy/disable permissions are missing
- Business goal: 把发布渠道、账号凭据、消息模板、路由规则、发布任务、投递记录拆成职责清晰的真实页面，减少总览页承载的低频配置和追踪操作
- Existing frontend stack/design system: Next.js App Router, React Query, Tailwind, shadcn-like `Card`/`Button`/`Input`, `MetricCard`, `StatusBadge`, `EmptyState`, lucide icons
- Existing page shell/layout: console content area with max-width page container, compact enterprise SaaS density, restrained borders/shadows, Chinese UI

Interface contract that must appear in the UI:
- API/service functions: `getPublishChannelOverview`, `enablePublishChannel`, `disablePublishChannel`, `checkPublishChannel`, `listChannelProviders`, `listChannelAccounts`, `enableChannelAccount`, `disableChannelAccount`, `deleteChannelAccount`, `listChannelTemplates`, `enableChannelTemplate`, `disableChannelTemplate`, `deleteChannelTemplate`, `listChannelRouteRules`, `enableChannelRouteRule`, `disableChannelRouteRule`, `deleteChannelRouteRule`, `listChannelPublishJobs`, `cancelChannelPublishJob`, `retryChannelPublishJob`, `listChannelDeliveries`
- Main entities and fields: channel name/agent/type/status/health/request count/success rate; account provider/account key/owner/environment/readiness/credential rotation/status; template code/type/language/version/provider/status; route rule priority/match/target/fallback/status; job number/title/type/progress/retry count/timestamps/error; delivery id/provider/account/target/response status/latency/retry count/trace/error
- Status values/enums: publish channel DRAFT/ACTIVE/DISABLED/ERROR/ARCHIVED and health UNKNOWN/HEALTHY/DEGRADED/UNAVAILABLE; operation statuses ACTIVE/DISABLED/ERROR/DRAFT/EXPIRED/APPROVED/REJECTED; job statuses PENDING/RUNNING/SUCCESS/FAILED/SKIPPED/CANCELED/RETRYING; delivery statuses including SUCCESS/FAILED/RETRYING/PENDING/SKIPPED
- User actions: refresh, keyword/status/provider filters, pagination, enable/disable/delete for configuration pages, channel health check, publish channel enable/disable, job retry/cancel, row detail expansion
- Required states: loading, empty, API error, action success/error, validation for filters, disabled buttons for permission-denied states

Design requirements:
- Show `/channels/publish` as a focused publish-channel inventory with summary metrics, status/health chips, endpoint and Agent context, and row actions in a compact “更多” region.
- Show `/channels/accounts`, `/templates`, `/route-rules` as configuration pages with filters, core list fields, provider context, status actions, and details without crowding the main list.
- Show `/channels/jobs` and `/channels/deliveries` as operational tracking pages with progress/latency/retry/error details and deploy-only job actions.
- Keep `/channels` visually compatible as the full command center, but do not design subroutes as tabs that merely switch the old giant component.
- Use real Chinese product labels, no lorem ipsum, no decorative hero section, no unrelated charts.
