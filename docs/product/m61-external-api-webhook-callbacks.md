# M61 External API Webhook Callbacks

## 目标

为外部 API 调用补齐运行完成通知能力。第三方系统创建 API Key 时可以配置 Webhook 地址，Agent 调用完成后平台异步 POST `agent.run.completed` 事件，便于外部系统落库、触发后续流程或做审计对账。

## 完成范围

- `api_key` 增加 Webhook 配置字段：启用状态、回调地址、订阅事件、签名密钥密文、最近投递状态、最近错误、最近投递时间。
- 迁移 SQL 和 `scripts/postgres_comments.sql` 已补充表/字段中文注释。
- 外部 API 的普通调用、续聊、流式调用、流式续聊完成后都会触发异步 Webhook。
- 回调失败不阻塞外部 API 主响应，失败原因写入 API Key 最近投递状态，并记录 `external_webhook deliver` 操作日志。
- 回调请求支持 HMAC 签名，头部包含 `x-aiaget-event`、`x-aiaget-delivery-id`、`x-aiaget-timestamp`、`x-aiaget-signature`。
- API Key 管理中心新增中文 Webhook 配置表单、启用数量指标、密钥行投递状态展示和治理说明。
- SDK 增加 Webhook 签名生成/校验辅助函数说明。

## Webhook 事件

```json
{
  "id": "evt_xxx",
  "event": "agent.run.completed",
  "created_at": "2026-05-01T00:00:00.000Z",
  "tenant_id": "tenant-id",
  "api_key_id": "api-key-id",
  "api_key_prefix": "ak_xxx",
  "agent_id": "agent-id",
  "conversation_id": "conversation-id",
  "run_id": "run-id",
  "trace_id": "trace-id",
  "status": "SUCCESS",
  "result": {}
}
```

## 验收点

- 创建 API Key 时启用 Webhook 必须填写合法 HTTP/HTTPS URL。
- 配置签名密钥后，投递请求包含 `sha256=<hmac>` 签名。
- 接收方返回非 2xx 或请求超时，API Key 列表能看到最近投递失败状态和错误摘要。
- 外部 API 调用响应不因 Webhook 失败而失败。
