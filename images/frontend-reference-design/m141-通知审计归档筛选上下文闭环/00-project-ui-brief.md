# Project UI Brief

- Page: m141-通知审计归档筛选上下文闭环
- Route: /security/archives
- Feature goal: 通知审计归档展示状态、来源和关键词筛选上下文
- Target users/permissions: 安全管理员、审计员、租户管理员；页面查看需要 `security:approval:view` 或租户管理员角色，删除审批处理需要 `security:approval:handle` 或租户管理员角色。
- APIs/services: `listSecurityOperationAlertNotificationArchives`, `listSecurityOperationAlertNotificationArchiveApprovals`, `getSecurityOperationAlertNotificationArchiveApprovalOverview`, `getSecurityOperationAlertNotificationArchiveDownloadUrl`, `deleteSecurityOperationAlertNotificationArchive`；同页继续复用自愈审计归档与 SLA 死信归档接口。
- Entities/fields/statuses: `SecurityOperationAlertNotificationArchiveItem` 和 `SecurityOperationAlertNotificationArchiveApprovalItem` 增加 `status_filter`, `alert_category`, `alert_category_label`, `keyword`；通知状态 `SENT/PARTIAL/SKIPPED/FAILED` 显示为中文；客户成功来源 `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE` 显示为“客户成功复盘归档删除”。
- Existing components/design system: Next.js App Router；Tailwind CSS；现有 `SecurityWorkspaceHeader`、`MetricCard`、`StatusBadge`、`Card`、`Button`、`EmptyState`、`LoadingRows`、`PageError`、`RefreshButton`、`SecurityConfirmDialog`。
- Page responsibility: `/security/archives` 只负责归档文件、下载、对象存储元信息、删除申请和删除审批上下文；不展示通知审计明细列表、客户成功机会详情或复盘报告正文。
- Required states: loading, empty, error, disabled, success, permission-denied, readonly approval state
