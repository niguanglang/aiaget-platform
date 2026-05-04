# M63-6 企业 IM 渠道适配器

## 目标

把全渠道发布中心从“对外 API 调用”扩展到“企业 IM / Webhook 入站回调”。企业微信、钉钉、飞书、Slack 和自定义 Webhook 可以把文本消息回调到控制面，由控制面标准化为统一消息，再转交渠道绑定的 Agent 执行。

## 已完成

### 后端入口

- `GET /api/v1/external/channels/:channelId/callback`
  - 用于 URL 校验 / challenge 响应。
- `POST /api/v1/external/channels/:channelId/callback`
  - 接收企业 IM 或自定义 Webhook 入站消息。
  - 根据 `agent_publish_channel.channel` 选择适配器。
  - 校验渠道必须 `ACTIVE`，绑定 Agent 必须 `PUBLISHED`。
  - 使用渠道创建人、Agent owner 或 Agent 创建人作为回调执行用户。
  - 创建会话并调用绑定 Agent。
  - 写入 `platform_event` 和 `platform_usage_event`。
  - 更新渠道健康状态。

### 消息适配

| 渠道 | 当前支持 | 返回格式 |
| --- | --- | --- |
| 企业微信 | 明文 JSON/XML 文本消息 | `msgtype: text` |
| 钉钉 | `text.content` 文本消息 | `msgtype: text` |
| 飞书 | URL challenge、文本事件 | `msg_type: text` |
| Slack | URL challenge、文本事件 | `ok + text` |
| 自定义 Webhook | `message` / `text` / `content` / `payload.text` | `ChannelCallbackResult` |

### 签名边界

- 自定义 Webhook 默认支持 `x-aiaget-signature: sha256=<hmac>`。
- 可选 `x-aiaget-timestamp`，签名载荷兼容：
  - `JSON.stringify(body)`
  - `${timestamp}.${JSON.stringify(body)}`
- 渠道配置支持：
  - `require_aiaget_signature: true`
  - `skip_signature_check: true`
- 真实企业微信加密回调、钉钉/飞书平台原生验签需要平台 token、raw body、中间件级原文保留，当前已保留服务边界，后续可替换适配器内部校验逻辑。

### 前端

`/channels` 渠道详情新增：

- 平台回调地址
- 企业 IM 回调适配卡片
- 消息解析说明
- 签名状态
- 入站消息到 Agent 的执行说明

参考设计产物：

```text
images/frontend-reference-design/m63-6-企业-im-渠道适配器/
```

## 事件与用量

事件：

- `channel.callback.received`
- `channel.callback.completed`
- `channel.callback.failed`

用量：

- `channel_callback_messages`
- `channel_callback_tokens`
- `channel_callback_ignored`
- `channel_callback_failed`

## 下一步建议

M63-7 继续做“渠道平台原生验签与回复异步化”：

1. 在 NestJS body parser 中为 `/external/channels/:channelId/callback` 保留 raw body。
2. 实现企业微信 AES 解密与 URL 验证。
3. 实现钉钉机器人签名校验。
4. 实现飞书事件订阅 token / encrypt key 校验。
5. 对需要超时快速 ACK 的平台，把 Agent 回复改为后台任务 + 主动发送消息。
