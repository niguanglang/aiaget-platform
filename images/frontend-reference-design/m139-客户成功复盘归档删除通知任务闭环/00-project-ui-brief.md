# Project UI Brief

- Page: m139-客户成功复盘归档删除通知任务闭环
- Route: /security/recovery
- Feature goal: 客户成功复盘归档删除审批告警纳入通知任务和自愈失败来源
- Target users/permissions: 安全管理员、审计员、租户管理员；查看恢复页需要安全中心查看权限，任务动作沿用 `security:rule:view`。
- APIs/services: `getSecurityCenterOverview`, `getSecurityOperationAlertNotificationTaskOverview`, `listSecurityOperationAlertNotificationTaskRuns`, `listSecurityOperationAlertNotificationTaskRecoveryAudits`, `listSecurityOperationAlertNotificationTaskRecoveryAuditArchiveApprovals`, `listSecurityOperationAlertNotificationTaskRecoveryAuditArchives`。
- Entities/fields/statuses: `SecurityOperationAlertNotificationTaskRecoveryFailureSource` 新增 `CUSTOMER_SUCCESS_CLOSE_WON_REPORT_ARCHIVE_DELETE`；任务结果字段 `customer_success_close_won_report_archive_delete_notify_count`；自愈建议和恢复审计字段 `customer_success_close_won_report_archive_delete_failed_count`；任务状态 `SUCCESS/FAILED/SKIPPED`，恢复动作 `ACKNOWLEDGE/IGNORE/RESOLVE`。
- Existing components/design system: Next.js App Router；Tailwind CSS；现有 `SecurityWorkspaceHeader`、`MetricCard`、`StatusBadge`、`Card`、`Button`、`EmptyState`、`LoadingRows`、`PageError`、`RefreshButton`。
- Page responsibility: `/security/recovery` 只展示通知任务健康、自愈建议、恢复审计和归档审批摘要，不展示客户成功机会列表或成交复盘报告正文。
- Required states: loading, empty, error, validation, disabled, success, permission-denied
