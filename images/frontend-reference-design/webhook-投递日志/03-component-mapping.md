# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面壳与标题区 | `apps/web/src/components/api-keys/api-key-content.tsx` | `/api-keys` route | 复用现有页面，不新增路由 |
| 汇总指标 | `MetricCard` | `listWebhookDeliveries`、`getExternalApiObservability` | 追加投递数量、成功率、失败数、平均耗时 |
| 过滤工具条 | `Input`、`select`、`Button` | `listWebhookDeliveries({ api_key_id })` | 搜索投递 ID、按 API Key 过滤 |
| 投递列表 | `Card` 内部表格/列表 | `WebhookDeliveryListItem` | 显示状态、响应码、耗时、重试次数、错误摘要 |
| 详情面板 | `Card` 或右侧面板 | `WebhookDeliveryDetail`、`getWebhookDelivery` | 展示 payload、请求头、响应正文和父级重试链路 |
| 重试操作 | `Button` | `retryWebhookDelivery` | 仅失败投递可重试 |
| 反馈状态 | `EmptyState`、加载骨架、错误条 | React Query 状态 | 需要中文空状态和权限态 |
