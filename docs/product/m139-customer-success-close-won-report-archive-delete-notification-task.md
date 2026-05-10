# M139 客户成功复盘归档删除通知任务闭环

## 背景

M138 已经把客户成功成交复盘报告归档删除审批接入安全中心运营告警和统一审批工作台。M139 继续补齐通知任务闭环：该类告警进入首发自动通知扫描，通知任务失败后在自愈建议、恢复审计和来源筛选中保持独立分类，避免混入团队报告或未知来源。

## 范围

- 首发自动通知扫描范围新增客户成功复盘归档删除待审和拒绝偏多告警。
- 通知任务结果新增客户成功复盘归档删除通知计数。
- 安全中心总览新增客户成功复盘归档删除通知失败来源计数。
- 自愈建议、恢复审计、CSV 导出和失败来源标签支持客户成功复盘归档删除。
- 前端 `/security/recovery` 恢复页新增客户成功复盘归档删除失败来源筛选和建议计数展示。
- 不新增表结构、不执行迁移、不新增中间件、不启动容器。

## 自动通知范围

新增纳入首发自动通知扫描：

```text
customer-success-close-won-report-archive-delete-pending
customer-success-close-won-report-archive-delete-rejected-risk
```

新增来源失败告警：

```text
operation-alert-notification-task-customer-success-close-won-report-archive-failure-source
```

保留既有规则：

```text
1. 告警必须处于非 CLOSED 状态
2. 告警必须在回看窗口内没有通知记录
3. 单次最多处理 auto_notify_batch_size 条
4. 通知渠道使用 IN_APP + WEBHOOK
5. 失败或部分成功投递继续进入既有自动重试链路
```

## 后端契约

`SecurityOperationAlertNotificationTaskRunResult` 新增：

```text
customer_success_close_won_report_archive_delete_notify_count
```

`SecurityOperationAlertNotificationTaskRunOverview.summary` 新增：

```text
customer_success_close_won_report_archive_delete_notify_count
```

`SecurityCenterOverview.approval_operations` 新增：

```text
notification_task_customer_success_close_won_report_archive_delete_failed_24h
```

`SecurityOperationAlertNotificationTaskRecoveryFailureSource` 新增：

```text
CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE
```

自愈建议和恢复审计新增：

```text
customer_success_close_won_report_archive_delete_failed_count
customer_success_close_won_report_archive_delete_source_count
```

## 页面职责

- `/security/recovery` 展示通知任务健康、自愈建议、恢复审计、失败来源筛选和归档审批入口。
- `/security/alerts` 继续负责运营告警、统一审批工作台和手动通知动作。
- 客户成功机会详情和成交复盘报告正文仍在客户成功模块，不进入安全恢复页。
- 本模块不新增独立页面，只增强现有恢复页的数据来源和筛选标签。

## 参考设计

```text
images/frontend-reference-design/m139-客户成功复盘归档删除通知任务闭环/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 验收

- 自动首发通知扫描客户成功复盘归档删除待审告警。
- 自动首发通知扫描客户成功复盘归档删除拒绝偏多告警。
- 任务结果和任务历史摘要写入客户成功复盘通知计数。
- 安全中心总览可以生成客户成功复盘通知来源失败告警。
- 自愈建议和恢复审计保留 `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE` 来源。
- 前端恢复页可筛选并显示“客户成功复盘归档删除”。
- 共享类型构建、后端专项测试、前端 IA 契约、前后端 typecheck 通过。
