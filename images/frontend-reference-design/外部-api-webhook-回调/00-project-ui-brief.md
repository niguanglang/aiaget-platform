# Project UI Brief

- Page: 外部 API Webhook 回调
- Route: /api-keys
- Feature goal: API Key 管理中心配置外部调用完成通知
- Target users/permissions: 租户管理员、拥有 `system:api_key:manage` 权限的系统管理员可创建和删除密钥；其他用户只读查看。
- APIs/services: `listTenantApiKeys()` 获取密钥列表；`createTenantApiKey(input)` 创建密钥；`deleteTenantApiKey(id)` 删除密钥；`getExternalApiObservability({ window })` 查看外部调用观测；`getExternalAgentChatEndpoint(agentId?)` 展示调用地址。
- Entities/fields/statuses: `TenantApiKeyListItem` 包含 `name`、`masked_key`、`status`、`scopes`、`allowed_agent_ids`、`ip_allowlist`、`rate_limit_per_minute`、`daily_quota`、`used_count_today`、`allow_stream`、`webhook_enabled`、`webhook_url`、`webhook_events`、`webhook_secret_configured`、`webhook_last_status`、`webhook_last_error`、`webhook_last_sent_at`、`expires_at`、`last_used_at`、`created_at`。
- Webhook contract: 创建 API Key 时可配置 `webhook_enabled`、`webhook_url`、`webhook_events=['agent.run.completed']`、`webhook_secret`；后端完成外部 Agent 调用后异步 POST 回调，带 `x-aiaget-event`、`x-aiaget-delivery-id`、`x-aiaget-timestamp`、可选 `x-aiaget-signature`。
- Existing components/design system: Next.js App Router 路由 `/api-keys`；复用 `ApiKeyContent`；组件库为 Tailwind CSS + shadcn 风格本地组件 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`；动效使用 `motion/react`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
- Visual constraints: 企业级控制台，中文文案，信息密度适中；使用细边框、轻阴影、背景轻渐变、Bento/Dashboard 区块；不要新增路由或破坏现有 API Key、观测区、密钥清单结构。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
