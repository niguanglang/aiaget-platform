# M107 审批与归档告警通知任务自愈闭环审计归档删除审批化

## 目标

在 M106 自愈闭环审计归档下载基础上，把归档删除纳入审批闭环，避免审计文件被直接删除。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。审批记录使用 `platform_event` 聚合生成。

## 事件模型

资源类型：

```text
SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE
```

事件类型：

```text
platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_requested
platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_approved
platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_rejected
platform.security.approval_operation_alert_notification_task.recovery_audit_archive.delete_applied
```

审批状态：

```text
PENDING   待审批
APPROVED  已批准
REJECTED  已拒绝
APPLIED   已生效
```

## 后端接口

```text
DELETE /security-center/operation-alert-notification-task-recovery-suggestions/audits/archives/:archiveId
GET    /security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/overview
GET    /security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals
GET    /security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/:approvalId
POST   /security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/:approvalId/approve
POST   /security-center/operation-alert-notification-task-recovery-suggestions/audits/archive-approvals/:approvalId/reject
```

批准逻辑：

```text
1. 校验审批状态必须是 PENDING
2. 写入 APPROVED 事件
3. 删除 MinIO 租户对象
4. 写入 DELETE_APPLIED 事件
5. 返回最新审批详情和时间线
```

拒绝逻辑：

```text
1. 校验审批状态必须是 PENDING
2. 写入 REJECTED 事件
3. 保留对象存储文件
4. 返回最新审批详情和时间线
```

## 前端页面

页面：

```text
/security
```

位置：

```text
通知任务中心 -> 自愈闭环审计检索 -> 自愈闭环审计归档下载 -> 归档删除审批
```

功能：

```text
1. 在归档列表中申请删除
2. 展示删除审批统计：待审批、已批准、已拒绝、已生效
3. 支持审批关键词、状态、只看待审批筛选
4. 支持导出当前审批筛选结果
5. 支持审批详情和事件时间线
6. 支持批准删除和拒绝删除
7. 支持通过 request_id 跳转审计中心，通过 trace_id 跳转监控中心
```

## 参考设计

```text
images/frontend-reference-design/m107-通知任务自愈闭环审计归档删除审批/
```

## 边界

1. M107 只处理 M106 自愈闭环审计归档的删除审批。
2. M107 不处理 SLA 死信审计归档，SLA 归档已有独立审批链路。
3. M107 不新增数据库表。
4. M107 不执行数据库迁移。
5. M107 不启动任何容器或中间件。
6. M107 复用现有 MinIO 存储设置，审批通过时由现有存储服务删除对象。
