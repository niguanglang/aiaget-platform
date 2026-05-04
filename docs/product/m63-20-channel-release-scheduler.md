# M63-20 渠道发布巡检调度器

## 目标

把 M63-17 自动推进 workflow 和 M63-19 自愈 workflow 串成可运营的后台巡检触发器。

调度器只负责扫描候选渠道和派发 workflow，不复制发布、回滚、审批、门禁和自愈判断逻辑。真实执行仍由已有 `ChannelReleaseAutomationWorkflowService`、`ChannelReleaseSelfHealingWorkflowService` 和 `ChannelsService` 完成。

## 开关

默认关闭：

```text
CHANNEL_RELEASE_SCHEDULER_ENABLED=false
```

可选环境变量：

```text
CHANNEL_RELEASE_SCHEDULER_INTERVAL_MS=120000
CHANNEL_RELEASE_SCHEDULER_BATCH_SIZE=10
```

## 新增接口

```text
GET  /channels/release-scheduler/overview
POST /channels/release-scheduler/run-once
```

权限：

```text
channel:publish:view    查看调度器状态
channel:publish:deploy  手动触发一次巡检
```

## 巡检逻辑

```text
1. 扫描当前租户下未删除渠道
2. 找到 release_automation_policy.enabled=true 的活跃渠道
3. 找到 release_self_healing_policy.enabled=true 的活跃渠道
4. 按批次限制派发到对应 workflow 服务
5. workflow 服务根据当前模式 local / temporal_first / temporal 执行
6. 写入 platform_event 审计
7. 前端展示最近巡检结果
```

## 前端

在 `/channels` 页面新增“渠道发布巡检调度器”面板：

- 巡检开关
- 运行状态
- 最近扫描
- 扫描间隔
- 自动推进 workflow 模式
- 发布自愈 workflow 模式
- 候选渠道数量
- 最近派发结果
- 手动“立即巡检”

## 边界

- 不新增数据库表。
- 不启动容器。
- 不安装中间件。
- 默认不启用定时器，除非显式设置 `CHANNEL_RELEASE_SCHEDULER_ENABLED=true`。
- 多实例部署时建议后续升级为 Temporal schedule 或分布式锁，避免重复扫描。

## 验收标准

- 默认关闭时前端可看到“巡检未启用”。
- 手动巡检可扫描并派发启用自动推进/自愈策略的渠道。
- 巡检结果能展示每个渠道的任务类型、决策、workflow backend 和错误摘要。
- Control API 和 Web typecheck 通过。
