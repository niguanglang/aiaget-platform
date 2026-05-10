# Project UI Brief

- Page: M151 归档删除审批字段账本上下文
- Route: /approvals/archive-deletions
- Feature goal: 在归档删除审批聚合页轻量展示通知归档字段账本上下文
- Target users: 安全管理员、租户管理员、审计员；审批动作由 `security:approval:handle` 或租户管理员控制。
- APIs/services: `listSecurityOperationAlertNotificationArchiveApprovals`、`approveSecurityOperationAlertNotificationArchiveApproval`、`rejectSecurityOperationAlertNotificationArchiveApproval`，并保留审批审计、自愈审计、SLA 死信、Agent 团队报告、客户成功复盘归档删除审批聚合。
- Entities/fields/statuses: 聚合 `ArchiveApprovalItem` 需要增加 `hasExportFieldLedger`、`exportedFieldCount`、`notificationArchiveFilterFieldCount`；来源对象为 `SecurityOperationAlertNotificationArchiveApprovalItem`。
- Existing components/design system: `ArchiveDeletionApprovalsContent`、`ApprovalPageShell`、`CardSection`、`DecisionActions`、`DetailRow`、`StatusBadge`、`MetricCard`、Tailwind CSS。
- Required states: loading, empty, error, disabled, read-only approval handling, pending approval action.
- IA constraints: 队列和详情只展示“字段账本已保留/导出字段数/归档筛选字段数”，不展示完整字段数组或 JSON；完整上下文仍在来源页面、安全事件详情和 CSV 中查看。
