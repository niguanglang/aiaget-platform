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

### 快速 ACK / 异步执行骨架

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

当前异步骨架还没有实现各 IM 平台“主动发送消息” API，后台执行结果会进入平台会话、事件和用量账本。后续可以在 Tool Gateway 或 Channel Sender 中补齐主动回复。

## 验证

- `pnpm --filter @aiaget/control-api typecheck`

## 后续建议

M63-8 可以做“Channel Sender 主动回复网关”：

1. 新增渠道发送器接口。
2. 企业微信、钉钉、飞书分别实现主动发送文本消息。
3. 异步执行完成后投递到原始会话。
4. 记录发送日志、重试、失败告警。
