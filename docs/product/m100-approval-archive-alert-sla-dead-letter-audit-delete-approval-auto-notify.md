# M100 审批与归档告警 SLA 死信审计归档删除审批自动通知任务

## 目标

在 M98/M99 已经形成 SLA 死信审计归档删除审批运营告警和手动通知能力后，补齐后台首发自动通知任务。

本模块让安全中心形成：

```text
归档删除审批事件 -> 运营告警 -> 自动首发通知 -> 失败自动重试 -> 投递审计
```

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 后端接口

扩展任务概览：

```text
GET /api/v1/security-center/operation-alert-notification-tasks/overview
```

新增手动触发首发通知：

```text
POST /api/v1/security-center/operation-alert-notification-tasks/run-auto-notify
```

保留自动重试触发：

```text
POST /api/v1/security-center/operation-alert-notification-tasks/run-auto-retry
```

权限：

```text
security:rule:view
```

## 自动通知范围

首发自动通知只处理 M98 新增的 SLA 死信归档删除审批运营告警：

```text
sla-dead-letter-archive-delete-pending
sla-dead-letter-archive-delete-rejected-risk
```

过滤规则：

```text
1. 告警必须处于非 CLOSED 状态
2. 告警必须在回看窗口内没有通知记录
3. 单次最多处理 auto_notify_batch_size 条
4. 通知渠道使用 IN_APP + WEBHOOK
```

## 任务策略

优先读取租户系统设置：

```text
alert_notification_auto_notify_enabled
alert_notification_auto_notify_interval_ms
alert_notification_auto_notify_batch_size
alert_notification_auto_retry_enabled
alert_notification_retry_interval_ms
alert_notification_retry_batch_size
alert_notification_max_retry_count
alert_notification_retry_backoff_seconds
alert_notification_lookback_hours
```

环境变量兜底：

```text
SECURITY_OPERATION_ALERT_AUTO_NOTIFY_ENABLED
SECURITY_OPERATION_ALERT_AUTO_NOTIFY_INTERVAL_MS
SECURITY_OPERATION_ALERT_AUTO_NOTIFY_BATCH_SIZE
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_ENABLED
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_INTERVAL_MS
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_BATCH_SIZE
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_MAX_RETRY_COUNT
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_BACKOFF_SECONDS
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_LOOKBACK_HOURS
```

## 事件记录

任务结果写入：

```text
platform_event
```

新增事件类型：

```text
platform.security.approval_operation_alert_notification_task.manual_auto_notify
platform.security.approval_operation_alert_notification_task.auto_notify_finished
```

保留 M87 事件：

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
审批与归档运营 -> 通知任务中心
```

展示：

```text
1. M100 首发自动通知
2. M87 失败自动重试
3. 待自动通知
4. 已首发覆盖
5. 最早待通知
6. 待自动重试
7. 失败/部分成功
8. 调度状态
9. 当前策略
10. 最近执行结果
```

操作：

```text
立即自动通知
立即扫描重试
刷新任务
```

## 设置中心联动

通知策略分类新增首发自动通知参数，并纳入通知策略审批、审计和影响预览：

```text
alert_notification_auto_notify_enabled
alert_notification_auto_notify_interval_ms
alert_notification_auto_notify_batch_size
```

影响预览新增任务快照：

```text
pending_auto_notify_count
auto_notified_count
```

## 参考设计

```text
images/frontend-reference-design/m100-sla死信审计归档删除审批自动通知任务/
```

## 边界

1. M100 不新增独立页面。
2. M100 不新增数据库表。
3. M100 不引入 Temporal 或新队列。
4. M100 不执行数据库迁移。
5. M100 不启动任何容器或中间件。
