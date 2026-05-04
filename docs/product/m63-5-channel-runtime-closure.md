# M63-5 渠道运行闭环

## 目标

让 M63-4 的发布渠道从“可配置、可观测”继续前进到“可被外部系统真实调用”，并把调用结果归因到具体发布渠道。

## 新增入口

新增外部渠道调用 API：

```text
POST /external/channels/:channelId/chat
POST /external/channels/:channelId/chat/stream
POST /external/channels/:channelId/conversations/:conversationId/messages
POST /external/channels/:channelId/conversations/:conversationId/messages/stream
```

这些入口复用现有外部 Agent 调用能力，仍然使用租户 API Key 鉴权。

## 校验链路

渠道入口执行以下校验：

```text
1. 渠道存在且未删除
2. 渠道状态必须为 ACTIVE
3. 关联 Agent 必须为 PUBLISHED
4. API Key 必须有效、未过期、允许流式策略匹配
5. API Key scope 必须包含 external:agent:chat 或 external:agent:stream
6. API Key Agent 白名单必须允许该渠道绑定的 Agent
7. IP 白名单、分钟限流、日额度继续生效
8. 创建者用户必须具备 system:api_key:invoke、conversation:chat:manage、agent:agent:use
9. Agent 数据权限和资源授权继续生效
10. CHANNEL 数据权限和 Resource ACL 继续生效
11. 续聊时校验会话归属当前 Agent 和租户
```

## 事件与用量

每次渠道调用完成后写入：

```text
platform_event.resourceType = CHANNEL
platform_event.resourceId = channelId
platform_event.channelId = channelId
platform_event.agentId = agentId
platform_event.conversationId = conversationId
platform_event.runId = runId
```

并写入渠道用量：

```text
metricType = channel_external_requests
unit = request

metricType = channel_external_tokens
unit = token
```

这样 M63-4 发布中心的 24h 请求量、成功率、最近事件可以从真实渠道调用中产生。

## 前端联动

`/channels` 渠道详情增加：

```text
渠道调用地址
渠道流式地址
```

用于外部系统按渠道接入，而不是只按 Agent 接入。

## 验证

已通过：

```text
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```

## 后续

真实企业微信、钉钉、飞书回调协议还需要新增平台适配器，包括验签、消息格式转换、机器人响应协议和渠道密钥轮换。
