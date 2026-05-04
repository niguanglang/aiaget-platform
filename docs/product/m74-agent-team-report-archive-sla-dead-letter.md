# M74 团队运行报告归档删除 SLA 通知与死信来源闭环

## 目标

在 M73 已经把团队运行报告归档删除接入审批告警自动通知分类后，继续把该来源贯通到 SLA 超时通知、自动重试、失败死信、死信处置审计和审计归档。

完成后，安全中心可以在同一条 SLA 通知链路里识别：

```text
团队报告归档删除 -> SLA 超时通知 -> 自动重试 -> 死信处置 -> 审计导出/归档
```

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 后端改动

扩展共享类型：

```text
SecurityOperationAlertSlaItem.alert_category
SecurityOperationAlertSlaNotificationItem.alert_category
SecurityOperationAlertSlaDeadLetterAuditItem.alert_category
ListSecurityOperationAlertSlaDeadLetterAuditsParams.alert_category
```

扩展 SLA 事件写入：

```text
platform.security.approval_operation_alert_sla.notification_sent
platform.security.approval_operation_alert_sla.dead_letter_action
platform.security.approval_operation_alert.escalated
```

新增或兼容写入字段：

```text
alert_category
```

历史事件没有 `alert_category` 时，后端会根据 `alert_id` 反推分类，避免做数据迁移。

## 分类规则

当前重点分类：

```text
AGENT_TEAM_REPORT_ARCHIVE_DELETE
SLA_DEAD_LETTER_ARCHIVE_DELETE
NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE
NOTIFICATION_TASK_MIXED_FAILURE_SOURCE
NOTIFICATION_TASK
ARCHIVE_OPERATION
NOTIFICATION_POLICY
RUNTIME_APPROVAL
SECURITY_OPERATION
```

其中团队运行报告归档删除覆盖：

```text
agent-team-report-archive-delete-pending
agent-team-report-archive-delete-rejected-risk
operation-alert-notification-task-agent-team-report-archive-failure-source
```

## 前端改动

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> SLA 超时通知
审批与归档运营 -> SLA 通知自动重试与失败死信
审批与归档运营 -> SLA 通知死信处置闭环
审批与归档运营 -> SLA 死信处置审计时间线
```

新增能力：

```text
1. SLA 通知列表展示来源分类标签。
2. 可重试通知队列展示来源分类标签。
3. 失败死信卡片展示来源分类标签。
4. 死信处置队列展示来源分类标签。
5. 死信处置审计行展示来源分类标签。
6. 死信处置审计支持按来源分类筛选。
7. CSV 导出和审计归档透传来源分类筛选条件。
```

## 参考设计

```text
images/frontend-reference-design/security-agent-team-report-archive-sla-dead-letter/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. 不新增独立 SLA 通知服务。
2. 不新增数据库表。
3. 不执行数据库迁移。
4. 不启动任何容器或中间件。
5. 不改变现有 SLA 通知、自动重试和死信处置策略，只补来源分类透传和筛选。

## 验收标准

1. 新 SLA 通知事件写入 `alert_category=AGENT_TEAM_REPORT_ARCHIVE_DELETE`。
2. 历史 SLA 通知事件可按 `alert_id` 反推团队报告归档删除来源。
3. 死信处置事件写入并返回来源分类。
4. 死信处置审计列表支持 `alert_category` 筛选。
5. 死信处置审计 CSV 包含来源分类列。
6. 审计归档创建时透传当前来源分类筛选条件。
7. `/security` 页面所有新增展示文案为中文。
8. Control API typecheck 通过。
9. Web typecheck 通过。
