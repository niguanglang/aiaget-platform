# M62 Webhook Delivery Retry Center

## 目标

在 API Key 管理中心中增加 Webhook 投递日志与重试中心，支持查看外部调用完成后的投递记录、响应状态、失败原因和重试链路。

## 完成范围

- 复用 `/api-keys` 页面，不新增路由。
- 增加投递日志列表、筛选、详情和重试入口。
- 展示投递 ID、父级投递 ID、API Key、目标地址、状态、响应码、响应正文、请求头、payload、耗时和重试次数。
- 失败投递支持重新发送，成功与失败状态都会写回 API Key 最近投递状态。
- 页面所有可见文案保持中文。

## 接口

- `GET /api-keys/webhook-deliveries`
- `GET /api-keys/webhook-deliveries/:deliveryId`
- `POST /api-keys/webhook-deliveries/:deliveryId/retry`

## 验收点

- 可以按 API Key 过滤投递日志。
- 可以查看单条投递详情和 payload。
- 失败投递可以重试。
- 空状态、加载状态、错误状态和无权限状态都有中文展示。
