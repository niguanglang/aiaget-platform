# M72 告警自动重试后台任务

## 目标

在 M71 已具备投递审计和人工重试后，补齐轻量后台任务能力：系统自动扫描失败或部分成功的告警通知投递，满足退避时间和最大重试次数后自动重试，并把任务结果继续写入统一平台事件。

本模块不新增表、不执行迁移、不启动容器、不安装中间件。

## 数据承载

继续复用：

```text
投递记录：
platform.usage.alert.notification_sent

重试关系：
ALERT_NOTIFICATION_RETRY

任务事件：
platform.usage.alert_notification_task.auto_retry_finished
platform.usage.alert_notification_task.manual_auto_retry
```

任务事件使用：

```text
resource_type = platform_usage_alert_notification_task
event_source  = platform_usage_alert_notification_task
```

## 接口

### 任务概览

```text
GET /platform-usage/alert-notification-tasks/overview
```

返回：

```json
{
  "scheduler_enabled": true,
  "running": false,
  "last_tick_at": "2026-05-03T00:00:00.000Z",
  "next_tick_after_seconds": 60,
  "summary": {
    "pending_auto_retry_count": 2,
    "failed_notification_count": 5,
    "partial_notification_count": 1,
    "retried_notification_count": 3,
    "oldest_retryable_at": "2026-05-03T00:00:00.000Z"
  },
  "last_auto_retry_result": null
}
```

### 手动扫描重试

```text
POST /platform-usage/alert-notification-tasks/run-auto-retry
```

用于人工触发一次扫描，便于运营确认策略和排障。

## 策略

第一版使用环境变量配置轻量策略：

```text
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_ENABLED=true|false
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_INTERVAL_MS=60000
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_BATCH_SIZE=8
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_MAX_RETRY_COUNT=3
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_BACKOFF_SECONDS=60
PLATFORM_USAGE_ALERT_NOTIFICATION_TASK_LOOKBACK_HOURS=24
```

默认策略：

```text
1. 扫描最近 24 小时投递记录
2. 仅重试 FAILED / PARTIAL
3. 退避 60 秒后才允许自动重试
4. 单条最多重试 3 次
5. 单批最多处理 8 条
```

## 前端承载

继续复用：

```text
/monitor
PlatformEventUsagePanel
```

新增能力：

```text
1. “告警通知自动重试”卡片
2. 展示任务开关、运行状态、最近扫描、扫描间隔
3. 展示待自动重试、失败投递、部分成功、已重试统计
4. 展示最近一次执行结果
5. 支持“立即扫描重试”
```

## 边界

1. 仍不新增独立通知表。
2. 不接入 Redis 队列或 Temporal。
3. 不提供前端策略编辑，策略先走环境变量。
4. 不做批量选择重试。
5. 后续生产化可升级为独立通知投递表、退避队列、死信队列和 SLA。

## 验收标准

- 可以查看告警通知自动重试任务概览。
- 可以手动触发自动重试扫描。
- 任务会扫描 `FAILED / PARTIAL` 投递记录。
- 重试结果追加投递事件并建立重试关系。
- 任务执行结果写入统一平台事件。
- 前端以中文展示任务状态和最近执行结果。
- Control API typecheck 通过。
- Web typecheck 通过。
