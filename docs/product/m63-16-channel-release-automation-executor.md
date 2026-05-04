# M63-16 渠道自动推进执行器

## 目标

在 M63-15 渠道发布观测门禁基础上，增加“自动推进执行器”。

执行器负责在门禁结论为 `PROMOTE_READY` 时，将当前发布批次推进到全量发布。第一版先提供手动触发、演练模式、频率限制和审计事件，后续可以迁移到 Temporal 定时工作流。

## 范围

### 后端

- 新增接口：
  - `GET /channels/:channelId/release-automation`
  - `PUT /channels/:channelId/release-automation`
  - `POST /channels/:channelId/release-automation/run`
- 新增共享类型：
  - `ChannelReleaseAutomationPolicy`
  - `ChannelReleaseAutomationPolicyInput`
  - `ChannelReleaseAutomationRunResult`
  - `ChannelReleaseAutomationOverview`
- 执行器策略和最近运行结果保存于 `agent_publish_channel.config`：
  - `release_automation_policy`
  - `release_automation_last_run`
  - `release_automation_runs`
- 执行事件写入平台事件：
  - `channel.release_automation.policy_updated`
  - `channel.release_automation.promoted`
  - `channel.release_automation.skipped`
  - `channel.release_automation.blocked`
  - `channel.release_automation.disabled`
  - `channel.release_automation.failed`

### 前端

- 在 `/channels` 新增“渠道自动推进执行器”面板。
- 面板位于“渠道发布自动推进与观测门禁”之后。
- 支持：
  - 查看执行器状态
  - 查看门禁结论
  - 查看今日执行次数
  - 查看最近执行结果
  - 保存执行策略
  - 手动执行一次
  - 查看最近执行事件

## 执行策略字段

```text
enabled                     是否启用执行器
require_auto_promote_policy 是否要求观测门禁允许后续自动推进
min_interval_minutes        最小执行间隔
max_runs_per_day            每日执行上限
dry_run                     演练模式
```

默认策略：

```text
enabled = false
require_auto_promote_policy = true
min_interval_minutes = 30
max_runs_per_day = 5
dry_run = true
```

## 执行判断顺序

```text
1. 读取最新执行器策略
2. 读取最新观测门禁策略
3. 读取当前发布批次
4. 统计观测窗口内灰度门控样本
5. 重新计算门禁结论
6. 校验执行器是否启用
7. 校验是否要求门禁允许自动推进
8. 校验每日执行上限
9. 校验最小执行间隔
10. 校验门禁是否 PROMOTE_READY
11. 演练模式只记录结果
12. 非演练模式推进批次到 FULL 并更新发布控制
13. 写入运行结果和平台事件
```

## 权限

- 查看执行器：`channel:publish:view`
- 保存策略：`channel:publish:manage`
- 手动执行：`channel:publish:deploy`
- 资源范围：复用渠道 Resource ACL、DataScopeGuard 和 SecurityPolicyGuard。

## 验收标准

- 选择渠道后能看到自动推进执行器面板。
- 保存策略后能刷新执行器、门禁、流水线、发布控制和渠道概览缓存。
- 演练模式下满足门禁也不会推进全量。
- 非演练模式且门禁 `PROMOTE_READY` 时，手动执行会把当前批次标记为 `FULL`。
- 执行结果写入最近运行结果和平台事件。
- 不新增数据库表或字段，不创建容器，不运行迁移。
