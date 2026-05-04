# M113 审批与归档告警通知任务自愈闭环失败来源分类

## 目标

M113 在 M112 失败来源聚合基础上，把 SLA 死信归档删除、自愈归档删除、混合来源、未知来源带入自愈建议处理闭环。安全管理员在确认、忽略、标记已处理后，后续审计检索、CSV 导出和归档可以按失败来源定位处理记录。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 数据来源

复用现有平台事件：

```text
platform_event
```

建议处理动作仍写入资源类型：

```text
security_operation_alert_notification_task_recovery_suggestion
```

事件类型：

```text
platform.security.approval_operation_alert_notification_task.recovery_suggestion.acknowledged
platform.security.approval_operation_alert_notification_task.recovery_suggestion.ignored
platform.security.approval_operation_alert_notification_task.recovery_suggestion.resolved
```

## 失败来源枚举

新增共享类型：

```text
SecurityOperationAlertNotificationTaskRecoveryFailureSource
```

枚举值：

```text
SLA_DEAD_LETTER_ARCHIVE_DELETE
NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE
MIXED
UNKNOWN
```

## 后端增强

扩展自愈建议：

```text
SecurityOperationAlertNotificationTaskRecoverySuggestion.failure_source
SecurityOperationAlertNotificationTaskRecoverySuggestion.sla_dead_letter_failed_count
SecurityOperationAlertNotificationTaskRecoverySuggestion.recovery_archive_delete_failed_count
```

处理动作写入 payload：

```text
failure_source
sla_dead_letter_failed_count
recovery_archive_delete_failed_count
```

审计列表扩展：

```text
SecurityOperationAlertNotificationTaskRecoveryAuditItem.failure_source
SecurityOperationAlertNotificationTaskRecoveryAuditItem.sla_dead_letter_failed_count
SecurityOperationAlertNotificationTaskRecoveryAuditItem.recovery_archive_delete_failed_count
```

审计摘要扩展：

```text
summary.sla_dead_letter_source_count
summary.recovery_archive_delete_source_count
summary.mixed_source_count
summary.unknown_source_count
```

查询参数扩展：

```text
failure_source
```

支持接口：

```text
GET /security-center/operation-alert-notification-task-recovery-suggestions/audits
GET /security-center/operation-alert-notification-task-recovery-suggestions/audits/export
POST /security-center/operation-alert-notification-task-recovery-suggestions/audits/archives
```

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知任务自愈建议
审批与归档运营 -> 通知任务中心 -> 自愈闭环审计检索
```

新增展示：

```text
1. 自愈建议卡片展示失败来源标签
2. 自愈建议卡片展示 SLA 死信失败数和自愈归档失败数
3. 审计摘要展示 SLA 来源、自愈来源、混合来源、未知来源
4. 审计筛选新增失败来源筛选
5. 审计表格行展示失败来源和两个来源计数
```

## 兼容策略

历史旧事件没有 `failure_source` 时：

```text
1. 如果存在来源计数字段，则按计数推断来源
2. 如果没有来源计数字段，则展示 UNKNOWN
3. UNKNOWN 可以被审计筛选定位
```

## 参考设计

```text
images/frontend-reference-design/m113-自愈建议处理闭环失败来源分类/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M113 不改变自动通知任务执行策略。
2. M113 不改变自动重试策略。
3. M113 不新增数据库表。
4. M113 不执行数据库迁移。
5. M113 不启动任何容器或中间件。
6. M113 只把 M112 的失败来源分类延伸到建议处理闭环和审计检索。

## 验收标准

- 自愈建议返回失败来源和两个来源计数。
- 确认、忽略、标记已处理事件写入失败来源和两个来源计数。
- 自愈闭环审计支持按失败来源筛选。
- CSV 导出包含失败来源和两个来源计数。
- 归档创建 metadata 保留 `failure_source` 筛选条件。
- 前端建议卡片展示失败来源和计数。
- 前端审计卡片展示来源摘要、来源筛选和行级来源。
- 历史旧事件缺少来源字段时按 UNKNOWN 兼容。
- Control API typecheck 通过。
- Web typecheck 通过。
