# M105 审批与归档告警通知任务自愈闭环审计检索

## 目标

在 M104 自愈建议处理闭环基础上，把确认、忽略、标记已处理事件做成可筛选、可搜索、可联动审计中心和 Trace 的审计列表。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。数据全部来自 M104 写入的 `platform_event`。

## 数据来源

```text
platform_event
```

读取资源类型：

```text
security_operation_alert_notification_task_recovery_suggestion
```

读取事件类型：

```text
platform.security.approval_operation_alert_notification_task.recovery_suggestion.acknowledged
platform.security.approval_operation_alert_notification_task.recovery_suggestion.ignored
platform.security.approval_operation_alert_notification_task.recovery_suggestion.resolved
```

## 后端接口

```text
GET /security-center/operation-alert-notification-task-recovery-suggestions/audits
```

查询参数：

```text
action      ACKNOWLEDGE / IGNORE / RESOLVE
status      ACKNOWLEDGED / IGNORED / RESOLVED
reason_code WEBHOOK_NOT_CONFIGURED / WEBHOOK_DELIVERY_FAILED / AUTO_NOTIFY_DISABLED / AUTO_RETRY_DISABLED / CONSECUTIVE_FAILURES / HIGH_FAILURE_RATE
keyword     搜索建议、备注、request_id、trace_id
```

返回结构：

```text
SecurityOperationAlertNotificationTaskRecoveryAuditOverview
```

包含：

```text
summary.total_count
summary.acknowledged_count
summary.ignored_count
summary.resolved_count
summary.latest_action_at
items[]
```

## 前端页面

页面：

```text
/security
```

位置：

```text
通知任务中心 -> 任务执行历史与审计检索 -> 自愈闭环审计检索
```

展示：

```text
1. 闭环记录数
2. 已确认数量
3. 已忽略数量
4. 已处理数量
5. 最近处理时间
6. 动作筛选
7. 状态筛选
8. 原因筛选
9. 关键词搜索
10. 审计中心与监控链路跳转
```

## 参考设计

```text
images/frontend-reference-design/m105-通知任务自愈闭环审计检索/
```

## 边界

1. M105 只读展示闭环审计事件。
2. M105 不新增数据库表。
3. M105 不执行数据库迁移。
4. M105 不启动任何容器或中间件。
5. M105 不改变 M103 建议生成和 M104 处理动作语义。
