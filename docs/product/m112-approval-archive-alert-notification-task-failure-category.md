# M112 审批与归档告警通知任务失败聚合分类增强

## 目标

M112 在 M111 分类覆盖统计基础上，把通知任务失败聚合细分为 SLA 死信归档删除失败来源和通知任务自愈归档删除失败来源。安全中心可以更清楚地提示到底是哪类自动通知失败，并把分类来源写入自愈建议证据。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 数据来源

复用现有平台事件：

```text
platform_event
```

读取最近 24 小时通知任务事件：

```text
platform.security.approval_operation_alert_notification_task.manual_auto_notify
platform.security.approval_operation_alert_notification_task.auto_notify_finished
platform.security.approval_operation_alert_notification_task.manual_auto_retry
platform.security.approval_operation_alert_notification_task.auto_retry_finished
```

分类字段来自 M111 写入的任务结果 payload：

```text
sla_dead_letter_notify_count
recovery_archive_delete_notify_count
```

## 后端聚合字段

扩展：

```text
SecurityCenterOverview.approval_operations
```

新增字段：

```text
notification_task_sla_dead_letter_failed_24h
notification_task_recovery_archive_delete_failed_24h
```

统计规则：

```text
1. 只统计状态为 FAILED 或 SKIPPED 的任务事件
2. SUCCESS 任务不计入失败来源
3. 历史旧事件缺少分类字段时按 0 兼容
4. 手动执行产生的重复完成事件仍按既有规则过滤
```

## 自愈建议增强

以下建议证据会追加分类失败来源：

```text
notification-task-webhook-not-configured
notification-task-consecutive-failures
notification-task-high-failure-rate
```

证据示例：

```text
近 24 小时任务 6 次，失败 2 次，跳过 1 次。失败来源：SLA 死信归档删除覆盖 1 条，自愈归档删除覆盖 2 条。
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

新增展示：

```text
1. SLA 失败来源
2. 自愈失败来源
```

## 参考设计

```text
images/frontend-reference-design/m112-自愈归档删除自动通知失败聚合增强/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M112 只增强安全中心失败聚合和自愈建议证据。
2. M112 不改变自动通知任务执行策略。
3. M112 不改变自动重试策略。
4. M112 不新增数据库表。
5. M112 不执行数据库迁移。
6. M112 不启动任何容器或中间件。

## 验收标准

- 安全中心 overview 返回 SLA 死信通知失败来源数量。
- 安全中心 overview 返回自愈归档通知失败来源数量。
- 通知任务失败聚合卡片展示两类失败来源。
- 自愈建议证据包含分类失败来源。
- 历史旧任务事件缺少分类字段时不报错。
- Control API typecheck 通过。
- Web typecheck 通过。
