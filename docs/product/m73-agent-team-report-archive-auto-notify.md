# M73 团队运行报告归档删除审批告警自动通知分类

## 目标

在 M72 已经把团队运行报告归档删除审批接入安全中心运营看板和告警闭环后，继续把该类告警接入审批与归档告警自动通知任务分类。

完成后，安全中心可以同时追踪三类归档删除审批告警来源：

```text
SLA 死信归档删除
团队运行报告归档删除
通知任务自愈归档删除
```

本模块不新增数据库表、不执行迁移、不启动容器、不安装中间件。

## 自动通知范围

新增纳入首发自动通知扫描：

```text
agent-team-report-archive-delete-pending
agent-team-report-archive-delete-rejected-risk
```

新增来源失败告警：

```text
operation-alert-notification-task-agent-team-report-archive-failure-source
```

保留既有过滤规则：

```text
1. 告警必须处于非 CLOSED 状态
2. 告警必须在回看窗口内没有通知记录
3. 单次最多处理 auto_notify_batch_size 条
4. 通知渠道使用 IN_APP + WEBHOOK
5. 失败或部分成功的投递继续进入自动重试链路
```

## 后端改动

扩展任务结果结构：

```text
SecurityOperationAlertNotificationTaskRunResult
```

新增字段：

```text
agent_team_report_archive_delete_notify_count
```

扩展任务历史摘要：

```text
SecurityOperationAlertNotificationTaskRunOverview.summary.agent_team_report_archive_delete_notify_count
```

扩展安全中心总览：

```text
SecurityCenterOverview.approval_operations.notification_task_agent_team_report_archive_delete_failed_24h
```

扩展自愈建议和自愈闭环审计：

```text
AGENT_TEAM_REPORT_ARCHIVE_DELETE
agent_team_report_archive_delete_failed_count
agent_team_report_archive_delete_source_count
```

## 前端改动

页面：

```text
/security
```

增强区域：

```text
审批与归档运营 -> 通知任务中心
审批与归档运营 -> 任务执行历史与审计检索
审批与归档运营 -> 自愈闭环审计检索
```

新增展示：

```text
1. 通知任务中心增加 M72 团队归档标识
2. 待自动通知说明覆盖 SLA / 团队 / 自愈归档删除
3. 通知任务失败聚合新增团队失败来源
4. 来源失败告警横幅新增团队报告数量
5. 执行历史摘要新增团队覆盖
6. 执行历史行内新增团队来源 badge
7. 最近执行结果新增团队覆盖
8. 自愈闭环审计新增团队来源统计和筛选项
9. 自愈建议卡片和审计行新增团队报告失败数
```

## 参考设计

```text
images/frontend-reference-design/security-agent-team-report-archive-auto-notify/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 边界

1. 不新增独立任务服务。
2. 不新增数据库表。
3. 不执行数据库迁移。
4. 不启动任何容器或中间件。
5. 不改变自动重试策略，只让新增分类的失败或部分成功投递自然进入现有重试链路。

## 验收标准

1. 自动首发通知扫描范围包含团队运行报告归档删除待审告警。
2. 自动首发通知扫描范围包含团队运行报告归档删除拒绝偏多告警。
3. 任务结果写入 `agent_team_report_archive_delete_notify_count`。
4. 任务历史摘要和行内 badge 展示团队覆盖数量。
5. 安全中心 overview 返回团队报告通知失败来源数量。
6. 自愈建议证据和审计记录支持团队报告失败来源。
7. 前端筛选项支持 `AGENT_TEAM_REPORT_ARCHIVE_DELETE`。
8. Control API typecheck 通过。
9. Web typecheck 通过。
