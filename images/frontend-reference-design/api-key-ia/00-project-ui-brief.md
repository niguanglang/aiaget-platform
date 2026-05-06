# API Key 外部调用管理 IA Brief

## 项目 UI 约束

- 产品模块：AIAGET 控制台 API Key 外部调用管理。
- 路由：`/api-keys`、`/api-keys/create`、`/api-keys/observability`、`/api-keys/webhook-deliveries`、`/api-keys/webhook-deliveries/[deliveryId]`。
- 父级布局：Next App Router `src/app/(console)` 控制台页面，页面主体复用现有 `main max-w-7xl px-4 py-6` 管理后台密度。
- 用户与权限：租户管理员或拥有 `system:api_key:manage` 可创建、删除、重试；拥有 `system:api_key:view` 可查看列表、观测和投递记录。
- 服务函数：`listTenantApiKeys`、`createTenantApiKey`、`deleteTenantApiKey`、`getExternalApiObservability`、`listWebhookDeliveries`、`getWebhookDelivery`、`retryWebhookDelivery`、`listAgents`、`getExternalAgentChatEndpoint`。
- 数据实体：Tenant API Key、Agent、外部 API 观测 summary/recent_calls/quota_watch/security_denials、Webhook delivery list/detail。
- 状态：加载、空列表、接口错误、权限只读、创建校验失败、创建成功后一次性明文密钥展示、删除确认、投递重试成功/失败。
- 组件：现有 `Button`、`Card`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState` 和 lucide 图标。

## IA 目标

- `/api-keys` 只承担密钥浏览、筛选、删除和分流入口。
- `/api-keys/create` 独立承载创建表单和一次性明文密钥展示，创建成功后不自动跳转。
- `/api-keys/observability` 独立承载外部 API 调用观测，不混入创建和 Webhook 详情状态。
- `/api-keys/webhook-deliveries` 独立承载投递日志列表、过滤和进入详情。
- `/api-keys/webhook-deliveries/[deliveryId]` 独立承载投递详情和重试。
