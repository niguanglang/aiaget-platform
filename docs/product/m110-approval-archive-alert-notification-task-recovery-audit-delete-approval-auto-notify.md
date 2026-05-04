# M110 审批与归档告警通知任务自愈闭环审计归档删除审批自动通知任务

## 目标

M110 在 M109 手动通知投递基础上，把通知任务自愈闭环审计归档删除审批运营告警纳入后台首发自动通知任务。平台可以自动扫描自愈归档删除待审和拒绝偏多告警，并复用已有站内记录、Webhook 投递、失败自动重试和投递审计链路。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 后端接口

复用通知任务接口：

```text
GET  /api/v1/security-center/operation-alert-notification-tasks/overview
POST /api/v1/security-center/operation-alert-notification-tasks/run-auto-notify
POST /api/v1/security-center/operation-alert-notification-tasks/run-auto-retry
GET  /api/v1/security-center/operation-alert-notification-task-runs
```

## 自动通知范围

首发自动通知现在覆盖两类归档删除审批运营告警。

SLA 死信审计归档删除审批：

```text
sla-dead-letter-archive-delete-pending
sla-dead-letter-archive-delete-rejected-risk
```

通知任务自愈闭环审计归档删除审批：

```text
notification-task-recovery-audit-archive-delete-pending
notification-task-recovery-audit-archive-delete-rejected-risk
```

过滤规则：

```text
1. 告警必须处于非 CLOSED 状态
2. 告警必须在回看窗口内没有通知记录
3. 单次最多处理 auto_notify_batch_size 条
4. 通知渠道使用 IN_APP + WEBHOOK
5. 已失败或部分成功的投递继续进入自动重试链路
```

## 任务策略

继续读取租户系统设置：

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

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知任务中心
```

展示调整：

```text
1. 增加 M110 自愈归档标识
2. 首发自动通知文案覆盖 SLA 死信 + 自愈归档删除
3. 待自动通知指标说明覆盖两类告警
4. 空状态说明覆盖两类告警
```

## 参考设计

```text
images/frontend-reference-design/m110-通知任务自愈归档删除审批自动通知任务/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M110 只扩展现有自动首发通知扫描范围。
2. M110 不新增独立任务服务。
3. M110 不新增数据库表。
4. M110 不执行数据库迁移。
5. M110 不启动任何容器或中间件。
6. M110 不改变自动重试策略，仅让新增分类的失败/部分成功投递自然进入现有重试链路。

## 验收标准

- 自动首发通知扫描范围包含自愈归档删除待审告警。
- 自动首发通知扫描范围包含自愈归档删除拒绝偏多告警。
- 手动执行“立即自动通知”可以处理 M108/M109 告警。
- 调度执行可以处理 M108/M109 告警。
- 前端通知任务中心显示 M110 自愈归档标识。
- 前端首发通知说明覆盖 SLA 死信和自愈归档删除两类告警。
- Control API typecheck 通过。
- Web typecheck 通过。
