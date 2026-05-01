# Project UI Brief

- Page: M44 APIKey 外部调用
- Route: /settings
- Feature goal: 在系统设置页为外部系统发放可控 API Key，并给出 Agent 调用入口。
- Users/permissions: 租户管理员或拥有 `system:api_key:view` / `system:api_key:manage` 的运维用户；后端外部调用还要求密钥创建人拥有 `system:api_key:invoke`、`conversation:chat:manage`、`agent:agent:use`，并通过数据权限与资源 ACL。
- APIs/services: `listTenantApiKeys()` -> `GET /api-keys`；`createTenantApiKey(input)` -> `POST /api-keys`；`deleteTenantApiKey(id)` -> `DELETE /api-keys/:id`；`listAgents({ status: 'PUBLISHED' })` 用于 Agent 白名单；`getExternalAgentChatEndpoint(agentId)` 展示 `/external/agents/{agentId}/chat`。
- Entities/fields/statuses: `TenantApiKeyListItem` 包含 `name`、`masked_key`、`status`、`scopes`、`allowed_agent_ids`、`ip_allowlist`、`rate_limit_per_minute`、`daily_quota`、`used_count_today`、`allow_stream`、`expires_at`、`last_used_at`；状态沿用 `ACTIVE`、`DISABLED`、`DELETED`。
- Existing components/design system: Next.js App Router 控制台布局，Tailwind CSS，shadcn 风格 `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`，React Query + React Hook Form + Zod。
- Required states: API Key 和 Agent 列表加载、空状态、创建校验错误、后端错误、创建成功后一次性明文展示、无管理权限禁用表单、删除确认。
