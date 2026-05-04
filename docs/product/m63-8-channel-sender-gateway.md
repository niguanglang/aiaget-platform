# M63-8 Channel Sender 主动回复网关

## 目标

在 M63-7 的快速 ACK / 异步执行基础上，把 Agent 执行完成后的回复主动发回企业 IM 或外部系统。这样企业微信、钉钉、飞书、Slack、自定义 Webhook 不必依赖同步 HTTP 响应等待模型执行完成。

## 已完成

### 独立 Sender Service

新增：

```text
apps/control-api/src/external-api/external-channel-sender.service.ts
```

职责：

- 根据渠道类型选择发送器。
- 读取 `agent_publish_channel.config` 和加密后的渠道密钥。
- 调用企业 IM / Webhook 发送接口。
- 记录平台事件和用量。
- 对响应体做敏感字段脱敏。
- 默认超时 `15000ms`，支持 `sender_timeout_ms` 配置。

### 已接入渠道

| 渠道 | 主动回复方式 |
| --- | --- |
| 企业微信 | 应用消息 `cgi-bin/message/send` |
| 钉钉 | `sessionWebhook` 或自定义机器人 webhook |
| 飞书 | 机器人 webhook 或 `im/v1/messages` |
| Slack | incoming webhook 或 `chat.postMessage` |
| 自定义 Webhook | `sender_webhook_url` / `webhook_url` / `callback_url` |

### 回调闭环

`ExternalChannelCallbackService` 在 Agent 执行完成后调用 Sender：

- `reply_mode: "ASYNC"` 或 `ack_immediately: true`：
  - 回调请求先快速返回。
  - Agent 后台执行。
  - 执行完成后主动发送回复。
- `send_sync_reply: true`：
  - 同步响应仍返回。
  - 额外主动发送一份回复。

### 事件与用量

事件：

- `channel.sender.sent`
- `channel.sender.skipped`
- `channel.sender.failed`

用量：

- `channel_sender_messages`
- `channel_sender_skipped`
- `channel_sender_failed`

## 配置示例

### 企业微信

渠道密钥推荐保存：

```json
{
  "wechat_work_corp_id": "...",
  "wechat_work_corp_secret": "...",
  "wechat_work_agent_id": "1000002",
  "wechat_work_token": "...",
  "wechat_work_encoding_aes_key": "..."
}
```

也支持直接配置长期 `wechat_work_access_token`，但不推荐。

### 钉钉

钉钉回调里如果有 `sessionWebhook` 会优先使用；否则使用：

```json
{
  "sender_webhook_url": "https://oapi.dingtalk.com/robot/send?access_token=...",
  "dingtalk_sign_secret": "..."
}
```

### 飞书

机器人 webhook：

```json
{
  "sender_webhook_url": "https://open.feishu.cn/open-apis/bot/v2/hook/..."
}
```

API 发送：

```json
{
  "feishu_receive_id_type": "chat_id",
  "feishu_default_receive_id": "...",
  "feishu_tenant_access_token": "..."
}
```

### Slack

Webhook：

```json
{
  "sender_webhook_url": "https://hooks.slack.com/services/..."
}
```

API 发送：

```json
{
  "slack_bot_token": "xoxb-...",
  "slack_default_channel_id": "C..."
}
```

### 自定义 Webhook

```json
{
  "sender_webhook_url": "https://example.com/agent/reply",
  "sender_secret": "..."
}
```

## 后续建议

M63-9 可以做“Sender 投递中心”：

1. 新增 `channel_sender_delivery` 表，持久化每次投递。
2. 支持失败重试、手动重试、退避策略。
3. 前端展示发送日志和失败原因。
4. 将主动回复发送放入 Temporal 或后台任务队列。
