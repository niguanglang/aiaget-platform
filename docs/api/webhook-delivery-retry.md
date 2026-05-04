# Webhook 投递日志与重试

## 路由

- `GET /api-keys/webhook-deliveries`
- `GET /api-keys/webhook-deliveries/:deliveryId`
- `POST /api-keys/webhook-deliveries/:deliveryId/retry`

## 能力

- 查询 API Key 的 Webhook 投递记录。
- 查看单条投递的 payload、请求头、响应正文和重试链路。
- 对失败投递执行重试。

## 返回字段

- `delivery_id`
- `parent_delivery_id`
- `api_key_id`
- `api_key_name`
- `api_key_prefix`
- `event`
- `target_url`
- `status`
- `response_status`
- `latency_ms`
- `retry_count`
- `error_message`
- `delivered_at`
- `created_at`
- `updated_at`
- `request_headers`
- `payload`

## 说明

该能力复用 API Key 管理中心 `/api-keys` 页面，不新增独立导航。
