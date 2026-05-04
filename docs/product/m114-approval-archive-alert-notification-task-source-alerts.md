# M114 审批与归档告警通知任务失败来源运营告警升级

## 目标

M114 在 M113 失败来源闭环基础上，把 SLA 死信归档删除、自愈归档删除、混合来源失败升级为可通知、可确认、可升级、可关闭的运营告警。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 数据来源

复用安全中心 overview 的 24 小时通知任务失败聚合字段：

```text
notification_task_sla_dead_letter_failed_24h
notification_task_recovery_archive_delete_failed_24h
notification_task_failed_24h
notification_task_skipped_24h
notification_task_failure_rate_24h
notification_task_consecutive_failures
```

## 新增运营告警

新增来源型告警 ID：

```text
operation-alert-notification-task-sla-dead-letter-failure-source
operation-alert-notification-task-recovery-archive-failure-source
operation-alert-notification-task-mixed-failure-source
```

触发规则：

```text
1. SLA 来源失败数 > 0 且自愈来源失败数 = 0 -> SLA 来源告警
2. 自愈来源失败数 > 0 且 SLA 来源失败数 = 0 -> 自愈来源告警
3. SLA 来源失败数 > 0 且自愈来源失败数 > 0 -> 混合来源告警
```

严重级别：

```text
HIGH：来源失败数 >= 3，或失败率 >= 50，或连续失败 >= 3
MEDIUM：其他来源失败场景
```

## 后端增强

增强函数：

```text
buildApprovalOperationAlerts
securityOperationAlertCategory
isNotificationTaskFailureAlert
securityOperationAlertNotificationTargets
```

自动通知任务范围扩展：

```text
AUTO_NOTIFY_ALERT_IDS
SLA_DEAD_LETTER_AUTO_NOTIFY_ALERT_IDS
RECOVERY_ARCHIVE_DELETE_AUTO_NOTIFY_ALERT_IDS
```

来源型告警会进入自动首发通知扫描范围，并继续写入现有通知投递审计事件。

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知任务失败聚合
审批与归档运营 -> 运营告警闭环
审批与归档运营 -> 通知投递审计
```

新增展示：

```text
1. 通知任务失败聚合中提示来源失败会进入运营告警闭环
2. 运营告警卡片展示来源分类标签
3. 通知投递审计展示来源型告警分类
4. 来源型告警支持确认、升级、关闭、通知
```

## 兼容策略

1. 原有通用通知任务失败告警保留，作为整体任务健康兜底。
2. 来源型告警只在已有来源失败计数大于 0 时生成。
3. 历史任务事件缺少来源字段时不会触发来源型告警，只保留通用告警。

## 参考设计

```text
images/frontend-reference-design/m114-自愈闭环失败来源运营告警升级/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M114 不改变自动通知任务执行策略。
2. M114 不改变自动重试策略。
3. M114 不新增数据库表。
4. M114 不执行数据库迁移。
5. M114 不启动任何容器或中间件。
6. M114 只把已有失败来源聚合升级为运营告警和通知范围。

## 验收标准

- SLA 来源失败可以生成来源型运营告警。
- 自愈归档来源失败可以生成来源型运营告警。
- 双来源同时失败可以生成混合来源运营告警。
- 来源型告警支持确认、升级、关闭和通知。
- 来源型告警进入自动首发通知扫描范围。
- 通知投递审计能展示来源型告警分类。
- Control API typecheck 通过。
- Web typecheck 通过。
