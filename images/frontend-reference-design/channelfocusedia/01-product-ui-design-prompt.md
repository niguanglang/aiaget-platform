# Product UI Design Image Prompt

Create a high-fidelity product UI design image for three focused pages in an enterprise AI Agent Platform channel publishing center:

1. `/channels/replies` - 回复记录 page
2. `/channels/sender` - Sender 投递 page
3. `/channels/release` - 发布治理 page

Project context:
- Product/module: 企业 AI Agent 平台 / 全渠道发布中心
- Target users/roles: channel operators, tenant admins, release managers, auditors
- Business goal: split overloaded channel overview into focused operational pages for replies, active sender deliveries, and release governance
- Existing frontend stack/design system: Next.js, React Query, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges
- Existing page shell/layout: console page, max width 7xl, subtle bordered cards, restrained glass background, Chinese UI text

Interface contract:
- Replies: listChannelReplies, fields reply_id/status/provider/channel_name/delivery_id/external_conversation_id/external_message_id/conversation_id/run_id/trace_id/reply_type/content_preview/error_message/replied_at
- Sender: listChannelSenderDeliveries, getChannelSenderDelivery, retryChannelSenderDelivery, getChannelSenderTaskOverview, runChannelSenderAutoRetry, runChannelSenderCleanup
- Release: getPublishChannelOverview, getChannelReleaseSchedulerOverview, runChannelReleaseSchedulerOnce, getChannelReleasePipeline, getChannelReleaseGate, getChannelReleaseAutomation, getChannelReleaseSelfHealing, getChannelReleaseReport
- Actions: filter/search, expand row details, retry failed sender delivery, run auto retry, run cleanup, select channel, run release scheduler once
- States: loading, empty, error, disabled, permission denied, operation success/failure

Design requirements:
- Use clear top navigation between 发布渠道、账号凭据、消息模板、路由规则、发布任务、投递记录、回复记录、Sender 投递、发布治理.
- For replies, use a focused list with external conversation and Trace as first-class debugging fields.
- For Sender, show task metrics, delivery list, detail panel, request/response preview, retry button.
- For Release, show channel selector, scheduler overview, pipeline state, gate/automation/self-healing/report summary cards.
- Keep pages dense but readable. Chinese labels only. Avoid emoji and decorative clutter.
