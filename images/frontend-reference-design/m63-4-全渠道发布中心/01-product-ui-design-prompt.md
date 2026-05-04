# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: AIAget 企业 Agent 平台，全渠道发布中心
- Page/route: M63-4 全渠道发布中心 at `/channels`
- Target users/roles: 租户管理员、Agent 管理员、发布运维人员、安全审计人员；普通用户需要 `channel:publish:view`，管理操作需要 `channel:publish:manage`，启用需要 `channel:publish:deploy`，停用需要 `channel:publish:disable`
- Business goal: 将已发布 Agent 配置到 Web 组件、开放 API、企业微信、钉钉、飞书、Slack、自定义 Webhook 等渠道，并集中观测启停状态、健康检查、入口回调、24h 请求量和成功率
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-like Button/Card/Input/EmptyState/MetricCard/StatusBadge, TanStack Query, lucide icons, motion micro-interactions
- Existing page shell/layout: 企业后台左侧导航 + 顶部栏，页面内容是响应式 Dashboard/Bento layout；白色半透明卡片、细边框、轻阴影、backdrop blur、浅网格/噪声背景、克制科技感

Interface contract that must appear in the UI:
- API/service functions: `getPublishChannelOverview`, `upsertPublishChannel`, `updatePublishChannel`, `enablePublishChannel`, `disablePublishChannel`, `checkPublishChannel`, `listAgents({ status: "PUBLISHED" })`
- Main entities and fields: channel name, channel type, agent name/code/version/status, description, status, health status, health message, endpoint URL, callback URL, masked secret, config JSON summary, last published time, last checked time, 24h request count, 24h success rate, last request time
- Summary metrics: channel total, active channels, error channels, 24h requests, 24h success rate, active agent count
- Status values/enums: channel type `WEB_WIDGET`, `OPEN_API`, `WECHAT_WORK`, `DINGTALK`, `FEISHU`, `SLACK`, `CUSTOM_WEBHOOK`; status `DRAFT`, `ACTIVE`, `DISABLED`, `ERROR`, `ARCHIVED`; health `UNKNOWN`, `HEALTHY`, `DEGRADED`, `UNAVAILABLE`
- User actions: refresh, search/filter, create channel, edit channel, enable, disable, health check, inspect selected channel, validate JSON config
- Required states: loading, empty, API error, form validation error, disabled operations without permission, success notice, permission denied state

Design requirements:
- Make it look like a production SaaS/admin product, not a template.
- Show a clear top command bar with Chinese title “全渠道发布中心”, status chips, refresh and create actions.
- Use a Bento metric row for summary metrics.
- Main area: left side is a channel table/card list with filters, right side is selected channel detail panel with endpoint/callback/secret/config/health/event timeline.
- Add a compact form drawer or inline panel for new/edit channel, including Agent select, channel type select, name, description, endpoint URL, callback URL, secret, JSON config, status.
- Include channel mix cards for Web/Open API/IM/Webhook and a recent event list.
- Use restrained motion and hover feedback; subtle background with grid mesh and a small ambient 3D line/particle network that does not compete with data.
- Keep all visible text Chinese, with operational labels instead of marketing copy.
- Use crisp spacing, 8px radius cards, fine borders, soft shadows, no nested card clutter.

Avoid:
- fake fields not listed above
- decorative widgets that cannot map to current components
- oversized hero section, random charts, unreadable tiny text, placeholder lorem ipsum
- overdone gradients, neon glow, emoji, very round pill-heavy design, crowded information
