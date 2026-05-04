# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台 - M63-9 Sender 投递中心
- Page/route: 全渠道发布中心 at `/channels`
- Target users/roles: 租户管理员、渠道管理员、审计人员、运维人员
- Business goal: 让企业 IM / Webhook 主动回复从“后台发送”升级为可查询、可审计、可重试的投递中心
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style components, lucide icons, motion micro-interactions
- Existing page shell/layout: protected console layout, current `/channels` page has header, metrics, channel list, right-side details, recent events

Interface contract that must appear in the UI:
- API/service functions:
  - `getPublishChannelOverview()`
  - `listChannelSenderDeliveries({ channel_id, status, provider })`
  - `getChannelSenderDelivery(deliveryId)`
  - `retryChannelSenderDelivery(deliveryId)`
- Main entities and fields:
  - publish channel: channel name, channel type, agent name, status, health, endpoints
  - sender delivery: delivery ID, parent delivery ID, channel name, agent name, provider, target, status, response status, latency, retry count, conversation ID, run ID, trace ID, external conversation/message IDs, error message, delivered time, created time
  - delivery detail: request headers, request body, response body, updated time
- Status values/enums:
  - delivery status: PENDING, SUCCESS, FAILED, SKIPPED, RETRYING
  - providers: WECHAT_WORK, DINGTALK, FEISHU, SLACK, CUSTOM_WEBHOOK
- User actions:
  - filter by selected channel, status, provider
  - refresh delivery list
  - select a delivery row
  - inspect request/response payload
  - retry failed delivery if user has `channel:publish:manage`
- Required states: loading skeleton, empty delivery list, selected detail, failed delivery with error, retry disabled without permission, success notice, API error banner

Design requirements:
- Make it look like a production enterprise SaaS/admin product, not a generic marketing mockup.
- Keep the existing full-channel publish center visible: header, metrics, channel list and selected channel detail still exist.
- Add a clear “主动回复投递” operational region with compact filters, metrics, recent delivery rows and a detail inspector.
- Use a restrained dashboard/Bento layout with subtle borders, soft shadows, light backdrop blur and precise spacing.
- The detail inspector should feel audit-ready: request body, masked headers, response body, trace/run IDs and retry chain.
- Use Chinese UI text throughout.
- Use clean white/neutral panels with modest blue/emerald/amber/red status accents.
- Show retry as a serious operational action, not a decorative CTA.

Avoid:
- fake API fields not listed above
- decorative charts unrelated to delivery observability
- unreadable tiny text, random placeholder lorem ipsum
- excessive glow, overdone gradients, emoji, oversized rounded blobs, information overcrowding
