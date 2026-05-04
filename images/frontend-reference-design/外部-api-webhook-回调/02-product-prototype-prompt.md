# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the enterprise Agent Platform API Key page.

Project context:
- Page/route: 外部 API Webhook 回调 at `/api-keys`
- Users/roles: 租户管理员和拥有 `system:api_key:manage` 权限的用户可配置；其他用户只读
- Main task flow: 用户进入 API Key 管理中心 -> 查看指标和调用入口 -> 创建受控密钥 -> 启用 Webhook -> 填写回调 URL 和签名密钥 -> 创建后复制明文密钥 -> 在密钥清单查看最近 Webhook 投递状态
- API/service contract: `listTenantApiKeys`、`createTenantApiKey`、`deleteTenantApiKey`、`getExternalApiObservability`、`getExternalAgentChatEndpoint`
- Data entities and fields: `TenantApiKeyListItem` with API Key fields and Webhook fields `webhook_enabled`、`webhook_url`、`webhook_events`、`webhook_secret_configured`、`webhook_last_status`、`webhook_last_error`、`webhook_last_sent_at`
- Actions and states: 搜索、筛选、创建、复制、删除、刷新；loading、empty、error、validation、disabled、success、permission-denied

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Preserve existing `/api-keys` information architecture: title toolbar, metrics, endpoint card, create form, observability section, key list, governance side panel.
- Make component boundaries obvious: Webhook advanced settings inside create form, delivery status inside row details, signature explanation in governance side panel.
- Show Chinese section labels and key field names.
- Include validation placeholders for missing Webhook URL when enabled and disabled form state without permission.
- Avoid invented navigation, unrelated charts, or unsupported edit flows.
