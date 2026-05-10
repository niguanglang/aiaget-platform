# Project UI Brief

- Page: M150 通知归档字段账本上下文
- Route: /security/archives
- Feature goal: 在归档治理页轻量展示通知审计归档字段账本上下文
- Target users: 安全管理员、租户管理员、审计员；需要 `security:approval:view` 查看归档与删除审批，处理动作需要 `security:approval:handle` 或租户管理员。
- APIs/services: `listSecurityOperationAlertNotificationArchives`、`listSecurityOperationAlertNotificationArchiveApprovals`、`getSecurityOperationAlertNotificationArchiveApprovalOverview`、`getSecurityOperationAlertNotificationArchiveDownloadUrl`、`deleteSecurityOperationAlertNotificationArchive`，并保留自愈审计归档和 SLA 死信归档现有服务。
- Entities/fields/statuses: `SecurityOperationAlertNotificationArchiveItem`、`SecurityOperationAlertNotificationArchiveApprovalItem`；核心字段为 `file_name`、`key`、`folder`、`size_bytes`、`last_modified`、`status_filter`、`alert_category_label`、`keyword`、`has_export_field_ledger`、`exported_field_count`、`notification_archive_filter_field_count`；审批状态为 `PENDING`、`APPROVED`、`REJECTED`、`APPLIED`。
- Existing components/design system: Next.js App Router `/security/archives`，`SecurityArchivesContent`，`SecurityWorkspaceHeader`，`SecurityPolicyBackground`，`MetricCard`，`Card`，`StatusBadge`，`EmptyState`，`LoadingRows`，`PageError`，`SecurityConfirmDialog`，Tailwind CSS。
- Required states: loading, empty, error, disabled, success, permission-denied, read-only approval handling.
- IA constraints: 列表页只展示字段账本摘要和数量，不展开 `exported_fields` 或完整 JSON；筛选上下文继续用轻量 badge；删除审批仍链接到审批中心闭环。
