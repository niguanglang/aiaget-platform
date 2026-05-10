# Project UI Brief

- Page: M153 审批工作台导出字段账本计数
- Route: /security/alerts
- Feature goal: 统一安全审批工作台导出带上通知归档字段账本计数
- Target users: 安全管理员、租户管理员、审计员。
- APIs/services: `exportSecurityApprovalWorkbenchItems`、`listSecurityApprovalWorkbenchItems`、`getSecurityApprovalWorkbenchItem`。
- Entities/fields/statuses: `SecurityApprovalWorkbenchDetail.metadata` 中的 `has_export_field_ledger`、`exported_field_count`、`notification_archive_filter_field_count`，CSV 字段清单需要增加字段账本三列。
- Existing components/design system: `SecurityAlertsContent`、审批工作台导出按钮、通知提示块、Tailwind CSS、`StatusBadge`。
- Required states: no result disabled, exporting pending, success notice, error notice.
- IA constraints: 导出提示说明 CSV 包含字段账本计数；列表不增加新列，不展开完整字段数组。
