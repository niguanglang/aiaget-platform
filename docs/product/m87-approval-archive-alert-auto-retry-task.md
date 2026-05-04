# M87 审批与归档告警自动重试任务

## 目标

在 M86 通知投递审计与手动重试基础上，补齐审批与归档告警通知自动重试任务。任务扫描失败或部分成功的投递记录，在满足退避时间和最大重试次数后自动追加重试投递事件。

本模块不新增数据库表、不执行数据库迁移、不启动容器、不安装中间件。

## 后端接口

新增任务概览：

```text
GET /api/v1/security-center/operation-alert-notification-tasks/overview
```

新增手动触发：

```text
POST /api/v1/security-center/operation-alert-notification-tasks/run-auto-retry
```

## 任务策略

优先读取租户系统设置：

```text
alert_notification_auto_retry_enabled
alert_notification_retry_interval_ms
alert_notification_retry_batch_size
alert_notification_max_retry_count
alert_notification_retry_backoff_seconds
alert_notification_lookback_hours
```

没有租户设置时使用环境变量兜底：

```text
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_ENABLED
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_INTERVAL_MS
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_BATCH_SIZE
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_MAX_RETRY_COUNT
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_BACKOFF_SECONDS
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_LOOKBACK_HOURS
```

## 自动重试条件

允许自动重试：

```text
PARTIAL
FAILED
```

必须满足：

```text
1. retry_count < max_retry_count
2. delivered_at 早于 retry_backoff_seconds
3. delivered_at 在 lookback_hours 窗口内
4. 单次最多处理 retry_batch_size 条
```

## 事件记录

任务结果写入：

```text
platform_event
```

事件类型：

```text
platform.security.approval_operation_alert_notification_task.manual_auto_retry
platform.security.approval_operation_alert_notification_task.auto_retry_finished
```

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知自动重试任务
```

展示：

```text
1. 待自动重试
2. 失败投递
3. 部分成功
4. 已重试
5. 调度状态
6. 当前策略
7. 最近执行结果
```

操作：

```text
立即扫描重试
刷新任务
```

## 参考设计

```text
images/frontend-reference-design/m87-审批与归档告警自动重试任务/
```

## 边界

1. M87 不新增独立页面。
2. M87 不新增数据库表。
3. M87 不引入 Temporal 或新队列。
4. M87 不执行数据库迁移。
5. M87 不启动任何容器或中间件。

## 后续演进

后续可以继续做：

```text
1. 接入 Temporal durable task
2. 告警订阅人配置
3. 告警 SLA 与超时升级
4. 与监控中心统一自动重试任务合并
5. 自动重试失败原因统计
```

## 验收标准

- 可以查看审批与归档告警通知自动重试任务概览。
- 可以手动触发一次扫描重试。
- 任务只重试失败或部分成功投递。
- 任务遵守退避、最大次数、批量大小和回看窗口。
- 任务结果写入 `platform_event`。
- `/security` 展示通知自动重试任务区域。
- Control API typecheck 通过。
- Web typecheck 通过。
