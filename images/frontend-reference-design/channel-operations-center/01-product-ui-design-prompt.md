# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: AIAget Web 控制台渠道中心
- Page/route: 渠道中心 at `/channels`
- Target users/roles: 租户管理员、渠道运营、发布运维；权限包括 `channel:publish:view/manage/deploy/disable`
- Business goal: 将原本偏“发布渠道”的页面扩展为可运营的渠道管理页，统一查看 provider、account、template、route-rule、publish-job、delivery、reply，并保留现有发布渠道、Sender 投递、灰度、审批、流水线能力
- Existing frontend stack/design system: Next.js + React + TanStack Query + Tailwind；使用 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState` 和 lucide icons；中文 SaaS/admin 控制台风格，密集、克制、便于扫描
- Existing page shell/layout: `main` 为 `max-w-7xl` 网格，顶部标题与刷新/新建按钮，随后是指标卡、渠道清单详情、Sender 投递、发布控制、流水线、报告等模块

Interface contract that must appear in the UI:
- Existing API/service functions: `getPublishChannelOverview`、`listChannelSenderDeliveries`、`getChannelSenderDelivery`、`getChannelSenderPolicy`、`getChannelPublishControl`、`getChannelReleasePipeline`、`getChannelReleaseReport`、`getChannelReleaseGate`、`getChannelReleaseAutomation`、`getChannelReleaseSelfHealing`
- New API/service functions: `listChannelProviders` `/channels/providers`；`listChannelAccounts` `/channels/accounts`；`listChannelTemplates` `/channels/templates`；`listChannelRouteRules` `/channels/route-rules`；`listChannelPublishJobs` `/channels/publish-jobs`；`listChannelDeliveries` `/channels/deliveries`；`listChannelReplies` `/channels/replies`
- Main entities and fields: provider name/type/status/health/accounts/templates/deliveries；account provider/account_name/status/owner/last_used_at；template provider/type/status/language/version/updated_at；route rule name/priority/status/match/target/fallback；publish job job_no/status/channel/account/template/scheduled_at/finished_at；delivery status/provider/channel/target/latency/retry/trace；reply external conversation/message/status/delivery linkage
- Status values/enums: use existing publish channel statuses where applicable; new endpoints should show generic ACTIVE/DISABLED/ERROR/DRAFT/PENDING/RUNNING/SUCCESS/FAILED/SKIPPED/RETRYING when present
- User actions: switch module tabs, refresh all/new modules, keyword search, status/type/provider filters, select item to inspect detail, open existing channel workflow, retry delivery where existing sender delivery contract supports it
- Required states: loading, empty, error, disabled, permission-denied, success notice, partial backend availability

Design requirements:
- Use a segmented module navigation or compact tabs: 总览、发布渠道、渠道提供方、账号、模板、路由规则、发布任务、投递记录、回复记录.
- Make the top area a real operations dashboard, not a marketing hero.
- Use bento-style summary cards for provider/account/template/rule/job/delivery/reply counts and risk status.
- Keep the existing publish channel list/detail region recognizable.
- Add a modular operations workbench with a left list/table and right detail panel.
- Preserve Chinese labels and operational density.
- Avoid inventing unsupported create/edit forms for the new endpoints until backend DTOs are confirmed.

Avoid:
- unrelated CRM or marketing content
- fake backend fields outside the listed provisional entities
- decorative gradients or oversized cards
- unreadable tiny text or random charts
