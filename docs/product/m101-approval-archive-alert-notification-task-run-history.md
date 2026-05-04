# M101 审批与归档告警通知任务执行历史与审计检索

## 目标

在 M100 首发自动通知和 M87 失败自动重试任务基础上，补齐任务执行历史视图，让安全管理员可以查看每次自动通知/自动重试任务的执行结果，并通过 request_id / trace_id 联动审计中心和监控中心。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 数据来源

复用现有平台事件表：

```text
platform_event
```

读取事件类型：

```text
platform.security.approval_operation_alert_notification_task.manual_auto_notify
platform.security.approval_operation_alert_notification_task.auto_notify_finished
platform.security.approval_operation_alert_notification_task.manual_auto_retry
platform.security.approval_operation_alert_notification_task.auto_retry_finished
```

手动执行会同时写入手动触发事件和任务完成事件。历史列表会保留手动触发事件，过滤同一次手动执行的完成事件，避免重复展示。

## 后端接口

新增任务执行历史：

```text
GET /api/v1/security-center/operation-alert-notification-tasks/runs
```

查询参数：

```text
task    AUTO_NOTIFY / AUTO_RETRY
status  SUCCESS / FAILED / SKIPPED
keyword event_id / request_id / trace_id / summary / error_message
```

权限：

```text
security:rule:view
```

## 返回字段

执行记录：

```text
event_id
event_type
task
status
trigger_type
scanned_count
notified_count
retried_count
success_count
failed_count
skipped_count
started_at
finished_at
duration_ms
request_id
trace_id
summary
error_message
created_at
```

摘要：

```text
total_count
success_count
failed_count
skipped_count
manual_count
scheduled_count
auto_notify_count
auto_retry_count
latest_finished_at
```

## 前端页面

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知任务中心 -> 任务执行历史与审计检索
```

展示能力：

```text
1. 执行记录总数
2. 成功执行数
3. 失败执行数
4. 手动/调度执行数
5. 首发通知/失败重试执行数
6. 最近完成时间
7. 执行历史表格
```

筛选能力：

```text
1. 按任务类型筛选
2. 按执行状态筛选
3. 按关键字搜索
4. 清空筛选
5. 刷新历史
```

联动能力：

```text
1. request_id -> /audit?keyword=<request_id>
2. trace_id   -> /monitor?keyword=<trace_id>
```

## 参考设计

```text
images/frontend-reference-design/m101-通知任务执行历史与审计检索/
```

## 边界

1. M101 不新增独立页面。
2. M101 不新增数据库表。
3. M101 不执行数据库迁移。
4. M101 不启动任何容器或中间件。
5. M101 不改变 M100/M87 的任务执行策略，只增加历史投影和前端检索。
