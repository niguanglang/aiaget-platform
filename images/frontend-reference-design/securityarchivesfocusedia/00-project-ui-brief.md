# Project UI Brief

- Page: SecurityArchivesFocusedIA
- Route: /security/archives
- Feature goal: 安全中心归档文件、删除审批和对象存储治理独立页面
- Target users and permissions: 安全管理员、审计员、租户管理员；查看使用 `security:approval:view`，批准/拒绝/删除申请处理使用 `security:approval:handle`。
- APIs/services: `listSecurityOperationAlertNotificationArchives`, `deleteSecurityOperationAlertNotificationArchive`, `listSecurityOperationAlertNotificationArchiveApprovals`, `getSecurityOperationAlertNotificationArchiveApprovalOverview`; `listSecurityOperationAlertNotificationTaskRecoveryAuditArchives`, `deleteSecurityOperationAlertNotificationTaskRecoveryAuditArchive`, `listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals`, `getSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovalOverview`; `listSecurityOperationAlertSlaDeadLetterAuditArchives`, `deleteSecurityOperationAlertSlaDeadLetterAuditArchive`, `listSecurityOperationAlertSlaDeadLetterAuditArchiveApprovals`, `getSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview`.
- Entities/fields/statuses: archive items with `id`, `key`, `file_name`, `folder`, `size_bytes`, `last_modified`; approval items with `archive_id`, `archive_key`, `archive_file_name`, `archive_size_bytes`, `status`, `requested_by`, `reviewed_by`, `requested_at`, `reviewed_at`; statuses `PENDING`, `APPROVED`, `REJECTED`, `APPLIED`.
- Existing components/design system: Next.js App Router under `apps/web/src/app/(console)/security`, Tailwind CSS, `SecurityWorkspaceHeader`, `RefreshButton`, `PageError`, `LoadingRows`, `MetricCard`, `StatusBadge`, `Card`, `Button`, `EmptyState`.
- Required states: loading, empty, error, permission denied, disabled actions, deletion confirmation, mutation notice/error, archive source tabs, approval summaries.
- IA constraint: `/security/archives` is a focused menu-level page for archive files and delete approvals. It must not become a general alert/recovery dashboard.
