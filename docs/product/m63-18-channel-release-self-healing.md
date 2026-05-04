# M63-18 渠道发布回滚与失败自愈

## 目标

在 M63-16 自动推进和 M63-17 Temporal 工作流边界之后，增加渠道发布后的失败自愈能力。

自愈模块负责在渠道全量发布后，根据渠道健康、错误请求、放行率和最近自动推进结果判断是否需要回滚。第一版默认演练模式，不会自动真实回滚，真实回滚复用现有发布控制里的稳定配置。

## 范围

### 后端

- 新增接口：
  - `GET /channels/:channelId/release-self-healing`
  - `PUT /channels/:channelId/release-self-healing`
  - `POST /channels/:channelId/release-self-healing/run`
- 新增共享类型：
  - `ChannelReleaseSelfHealingPolicy`
  - `ChannelReleaseSelfHealingPolicyInput`
  - `ChannelReleaseSelfHealingMetrics`
  - `ChannelReleaseSelfHealingEvaluation`
  - `ChannelReleaseSelfHealingRunResult`
  - `ChannelReleaseSelfHealingOverview`
- 策略和最近运行结果保存于渠道 `config`：
  - `release_self_healing_policy`
  - `release_self_healing_last_run`
  - `release_self_healing_runs`
- 平台事件：
  - `channel.release_self_healing.policy_updated`
  - `channel.release_self_healing.healthy`
  - `channel.release_self_healing.observe`
  - `channel.release_self_healing.rollback_recommended`
  - `channel.release_self_healing.rolled_back`
  - `channel.release_self_healing.skipped`
  - `channel.release_self_healing.disabled`
  - `channel.release_self_healing.failed`

### 前端

- 在 `/channels` 新增“渠道发布回滚与失败自愈”面板。
- 面板位于自动推进执行器之后。
- 支持：
  - 查看自愈结论
  - 查看错误请求、放行率、最近结果
  - 保存自愈策略
  - 手动执行一次自愈
  - 查看最近自愈事件

## 策略字段

```text
enabled                  是否启用自愈
dry_run                  是否演练模式
auto_rollback_enabled    是否允许自动回滚
max_error_requests       最大错误请求数
min_allowed_rate         最低放行率
observation_window_hours 观测窗口
cooldown_minutes         自愈冷却时间
```

默认策略：

```text
enabled = false
dry_run = true
auto_rollback_enabled = false
max_error_requests = 10
min_allowed_rate = 90
observation_window_hours = 24
cooldown_minutes = 30
```

## 判断逻辑

```text
1. 自愈未启用：DISABLED
2. 最近没有成功自动推进：OBSERVE
3. 渠道状态 ERROR 或健康 UNAVAILABLE：ROLLBACK_RECOMMENDED
4. 错误请求超过阈值：ROLLBACK_RECOMMENDED
5. 放行率低于阈值：ROLLBACK_RECOMMENDED
6. 无观测样本：OBSERVE
7. 其他情况：HEALTHY
```

执行一次自愈时：

```text
1. 命中冷却期：SKIPPED
2. 不建议回滚：HEALTHY / OBSERVE
3. 建议回滚但无回滚点：FAILED
4. 建议回滚但未允许自动回滚：ROLLBACK_RECOMMENDED
5. 演练模式：ROLLBACK_RECOMMENDED
6. 允许自动回滚且非演练：ROLLED_BACK
```

## 权限

- 查看：`channel:publish:view`
- 保存策略：`channel:publish:manage`
- 执行一次：`channel:publish:deploy`

继续复用 DataScopeGuard、ResourceAclGuard 和 SecurityPolicyGuard。

## 边界

- 不新增数据库表或字段。
- 不创建中间件容器。
- 不运行数据库迁移。
- 真实回滚复用已有 `rollbackPublish` 和 `publish_control.last_stable_config`。

## 验收标准

- 选择渠道后能看到自愈策略和评估结论。
- 保存策略后刷新自愈、自动推进、门禁、流水线、发布控制、渠道概览缓存。
- 演练模式下命中回滚条件不会真实回滚。
- 非演练、允许自动回滚且回滚点可用时，执行一次会回滚到稳定配置。
- 执行结果和策略更新写入平台事件。
