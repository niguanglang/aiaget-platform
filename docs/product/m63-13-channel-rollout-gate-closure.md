# M63-13 渠道灰度执行闭环

## 目标

把 M63-12 中保存的渠道灰度比例接入真实执行链路，让外部 API、流式调用、会话续聊和企业 IM / Webhook 回调都经过同一套灰度门控。

## 后端能力

- 新增 `ExternalChannelRolloutGateService`。
- 门控配置复用 `agent_publish_channel.config.publish_control`：
  - `approval_required`
  - `approval_status`
  - `rollout_enabled`
  - `rollout_percentage`
  - `rollout_status`
- 覆盖调用入口：
  - `POST /api/v1/external/channels/:channelId/chat`
  - `POST /api/v1/external/channels/:channelId/chat/stream`
  - `POST /api/v1/external/channels/:channelId/conversations/:conversationId/messages`
  - `POST /api/v1/external/channels/:channelId/conversations/:conversationId/messages/stream`
  - `POST /api/v1/external/channels/:channelId/callback`
- 灰度判断逻辑：
  - 渠道不可用：拦截
  - 审批开启但未通过：拦截
  - 灰度关闭：放行
  - 灰度 100%：放行
  - 灰度 1-99%：按渠道 ID + 稳定来源键计算 0-99 桶位，命中比例则放行，否则拦截
- 每次评估写入平台事件：
  - `channel.rollout_gate.allowed`
  - `channel.rollout_gate.blocked`
- 每次评估写入平台用量：
  - `channel_rollout_gate_evaluated`
  - `channel_rollout_gate_allowed`
  - `channel_rollout_gate_blocked`
  - `channel_rollout_gate_bypass`

## API

```text
GET /api/v1/channels/:channelId/rollout-gate/overview
```

权限：

```text
channel:publish:view
```

接口同时经过 DataScopeGuard、ResourceAclGuard 和 SecurityPolicyGuard。

## 前端

在 `/channels` 新增「渠道灰度执行闭环」面板：

- 指标：
  - 门控状态
  - 配置比例
  - 24h 评估
  - 实测放行率
- 最近门控决策：
  - 放行 / 拦截
  - 决策原因
  - 稳定桶位
  - 调用来源
  - 评估时间
  - Trace
- 配置比例与实测放行率：
  - 配置灰度比例进度条
  - 24h 实测放行率进度条
  - 放行、拦截、免灰度统计

参考设计产物：

```text
images/frontend-reference-design/m63-13-渠道灰度执行闭环/
```

## 注意

- 本模块不新增数据库表，不执行迁移。
- 灰度门控使用确定性桶位，不依赖 Redis 或新中间件。
- IM/Webhook 回调未命中灰度时返回正常响应并记录拦截，避免企业平台反复重试。
- 多实例部署无需共享内存状态，因为桶位计算只依赖渠道 ID 和稳定来源键。
