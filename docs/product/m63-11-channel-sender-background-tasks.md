# M63-11 渠道自动重试与投递清理任务

## 目标

把 M63-10 的渠道投递策略真正接入后台任务边界，让 Channel Sender 支持按策略自动重试失败投递，并按保留天数清理旧投递记录。

## 后端能力

- 新增 `ChannelSenderTaskService`。
- 应用启动后注册轻量定时任务：
  - 默认每 60 秒扫描一次。
  - 可通过 `CHANNEL_SENDER_TASK_ENABLED=false` 关闭。
  - 可通过 `CHANNEL_SENDER_TASK_INTERVAL_MS` 调整扫描间隔。
  - 可通过 `CHANNEL_SENDER_TASK_BATCH_SIZE` 调整批量处理数量。
- 自动重试扫描遵守渠道策略：
  - `auto_retry_enabled = true`
  - `retry_count < max_retry_count`
  - 到达 `retry_backoff_seconds`
  - 响应码为空或命中 `retry_on_statuses`
- 清理任务遵守渠道策略：
  - 按每个渠道的 `retention_days` 删除旧投递记录。
- 自动重试会复用 `ExternalChannelSenderService` 的投递逻辑，并继续写入平台事件和用量。

## API

```text
GET  /api/v1/channels/sender-tasks/overview
POST /api/v1/channels/sender-tasks/run-auto-retry
POST /api/v1/channels/sender-tasks/run-cleanup
```

权限：

```text
channel:publish:view   查看任务概览
channel:publish:manage 手动触发自动重试和清理任务
```

## 前端

在 `/channels` 新增「渠道投递后台任务」面板：

- 指标：
  - 待自动重试
  - 可清理记录
  - 自动重试渠道
  - 失败投递
- 调度状态：
  - 任务开关
  - 运行状态
  - 最近扫描
  - 扫描间隔
  - 最早失败记录
- 操作：
  - 刷新任务
  - 立即扫描重试
  - 立即清理
- 最近执行结果：
  - 自动重试结果
  - 投递清理结果

参考设计产物：

```text
images/frontend-reference-design/m63-11-渠道自动重试任务中心/
```

## 注意

- 本模块不新增数据库表，不执行迁移。
- 当前是 Control API 应用内轻量调度，适合 MVP 和私有化单实例部署。
- 多实例部署时需要后续升级为 Temporal / 分布式锁调度，避免多个 Control API 实例重复扫描。
- 清理任务会物理删除过期投递记录；平台事件和用量记录仍保留用于审计。
