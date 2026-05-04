# M102 审批与归档告警通知任务失败聚合与运营告警升级

## 目标

在 M101 通知任务执行历史基础上，聚合首发自动通知和失败自动重试任务的失败风险，并投影为安全中心运营告警，进入已有告警确认、升级、关闭和通知投递闭环。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 数据来源

复用现有平台事件表：

```text
platform_event
```

读取最近 24 小时任务事件：

```text
platform.security.approval_operation_alert_notification_task.manual_auto_notify
platform.security.approval_operation_alert_notification_task.auto_notify_finished
platform.security.approval_operation_alert_notification_task.manual_auto_retry
platform.security.approval_operation_alert_notification_task.auto_retry_finished
```

手动执行产生的重复完成事件会被过滤，避免风险统计重复计算。

## 后端聚合字段

扩展：

```text
SecurityCenterOverview.approval_operations
```

新增字段：

```text
notification_task_runs_24h
notification_task_failed_24h
notification_task_skipped_24h
notification_task_failure_rate_24h
notification_task_consecutive_failures
```

内部聚合还记录：

```text
notification_task_failure_oldest_at
```

用于告警触发时间。

## 运营告警

新增告警：

```text
operation-alert-notification-task-failure-risk
operation-alert-notification-task-consecutive-failure
```

触发规则：

```text
1. 最近 24 小时任务执行数 >= 3，且存在失败或失败率 >= 30%
2. 连续失败或跳过次数 >= 2
```

严重级别：

```text
1. 失败率 >= 50% 或失败数 >= 3 -> HIGH
2. 连续失败 >= 3 -> HIGH
3. 其他触发情况 -> MEDIUM
```

告警分类：

```text
NOTIFICATION_TASK
```

通知目标：

```text
MEDIUM: 安全管理员、审计员
HIGH:   租户管理员、安全管理员、审计员
```

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知任务失败聚合
```

展示：

```text
1. 最近 24 小时通知任务执行数
2. 失败 / 跳过数量
3. 失败率
4. 连续失败次数
```

告警闭环复用：

```text
1. 通知
2. 确认
3. 升级
4. 关闭
5. 投递审计
```

## 参考设计

```text
images/frontend-reference-design/m102-通知任务失败聚合与运营告警升级/
```

## 边界

1. M102 不新增独立页面。
2. M102 不新增数据库表。
3. M102 不执行数据库迁移。
4. M102 不启动任何容器或中间件。
5. M102 只增加风险聚合与运营告警投影，不改变 M100/M87/M101 的任务执行和历史查询逻辑。
