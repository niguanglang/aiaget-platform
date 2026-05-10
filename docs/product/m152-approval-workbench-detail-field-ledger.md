# M152 审批工作台详情字段账本

## 背景

M149-M151 已经让通知归档、归档治理页和归档删除审批聚合页保留并展示字段账本计数。统一安全审批工作台 `/security/alerts` 的详情面板仍主要通过 `metadata` JSON 查看来源扩展信息，审批人需要手动查找字段才能确认字段账本是否保留。

## 范围

- 后端：`SecurityApprovalWorkbenchService`
- 前端：`SecurityAlertsContent` 的 `ApprovalDetailPanel`
- 类型：`SecurityApprovalWorkbenchTimelineItem`
- 字段：
  - `has_export_field_ledger`
  - `exported_field_count`
  - `notification_archive_filter_field_count`

## 实现规则

- 后端把归档删除审批平台事件中的字段账本计数映射到统一审批详情 `metadata`。
- 后端把同样字段映射到统一审批详情时间线事件。
- 前端详情面板在“审批原因”和“来源扩展信息”之间展示轻量字段账本摘要。
- 时间线事件在具备字段账本上下文时展示轻量 chip。
- 不把完整字段数组塞进审批队列列表。

## 验收标准

- `getSecurityApprovalWorkbenchItem` 返回的通知归档删除审批详情包含字段账本计数。
- `/security/alerts` 详情面板出现 `通知归档字段账本：已保留`、`导出字段：N 项`、`归档筛选字段：N 项`。
- 审批通过/拒绝流程保持不变。
- 前端 IA 合约验证该摘要存在。
