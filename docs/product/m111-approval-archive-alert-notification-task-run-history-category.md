# M111 审批与归档告警通知任务执行历史分类增强

## 目标

M111 在 M110 自动通知范围扩展基础上，为通知任务执行历史补充分类型覆盖统计。安全管理员可以在最近执行结果和任务执行历史中看到每次首发自动通知分别覆盖了多少 SLA 死信归档删除告警、多少通知任务自愈归档删除告警。

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 后端

扩展任务结果结构：

```text
SecurityOperationAlertNotificationTaskRunResult
```

新增字段：

```text
sla_dead_letter_notify_count
recovery_archive_delete_notify_count
```

写入时机：

```text
runAutoNotifyForTenant
```

统计规则：

```text
1. alert_id 属于 sla-dead-letter-archive-delete-* -> sla_dead_letter_notify_count + 1
2. alert_id 属于 notification-task-recovery-audit-archive-delete-* -> recovery_archive_delete_notify_count + 1
3. 自动重试任务不改变分类计数，默认 0
4. 历史旧事件缺少字段时按 0 兼容
```

扩展任务历史摘要：

```text
SecurityOperationAlertNotificationTaskRunOverview.summary
```

新增字段：

```text
sla_dead_letter_notify_count
recovery_archive_delete_notify_count
```

## 前端

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知任务中心 -> 任务执行历史与审计检索
```

展示：

```text
1. 历史摘要新增 SLA 覆盖
2. 历史摘要新增自愈覆盖
3. 每条任务执行记录在“扫描 / 通知 / 重试”列显示 SLA 与自愈覆盖数量
4. 最近执行结果新增 SLA 覆盖、自愈覆盖
```

## 参考设计

```text
images/frontend-reference-design/m111-自愈归档删除自动通知任务执行历史分类增强/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. M111 只增强任务结果 payload 和前端展示。
2. M111 不新增数据库表。
3. M111 不执行数据库迁移。
4. M111 不启动任何容器或中间件。
5. M111 不改变自动通知扫描策略和自动重试策略。

## 验收标准

- 自动通知任务结果写入 `sla_dead_letter_notify_count`。
- 自动通知任务结果写入 `recovery_archive_delete_notify_count`。
- 任务历史旧事件缺少新增字段时不报错，按 0 展示。
- 任务历史摘要展示 SLA 覆盖和自愈覆盖。
- 任务历史表格每行展示 SLA / 自愈覆盖数量。
- 最近执行结果展示 SLA 覆盖和自愈覆盖。
- Control API typecheck 通过。
- Web typecheck 通过。
