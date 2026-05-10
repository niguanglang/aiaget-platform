# M142 归档删除审批筛选上下文聚合展示

## 背景

M141 已经让 `/security/archives` 可以展示通知审计归档创建时的筛选来源、筛选状态和筛选关键词，并把这些字段写入归档删除审批事件。统一审批工作台和 `/approvals/archive-deletions` 聚合审批页仍需要消费这些上下文，否则审批人进入归档删除队列后只能看到文件名和申请原因，无法判断删除对象是否来自“客户成功复盘归档删除”等具体通知审计筛选范围。

## 范围

本里程碑补齐归档删除审批聚合入口的筛选上下文：

1. 统一安全审批工作台详情 metadata 保留通知审计归档筛选上下文。
2. 统一安全审批工作台时间线节点保留同一筛选上下文。
3. `/approvals/archive-deletions` 聚合列表在文件信息下方以紧凑标签展示筛选来源、筛选状态和筛选关键词。
4. 聚合详情面板展示同一筛选上下文，方便审批人复核影响范围。
5. 客户成功复盘来源提供前端兜底中文标签“客户成功复盘归档删除”。

## 后端设计

`SecurityApprovalWorkbenchTimelineItem` 新增可选字段：

```ts
status_filter?: SecurityOperationAlertNotificationStatus | null;
alert_category?: string | null;
alert_category_label?: string | null;
keyword?: string | null;
```

`SecurityApprovalWorkbenchService` 在构造归档删除审批详情时，从事件 payload 提取并规范化：

```text
status_filter -> SENT / PARTIAL / SKIPPED / FAILED / null
alert_category -> 非空字符串 / null
alert_category_label -> 非空字符串 / null
keyword -> 非空字符串 / null
```

这些字段同时写入 `detail.metadata` 和 `detail.timeline`，确保列表页、详情页和审计时间线看到的是同一删除申请上下文。

## 前端设计

`/approvals/archive-deletions` 保持归档删除审批聚合页职责：查询、筛选来源、查看审批详情、批准或拒绝。页面不展示通知审计全文、客户成功机会详情或复盘报告正文。

列表和详情使用 `ArchiveFilterSummary` 统一渲染筛选上下文：

```text
筛选来源：客户成功复盘归档删除
筛选状态：已发送
筛选关键词：trace-customer
```

展示方式为文件信息下方和详情摘要区的小型标签组，不新增宽表格列，避免归档审批列表继续信息过载。

## 验收标准

1. 统一审批工作台详情 `metadata` 返回通知归档筛选上下文。
2. 统一审批工作台 `timeline` 返回同一筛选上下文。
3. `/approvals/archive-deletions` 源码契约包含 `archiveFilterSummary`、`statusFilter`、`alertCategoryLabel`、`筛选来源`、`筛选状态`、`筛选关键词`。
4. 客户成功复盘归档删除显示中文兜底标签“客户成功复盘归档删除”。
5. 目标后端测试、前端 IA 契约测试、前后端 typecheck 和 Web IA 测试通过。

## 前端参考设计

```text
images/frontend-reference-design/m142-归档删除审批筛选上下文聚合展示/
```
