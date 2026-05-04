# M108 审批与归档告警通知任务自愈闭环审计归档删除审批运营闭环

## 目标

M108 将 M107 的通知任务自愈闭环审计归档删除审批接入安全中心“审批与归档运营”看板。平台可以在统一看板里展示自愈归档删除审批的待审、批准、拒绝和删除生效情况，并在待审积压或拒绝偏多时生成运营风险与运营告警。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 数据来源

复用 M107 写入的 `platform_event`：

```text
platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested
platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_approved
platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_rejected
platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_applied
```

事件来源：

```text
security_center
```

## 后端聚合字段

增强 `GET /api/v1/security-center/overview` 返回的 `approval_operations`：

```text
notification_task_recovery_audit_archive_delete_pending
notification_task_recovery_audit_archive_delete_approved
notification_task_recovery_audit_archive_delete_rejected
notification_task_recovery_audit_archive_delete_applied
```

内部聚合还记录：

```text
notification_task_recovery_audit_archive_delete_pending_oldest_at
```

用于运营告警触发时间。

## 风险信号

新增安全中心风险信号：

```text
1. 通知任务自愈归档删除待审批
2. 通知任务自愈归档删除拒绝偏多
```

触发规则：

```text
1. pending > 0 时提示待审批风险
2. rejected > 0 且 rejected >= applied 时提示拒绝偏多风险
```

## 运营告警

新增运营告警：

```text
notification-task-recovery-audit-archive-delete-pending
notification-task-recovery-audit-archive-delete-rejected-risk
```

告警分类：

```text
NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE
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
审批与归档运营 -> 通知任务自愈归档删除审批运营
```

展示：

```text
1. 自愈删除待审
2. 自愈已批准
3. 自愈已拒绝
4. 自愈闭环率
```

运营待办总数纳入：

```text
工具审批待办
通知策略待办
审批审计归档删除待办
SLA 死信审计归档删除待办
通知任务自愈审计归档删除待办
```

底部摘要新增：

```text
自愈归档删除：待审 / 拒绝 / 生效
```

## 参考设计

```text
images/frontend-reference-design/m108-通知任务自愈闭环审计归档删除审批运营闭环/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M108 只做运营聚合、风险信号和告警闭环，不改变 M107 的审批执行逻辑。
2. M108 不新增数据库表。
3. M108 不执行数据库迁移。
4. M108 不启动任何容器或中间件。
5. M108 统计基于 `platform_event` 聚合，后续可迁移为专用运营聚合表。

## 验收标准

- 安全中心总览返回自愈归档删除审批 4 个统计值。
- 运营待办总数包含自愈归档删除待审。
- 前端审批与归档运营看板展示 M108 指标。
- 待审存在时可以产生风险信号与运营告警。
- 拒绝数量不低于生效数量时可以产生风险信号与运营告警。
- Control API typecheck 通过。
- Web typecheck 通过。
