# M63-15 渠道发布自动推进与观测门禁

## 目标

在 M63-13 灰度执行闭环和 M63-14 发布流水线基础上，为每个发布渠道增加一层“发布观测门禁”。

该门禁读取当前发布批次、灰度门控用量事件和门禁策略，判断当前批次是否：

- 可推进全量
- 需要继续观察
- 建议阻断
- 门禁关闭
- 没有可评估批次

本阶段只提供评估结论、策略配置和审计事件，不自动执行全量发布。后续如果接入 Temporal 自动推进工作流，可以读取 `auto_promote_enabled` 和评估结果继续推进。

## 范围

### 后端

- 新增渠道发布观测门禁接口：
  - `GET /channels/:channelId/release-gate`
  - `PUT /channels/:channelId/release-gate`
  - `POST /channels/:channelId/release-gate/evaluate`
- 新增共享类型：
  - `ChannelReleaseGatePolicy`
  - `ChannelReleaseGatePolicyInput`
  - `ChannelReleaseGateMetrics`
  - `ChannelReleaseGateEvaluation`
  - `ChannelReleaseGateOverview`
- 门禁策略存储在 `agent_publish_channel.config.release_gate_policy`。
- 评估指标来自平台用量事件：
  - `channel_rollout_gate_evaluated`
  - `channel_rollout_gate_allowed`
  - `channel_rollout_gate_blocked`
  - `channel_rollout_gate_bypass`
- 保存策略和手动评估写入平台事件：
  - `channel.release_gate.policy_updated`
  - `channel.release_gate.evaluated`

### 前端

- 在 `/channels` 全渠道发布中心中新增“渠道发布自动推进与观测门禁”面板。
- 面板位于“渠道发布流水线与发布批次”之后、“渠道投递后台任务”之前。
- 支持：
  - 查看门禁结论
  - 查看样本量、放行率、拦截数
  - 配置门禁开关、最小样本量、最低放行率、最大拦截数、观测窗口
  - 配置后续自动推进策略开关
  - 手动触发一次评估
  - 查看最近门禁事件

## 策略字段

```text
enabled                  是否启用观测门禁
min_evaluated_count      最小评估样本量
min_allowed_rate         最低放行率
max_blocked_count        最大允许拦截数
auto_promote_enabled     后续自动推进策略开关
observation_window_hours 观测窗口小时数
```

默认策略：

```text
enabled = true
min_evaluated_count = 50
min_allowed_rate = 80
max_blocked_count = 20
auto_promote_enabled = false
observation_window_hours = 24
```

## 门禁结论

```text
PROMOTE_READY  可推进全量
OBSERVE        继续观察
BLOCKED        建议阻断
DISABLED       门禁关闭
NO_BATCH       无批次
```

## 权限

- 查看门禁：`channel:publish:view`
- 保存策略：`channel:publish:manage`
- 资源范围：继续复用渠道资源 ACL、数据权限和安全策略 Guard。

## 验收标准

- 选择渠道后能看到当前发布观测门禁。
- 没有批次时显示“无批次”结论。
- 保存策略后前端刷新门禁、流水线、灰度门控和渠道概览缓存。
- 手动评估后写入平台事件，并能在最近门禁事件中查看。
- 未授权用户只能查看，不能保存策略。
- 不新增数据库表或字段。
