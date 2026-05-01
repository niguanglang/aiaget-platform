Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / 设置中心 / API Key 外部调用
- Page/route: 设置中心 at `/settings`
- Target users/roles: 租户管理员、平台运维人员、拥有 API Key 管理权限的企业管理员
- Business goal: 发放可审计、可限流、可绑定 Agent 的外部调用密钥，让服务端系统用 API Key 调用企业 Agent
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui style components, Card, Button, StatusBadge, MetricCard, EmptyState
- Existing page shell/layout: enterprise SaaS console, left navigation + topbar, white cards, subtle borders, soft shadows, dense but readable dashboard layout

Interface contract that must appear in the UI:
- API/service functions: `GET /api-keys`, `POST /api-keys`, `DELETE /api-keys/:id`, `GET /agents?status=PUBLISHED`, external endpoint `/external/agents/{agentId}/chat`
- Main entities and fields: API Key name, masked key, status, scopes, allowed agent ids, IP allowlist, rate limit per minute, daily quota, used count today, allow stream, expires at, last used at
- Status values/enums: ACTIVE 启用, DISABLED 停用, DELETED 已删除
- User actions: create key, select allowed Agents, configure scopes, configure IP allowlist, configure rate limit and daily quota, copy external endpoint, delete key, view created plaintext once
- Required states: loading, empty, error, validation, disabled, success, permission-denied where relevant

Design requirements:
- Make it look like a production SaaS/admin product, not a generic landing page.
- Use the project's existing data fields and actions; do not invent unrelated modules.
- Show the primary workflow clearly: configure external call policy -> create API Key -> copy one-time key and endpoint -> monitor key usage.
- Include realistic table/card/form/detail areas based on the interface contract.
- Use a coherent component system: settings card, endpoint copy strip, form controls, multi-select, text area, status badges, key list, delete action.
- Keep visual language minimal, technical, premium, clean, with Chinese labels.
- Use subtle borders, soft shadows, glass-like card surfaces, restrained motion hints, and no excessive gradients.
- Emphasize hierarchy, spacing, alignment, and operational clarity.
- Output should be a product UI design reference image suitable for frontend implementation.

Avoid:
- fake API fields not listed above
- decorative UI that cannot map to project components
- unreadable tiny text, random charts, placeholder lorem ipsum
- inconsistent actions or states
- Emoji, cheap glow, oversized rounded blobs, over-filled information
