# Project UI Brief

- Page: M152 审批工作台详情字段账本
- Route: /security/alerts
- Feature goal: 在统一安全审批工作台详情轻量展示通知归档字段账本上下文
- Target users: 安全管理员、租户管理员、审计员；查看统一审批详情需要 `security:approval:view`。
- APIs/services: `getSecurityApprovalWorkbenchItem`、`listSecurityApprovalWorkbenchItems`、`reviewSecurityApprovalWorkbenchItem`。
- Entities/fields/statuses: `SecurityApprovalWorkbenchDetail.metadata` 和 `SecurityApprovalWorkbenchTimelineItem` 透出 `has_export_field_ledger`、`exported_field_count`、`notification_archive_filter_field_count`。
- Existing components/design system: `SecurityAlertsContent`、`ApprovalDetailPanel`、`DetailLine`、`StatusBadge`、`JsonBlock`、`SecurityConfirmDialog`、Tailwind CSS。
- Required states: no selection, loading, empty, error, read-only, handled approval.
- IA constraints: 详情面板增加轻量“通知归档字段账本”摘要，不在审批队列列表展开字段数组；metadata JSON 可保留为来源扩展调试区，但字段账本必须有独立可扫读摘要。
