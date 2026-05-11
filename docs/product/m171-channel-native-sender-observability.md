# M171 Channel Native Sender Observability

## 目标

M171 补齐渠道主动回复的发布前 P1 观测增强：平台事件需要明确区分原生 API 和 webhook 发送模式，标识实际 provider API，并继续保证 token、签名、Authorization 等敏感信息不进入审计 payload。

## 审计字段

主动回复事件 `channel.sender.sent`、`channel.sender.skipped`、`channel.sender.failed` 的 `payloadJson` 增加：

- `sender_mode`: `NATIVE_API`、`WEBHOOK`、`SKIPPED`
- `provider_api`: 具体 provider API，例如 `WECHAT_WORK_MESSAGE_SEND`、`DINGTALK_SESSION_WEBHOOK`、`FEISHU_IM_MESSAGE`、`FEISHU_BOT_WEBHOOK`、`SLACK_CHAT_POST_MESSAGE`、`SLACK_INCOMING_WEBHOOK`、`CUSTOM_WEBHOOK`
- `diagnostic`: skipped 时写入中文排障原因，其他状态为 `null`

`ChannelSenderDeliveryListItem` 同步暴露 `sender_mode` 和 `provider_api`，由投递 provider、状态和脱敏后的请求 URL 推导，避免把观测字段塞进真实请求体影响重试。

## 凭据边界

发送请求和响应审计仍走统一脱敏：

- URL 查询参数中的 `token`、`signature`、`access_token` 等会被替换为 `[REDACTED]`
- 请求头中的 `Authorization`、签名、Cookie 不落库
- 响应体中的 token、secret、signing key 会脱敏
- retry 仍拒绝使用已脱敏的凭据重放，避免用审计副本误发

## 缺配置诊断

缺配置导致 skipped 时，事件 payload 保留 `sender_mode='SKIPPED'`、对应 `provider_api` 和中文诊断：

- 企业微信：`WECHAT_WORK_MESSAGE_SEND`，提示 access_token/agent_id 配置
- 钉钉：`DINGTALK_SESSION_WEBHOOK`，提示 sessionWebhook/sender webhook 配置
- 飞书：`FEISHU_IM_MESSAGE`，提示 token/receive_id 配置
- Slack：`SLACK_CHAT_POST_MESSAGE`，提示 bot token/channel 配置
- 自定义 Webhook：`CUSTOM_WEBHOOK`，提示 sender_webhook_url/webhook_url/callback_url 配置

## Fallback API 验收

当主动回复走 fallback webhook 而不是平台原生发送接口时，观测字段必须保留真实发送形态：

- 飞书优先使用回调 `response_url`、`sender_webhook_url` 或 `webhook_url` 时，`sender_mode='WEBHOOK'`，`provider_api='FEISHU_BOT_WEBHOOK'`
- Slack 优先使用回调 `response_url`、`sender_webhook_url` 或 `webhook_url` 时，`sender_mode='WEBHOOK'`，`provider_api='SLACK_INCOMING_WEBHOOK'`
- 缺少 fallback webhook 且缺少原生 API 必需配置时，事件进入 `channel.sender.skipped`，`sender_mode='SKIPPED'`，`provider_api` 仍指向对应平台原生缺口，例如 `FEISHU_IM_MESSAGE` 或 `SLACK_CHAT_POST_MESSAGE`

这些字段可直接用于监控中心按模式、平台 API 和诊断原因聚合排障。
