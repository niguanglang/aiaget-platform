# M138 客户成功成交复盘报告归档删除审批运营闭环

## 背景

M137 已经把续约机会成交复盘报告归档删除改为审批化，但安全中心侧还缺少对应的统一运营指标、风险信号和工作台分类。M138 把客户成功复盘归档删除接入安全中心审批运营闭环，让安全管理员可以在同一个入口看到待审、已批准、已拒绝和已生效状态，并通过统一审批工作台处理。

## 范围

- 安全审批工作台新增客户成功复盘归档删除类型。
- 安全中心总览新增客户成功复盘归档删除审批运营指标。
- 安全中心运营告警新增客户成功复盘归档删除待审和拒绝风险信号。
- 前端安全中心告警页新增客户成功复盘归档删除运营卡片和筛选项。
- 复用 M137 的 `approval_audit_event` 事件，不新增表结构、不新增中间件、不启动容器。

## 审批工作台类型

```text
CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE
```

来源事件：

```text
approval_audit_event.source_type = CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE
```

纳入时间线的事件类型：

```text
DELETE_REQUESTED
APPROVED
REJECTED
DELETE_APPLIED
```

## 安全中心指标

`SecurityCenterOverview.approval_operations` 新增字段：

```text
customer_success_close_won_report_archive_delete_pending
customer_success_close_won_report_archive_delete_approved
customer_success_close_won_report_archive_delete_rejected
customer_success_close_won_report_archive_delete_applied
```

## 风险与告警

新增风险信号：

```text
customer-success-close-won-report-archive-delete-pending-risk
customer-success-close-won-report-archive-delete-rejected-risk
```

新增运营告警分类：

```text
CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE
```

## 页面职责

- `/security/alerts` 只展示审批运营指标、风险信号、筛选和统一处置入口。
- `/customer-success-opportunities/[id]/close-won-report` 继续负责报告正文、归档列表和删除申请。
- 归档审批详情和审批操作仍走统一审批工作台，不在客户成功列表页内塞入审批明细。
- 续约机会列表页、分析页和报告详情页不承担安全运营看板职责。

## 缓存联动

统一审批工作台处理客户成功复盘归档删除审批后，前端需要刷新：

```text
security-center-overview
security-approval-workbench
customer-success-close-won-report-archive-approvals
customer-success-opportunity-close-won-report-archives
```

## 验收

- 安全审批工作台可筛选客户成功复盘归档删除审批。
- 客户成功复盘归档删除审批可在统一工作台批准或拒绝。
- 安全中心总览返回客户成功复盘归档删除待审、批准、拒绝、已生效统计。
- 安全中心告警页展示客户成功复盘归档删除运营卡片。
- 有待审或拒绝审批时产生对应风险信号和运营告警。
- 共享类型构建、后端审批工作台测试、后端安全中心总览测试、前端 IA 契约测试和 typecheck 通过。
