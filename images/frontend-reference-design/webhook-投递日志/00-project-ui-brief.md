# Project UI Brief

- Page: Webhook 投递日志
- Route: /api-keys
- Feature goal: API Key 管理中心中的 Webhook 投递记录查询、状态追踪和失败重试
- Target users/permissions: 租户管理员、拥有 `system:api_key:view` 的审计/运维用户可查看；拥有 `system:api_key:manage` 的用户可重试失败记录。
- APIs/services: `listWebhookDeliveries({ api_key_id? })` 查询投递列表；`getWebhookDelivery(deliveryId)` 查看详情；`retryWebhookDelivery(deliveryId)` 重试失败投递；页面仍复用 `listTenantApiKeys()`、`createTenantApiKey()`、`deleteTenantApiKey()` 和 `getExternalApiObservability()`。
- Entities/fields/statuses: `WebhookDeliveryListItem`、`WebhookDeliveryDetail`、`WebhookDeliveryStatus`（SUCCESS/FAILED/PENDING/RETRYING）、`WebhookDeliveryEvent`、`delivery_id`、`parent_delivery_id`、`target_url`、`response_status`、`response_body`、`latency_ms`、`retry_count`、`error_message`、`delivered_at`、`created_at`、`updated_at`、`request_headers`、`payload`。
- Existing components/design system: Next.js App Router `/api-keys` 页面；复用本地 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`、`motion/react`，保持 shadcn 风格和中文文案。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
- Visual constraints: 企业后台风格，日志和重试流程优先；Webhook 状态、最近错误、响应状态、耗时和重试次数必须清晰可读；避免装饰化卡片堆叠和无关图表。
