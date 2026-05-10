# M151 归档删除审批字段账本上下文

## 背景

M150 已在安全中心 `/security/archives` 展示通知归档字段账本摘要。统一审批中心 `/approvals/archive-deletions` 也会聚合安全告警归档删除审批，如果这里不展示同样上下文，审批人在统一队列中仍无法确认待删除归档是否包含通知审计字段账本。

## 范围

- 页面：`/approvals/archive-deletions`
- 组件：`ArchiveDeletionApprovalsContent`
- 数据来源：`listSecurityOperationAlertNotificationArchiveApprovals`
- 字段：
  - `has_export_field_ledger`
  - `exported_field_count`
  - `notification_archive_filter_field_count`

## 页面规则

- 队列表格只在“归档文件”单元格内追加字段账本计数 chip。
- 详情面板在筛选上下文后追加同样的字段账本摘要。
- 不展示完整字段数组，不新增 JSON 展开区。
- 其他归档来源没有字段账本字段时不展示摘要。

## 验收标准

- 安全告警归档删除审批行展示 `通知归档字段账本：已保留`。
- 同一行和详情面板展示导出字段数与归档筛选字段数。
- 审批通过/拒绝流程不变。
- IA 合约保护页面不出现 `exported_fields`、`notification_archive_filter_fields` 或字段账本 JSON 预览。
