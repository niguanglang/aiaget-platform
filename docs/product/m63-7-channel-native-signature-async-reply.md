# M63-7 渠道原生验签与异步回复

## 目标

在 M63-6 企业 IM 回调适配器基础上，补齐企业渠道真实接入需要的 raw body、原生验签/解密和快速 ACK 能力。默认仍保持同步回复，只有渠道配置显式开启异步时才快速返回。

## 已完成

### Raw Body 保留

控制面 `main.ts` 已在 Express body parser 层保留 `request.rawBody`：

- `application/json`
- `application/x-www-form-urlencoded`
- `application/xml`
- `text/xml`
- `text/plain`

XML / text 回调会进入统一 callback controller，不再被 JSON parser 拦截。

### 企业微信

支持：

- `msg_signature` / `timestamp` / `nonce` 校验
- URL 校验 `echostr` 解密
- XML 中 `Encrypt` 密文解密
- AES-256-CBC + PKCS#7 unpad
- 解密后继续按明文 XML/JSON 文本消息解析

配置：

```json
{
  "wechat_work_token": "企业微信回调 Token",
  "wechat_work_encoding_aes_key": "企业微信 EncodingAESKey"
}
```

敏感配置推荐放入“渠道密钥”，以 JSON 字符串加密保存：

```json
{
  "wechat_work_token": "...",
  "wechat_work_encoding_aes_key": "..."
}
```

### 钉钉

支持：

- `timestamp`
- `sign`
- `HMAC-SHA256(timestamp + \"\\n\" + secret)` base64 校验

配置：

```json
{
  "dingtalk_sign_secret": "钉钉加签 secret"
}
```

也可以放入渠道密钥：

```json
{
  "dingtalk_sign_secret": "..."
}
```

### 飞书

支持：

- `token` / `header.token` 校验
- `X-Lark-Signature` / `X-Lark-Request-Timestamp` / `X-Lark-Request-Nonce` 来源校验
- `encrypt` 事件体解密
- Encrypt Key SHA-256 派生 AES-256-CBC key
- 解密后继续按飞书事件文本消息解析

配置：

```json
{
  "feishu_verification_token": "飞书 Verification Token",
  "feishu_encrypt_key": "飞书 Encrypt Key"
}
```

也可以放入渠道密钥：

```json
{
  "feishu_verification_token": "...",
  "feishu_encrypt_key": "..."
}
```

### 自定义 Webhook

继续支持：

- `x-aiaget-signature: sha256=<hmac>`
- 可选 `x-aiaget-timestamp`
- raw body 签名校验

### 回调重放防护

签名校验通过后，控制面会在创建回调回复和会话前做 10 分钟重放窗口检查：

- 优先使用平台原生签名或 `x-aiaget-signature` 构造 `channel_callback_replay:<channel_id>:<signature>`。
- 没有签名上下文时，使用 provider、渠道 ID 和外部事件 / 消息 ID 构造幂等键。
- 首次接收成功的 `channel.callback.received` 会写入同一 `dedupeKey`。
- 窗口内重复请求会被拒绝，并记录 `channel.callback.replay_blocked`，不会创建重复 `channel_reply`、会话或 Agent 运行。

### 快速 ACK / 异步执行与主动回复

默认同步执行并返回 Agent 回复。

开启异步：

```json
{
  "reply_mode": "ASYNC"
}
```

或：

```json
{
  "ack_immediately": true
}
```

开启后：

1. 回调入口先返回平台格式的“已接收”响应。
2. Agent 执行在后台继续。
3. 平台事件会记录：
   - `channel.callback.received`
   - `channel.callback.async_completed`
4. 用量会记录：
   - `channel_callback_async_accepted`
   - `channel_callback_messages`
   - `channel_callback_tokens`

主动回复缺口已由后续 Channel Sender 收口：异步执行完成后会按渠道发送回原始会话或 fallback webhook，并记录 Sender 投递、重试和审计事件。M63-8 落地发送网关，M171 进一步补齐 `sender_mode`、`provider_api` 和脱敏观测字段，确保主动回复链路可以按平台 API 排障。

## 验证

- `pnpm --filter @aiaget/control-api typecheck`
- `pnpm --filter @aiaget/control-api exec tsx --test src/external-api/external-channel-security.test.ts`
- `pnpm --filter @aiaget/control-api exec tsx --test src/external-api/external-channel-sender.service.test.ts`

## 后续关联

- M63-8：Channel Sender 主动回复网关，覆盖企业微信、钉钉、飞书、Slack 和自定义 Webhook 主动发送。
- M171：Channel Native Sender Observability，明确原生 API / webhook fallback 的观测字段和敏感信息边界。

因此本页中的 raw body、原生验签、解密、快速 ACK 是回调入口能力；主动回复发送、投递审计和重试能力以 Channel Sender 文档为准。
