# M106 审批与归档告警通知任务自愈闭环导出与审计归档

## 目标

在 M105 自愈闭环审计检索基础上，把当前筛选条件下的审计结果做成可导出、可归档、可下载的交付闭环。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。归档复用现有 MinIO 对象存储能力。

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

## 归档路径

```text
audit-archives/security-notification-task-recovery-audits/
```

归档内容为 UTF-8 BOM CSV，便于直接用表格工具打开。

## 后端接口

```text
GET  /security-center/operation-alert-notification-task-recovery-suggestions/audits/export
POST /security-center/operation-alert-notification-task-recovery-suggestions/audits/archives
GET  /security-center/operation-alert-notification-task-recovery-suggestions/audits/archives
GET  /security-center/operation-alert-notification-task-recovery-suggestions/audits/archives/:archiveId/download-url
```

查询参数沿用 M105：

```text
action      ACKNOWLEDGE / IGNORE / RESOLVE
status      ACKNOWLEDGED / IGNORED / RESOLVED
reason_code WEBHOOK_NOT_CONFIGURED / WEBHOOK_DELIVERY_FAILED / AUTO_NOTIFY_DISABLED / AUTO_RETRY_DISABLED / CONSECUTIVE_FAILURES / HIGH_FAILURE_RATE
keyword     搜索建议、备注、request_id、trace_id
```

## CSV 字段

```text
事件ID
建议ID
建议标题
原因
风险等级
动作
状态
备注
证据
Request ID
Trace ID
处理时间
```

## 前端页面

页面：

```text
/security
```

位置：

```text
通知任务中心 -> 自愈闭环审计检索 -> 自愈闭环审计归档下载
```

功能：

```text
1. 按当前筛选条件导出 CSV
2. 按当前筛选条件生成对象存储归档
3. 查看归档数量和归档容量
4. 查看归档文件名、目录、大小、更新时间、对象路径
5. 获取限时签名下载地址并下载归档
```

## 参考设计

```text
images/frontend-reference-design/m106-通知任务自愈闭环导出与审计归档/
```

## 边界

1. M106 只做导出、归档和下载。
2. M106 不做归档删除审批，删除审批留给后续模块。
3. M106 不新增数据库表。
4. M106 不执行数据库迁移。
5. M106 不启动任何容器或中间件。
6. M106 复用现有 MinIO 存储设置，存储未就绪时由现有存储服务返回错误。
