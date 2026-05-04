# M104 审批与归档告警通知任务自愈建议处理闭环

## 目标

在 M103 自愈建议基础上，为每条通知任务排障建议增加处理动作，使建议具备确认、忽略和标记已处理的运营闭环。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。处理动作只写入 `platform_event`，不自动修改系统设置或外部集成配置。

## 数据来源

复用：

```text
platform_event
```

新增事件资源类型：

```text
security_operation_alert_notification_task_recovery_suggestion
```

新增事件类型：

```text
platform.security.approval_operation_alert_notification_task.recovery_suggestion.acknowledged
platform.security.approval_operation_alert_notification_task.recovery_suggestion.ignored
platform.security.approval_operation_alert_notification_task.recovery_suggestion.resolved
```

## 后端接口

```text
POST /security-center/operation-alert-notification-task-recovery-suggestions/:suggestionId/actions
```

请求：

```json
{
  "action": "ACKNOWLEDGE | IGNORE | RESOLVE",
  "note": "可选备注"
}
```

返回：

```json
{
  "suggestion_id": "notification-task-webhook-not-configured",
  "status": "ACKNOWLEDGED | IGNORED | RESOLVED",
  "last_action": "ACKNOWLEDGE | IGNORE | RESOLVE",
  "last_note": "安全中心手动确认",
  "updated_at": "2026-05-04T00:00:00.000Z"
}
```

## 共享类型

扩展：

```text
SecurityOperationAlertNotificationTaskRecoverySuggestion
```

新增字段：

```text
status
last_action
last_note
updated_at
```

新增类型：

```text
SecurityOperationAlertNotificationTaskRecoveryStatus
SecurityOperationAlertNotificationTaskRecoveryAction
SecurityOperationAlertNotificationTaskRecoveryActionInput
SecurityOperationAlertNotificationTaskRecoveryActionResult
```

## 前端页面

页面：

```text
/security
```

位置：

```text
审批与归档运营 -> 通知任务失败聚合 -> 通知任务自愈建议
```

卡片展示：

```text
1. 风险等级
2. 原因标签
3. 生命周期状态：待处理 / 已确认 / 已忽略 / 已处理
4. 标题和说明
5. 最近处理动作、备注和时间
6. 证据文本
7. 排障链接
8. 确认 / 忽略 / 标记已处理按钮
```

## 状态规则

```text
ACKNOWLEDGE -> ACKNOWLEDGED
IGNORE      -> IGNORED
RESOLVE     -> RESOLVED
```

空状态仍沿用 M103：当没有建议时展示“暂无排障建议”。

## 参考设计

```text
images/frontend-reference-design/m104-通知任务自愈建议处理闭环/
```

## 边界

1. M104 不自动修复配置。
2. M104 不新增数据库表。
3. M104 不执行数据库迁移。
4. M104 不启动任何容器或中间件。
5. M104 只把人工处理动作记录为平台事件，并投影到安全中心建议卡片。
