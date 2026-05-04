# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 Agent 平台 / API Key 管理中心
- Page/route: API Key 管理中心 at `/api-keys`
- Target users/roles: 租户管理员、安全管理员、系统管理员、外部集成负责人；查看权限 `system:api_key:view`，管理权限 `system:api_key:manage`
- Business goal: 管理外部系统调用企业 Agent 的机器密钥，控制允许 Agent、调用范围、限流、日额度、IP 白名单、流式权限和过期时间。
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui style local components, React Query, React Hook Form, Zod, lucide icons, motion.
- Existing page shell/layout: Console shell with sidebar/topbar already exists. Page content should be a dense enterprise SaaS admin screen using constrained max width, cards, metric tiles, table/list, right-side detail/guidance panel.

Interface contract that must appear in the UI:
- API/service functions: `listTenantApiKeys`, `createTenantApiKey`, `deleteTenantApiKey`, `listAgents`, `getExternalAgentChatEndpoint`
- Main entities and fields: API key name, masked key, status, scopes, allowed agent ids, IP allowlist, rate limit per minute, daily quota, used count today, quota reset date, allow stream, expires at, last used at, created at
- Status values/enums: `ACTIVE`, `DISABLED`, `DELETED`; quota risk states derived in UI: 正常、预警、高危、未设额度
- User actions: refresh, copy endpoint, copy one-time key, create key, choose allowed Agent list, edit form inputs, delete key with confirmation, filter by keyword/status/risk
- Required states: loading, empty, error, validation, disabled, success, permission-denied where relevant

Design requirements:
- Make it look like a real production admin product, not a generic landing page.
- Use Bento/Dashboard layout: top operational header, metric cards, endpoint card, create-key form, key list, quota/risk guidance.
- Use subtle borders, soft shadows, backdrop blur, restrained gradient mesh/noise feel without excessive glow.
- Use Chinese UI copy only.
- Show the primary workflow clearly: operator reviews endpoint, creates a scoped key, immediately saves the one-time plaintext key, monitors quota and deletes risky keys.
- Include realistic table/list rows with masked keys, Agent scope, IP scope, quota, stream flag and last-used timestamps.
- Use consistent enterprise product visual language: clean white surface, neutral text, blue accent, compact controls, readable hierarchy.

Avoid:
- fake backend fields not listed above
- invented update/revoke endpoints
- decorative widgets that cannot map to the existing components
- unreadable tiny text, random charts, placeholder lorem ipsum
- emojis, exaggerated gradients, cheap glow, overly rounded card stacks
