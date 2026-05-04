# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the real frontend page `/channels` in an enterprise AI Agent platform.

Project context:
- Product/module: 企业 Agent 平台，全渠道发布中心增强
- Page/route: 全渠道发布中心 at `/channels`
- Target users/roles: 租户管理员、Agent 管理员、渠道发布管理员、安全审计人员
- Business goal: 让管理员在同一个详情面板中查看企业微信、钉钉、飞书、Slack、自定义 Webhook 的统一平台回调地址、调用地址、适配状态、健康状态和最近渠道事件。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + local shadcn-style components (`Button`, `Card`, `Input`, `EmptyState`, `MetricCard`, `StatusBadge`) + restrained `motion/react`.
- Existing page shell/layout: enterprise SaaS dashboard, max width content, left navigation already provided by app shell, `/channels` page uses metrics row, channel list on the left, detail/action panels on the right.

Interface contract that must appear in the UI:
- API/service functions: `getPublishChannelOverview`, `upsertPublishChannel`, `updatePublishChannel`, `enablePublishChannel`, `disablePublishChannel`, `checkPublishChannel`, `getExternalChannelChatEndpoint`, `getExternalChannelStreamEndpoint`, `getExternalChannelCallbackEndpoint`
- Main entities and fields: channel name, channel type, associated Agent name/code/version, publish status, health status, endpoint URL, stream URL, callback URL, platform callback URL, masked secret, config JSON, 24h request count, 24h success rate, recent events.
- Status values/enums: `ACTIVE`, `DRAFT`, `DISABLED`, `ERROR`, `ARCHIVED`; `HEALTHY`, `DEGRADED`, `UNAVAILABLE`, `UNKNOWN`; channel types `企业微信`, `钉钉`, `飞书`, `Slack`, `自定义 Webhook`, `开放 API`, `Web 组件`.
- User actions: search/filter channels, select channel, create/edit channel, enable/disable, health check, view platform callback URL.
- Required states: loading skeleton, empty list, error banner, permission-denied card, disabled buttons for missing permissions, validation error in form, success notice.

Design requirements:
- Make it look like a production enterprise SaaS admin product, not a generic marketing page.
- Use a responsive Dashboard/Bento layout: summary metrics across top, channel list as a dense operational list, right detail panel with callback adapter status.
- The callback adapter area should be compact and operational: status badges, platform callback endpoint, supported inbound message formats, signature/security status, latest health text.
- Use white and very light slate surfaces, subtle borders, soft shadows, backdrop blur, restrained blue/emerald accents, and minimal gradient mesh in the page background.
- Use Chinese UI text.
- Include hover feedback and gentle reveal animations but keep the visual calm.
- Avoid oversized cards, excessive gradients, cheap glow, emoji, decorative blobs, and information overload.

Primary workflow to show:
1. Admin selects a published IM/Webhook channel from the left list.
2. Right detail panel shows Agent binding, call endpoint, stream endpoint, platform callback endpoint, health status, and config JSON.
3. Callback adapter section confirms whether this channel can receive inbound IM messages and route them to the bound Agent.

Output should be a product UI design reference image suitable for frontend implementation.
