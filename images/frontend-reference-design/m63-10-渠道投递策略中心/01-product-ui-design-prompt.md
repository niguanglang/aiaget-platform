# Product UI Design Image Prompt

Create a high-fidelity product UI design image for this real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台 - M63-10 渠道投递策略中心
- Page/route: 全渠道发布中心 at `/channels`
- Users/roles: 租户管理员、渠道管理员、运维人员、审计人员
- Business goal: configure retry, alert and retention policy for channel sender deliveries, and make manual retry follow those policies
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui style Card/Button/Input/StatusBadge/MetricCard, lucide icons, motion micro-interactions
- Existing page shell/layout: current `/channels` page already has channel list, selected channel detail, sender delivery list and detail panel

Interface contract that must appear:
- API/service functions:
  - `getPublishChannelOverview()`
  - `getChannelSenderPolicy(channelId)`
  - `updateChannelSenderPolicy(channelId, input)`
  - `retryChannelSenderDelivery(deliveryId)` which respects the policy
- Main entities and fields:
  - selected channel: name, type, agent, status
  - sender policy: auto retry enabled, manual retry enabled, max retry count, retry backoff seconds, retry HTTP statuses, alert on failure, retention days
  - sender deliveries: failed deliveries indicate whether retry is available
- Actions:
  - edit policy fields
  - save policy
  - refresh policy
  - retry failed delivery with disabled state when policy blocks it
- Required states: loading, empty selected channel, disabled without permission, validation error, save success, API error

Design requirements:
- Integrate into the existing `/channels` dashboard as a focused policy card near the sender delivery center.
- Use Chinese UI text.
- Keep the visual hierarchy operational and enterprise-grade.
- Use compact controls: toggles/checkboxes for booleans, number inputs for numeric policy, comma text input for HTTP statuses, primary save button.
- Show a concise policy impact summary, such as “最多重试 3 次、退避 60 秒、失败告警开启”.
- Use subtle borders, soft shadow, white panels, restrained blue/emerald/amber/red status accents.

Avoid:
- fake fields outside the contract
- background-heavy decorative UI
- unreadable tiny tables
- excessive glow, emoji, large rounded blobs, overdone gradients
