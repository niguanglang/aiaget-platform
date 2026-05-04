# M109 审批与归档告警通知任务自愈闭环审计归档删除审批通知投递

## 目标

M109 将 M108 产生的通知任务自愈闭环审计归档删除审批运营告警接入现有通知投递识别体系。平台在手动发送站内记录和 Webhook 时，会标记该告警属于 `NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE`，并在前端通知投递审计中显示专属标签和目标角色。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 后端

复用通用运营告警通知接口：

```text
POST /api/v1/security-center/operation-alerts/:alertId/notify
GET  /api/v1/security-center/operation-alert-notifications
POST /api/v1/security-center/operation-alert-notifications/:notificationEventId/retry
```

告警分类：

```text
NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE
```

适用告警：

```text
notification-task-recovery-audit-archive-delete-pending
notification-task-recovery-audit-archive-delete-rejected-risk
```

通知目标：

```text
中风险：安全管理员、审计员
高风险：租户管理员、安全管理员、审计员
```

Webhook payload 继续包含：

```text
category
targets
```

平台事件 payload 继续包含：

```text
alert_category
targets
```

## 前端

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 运营告警闭环 -> 通知投递审计
```

功能：

```text
1. 告警卡片手动通知后显示投递目标角色
2. 通知投递审计显示“自愈归档删除”分类标签
3. M109 分类进入风险通知标识
4. 失败或部分成功投递继续支持重试
```

## 参考设计

```text
images/frontend-reference-design/m109-通知任务自愈归档删除审批通知投递/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M109 只做手动通知投递识别、目标展示和投递审计分类。
2. M109 不改变 M107 的归档删除审批执行逻辑。
3. M109 不新增数据库表。
4. M109 不执行数据库迁移。
5. M109 不启动任何容器或中间件。
6. 自动首发通知任务留给 M110。

## 验收标准

- M108 自愈归档删除审批运营告警可以通过现有通知按钮投递。
- 后端通知事件记录 `alert_category=NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE`。
- Webhook payload 包含 `category` 和 `targets`。
- 前端告警卡片投递结果显示目标角色。
- 前端通知投递审计显示“自愈归档删除”分类标签。
- 前端通知投递审计将 M109 分类识别为风险通知。
- Control API typecheck 通过。
- Web typecheck 通过。
