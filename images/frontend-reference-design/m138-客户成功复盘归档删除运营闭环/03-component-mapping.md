# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-alerts-content.tsx` | `/security/alerts` route | Reuse existing `SecurityWorkspaceHeader` and page grid. |
| Customer success metric strip | `MetricCard` in `security-alerts-content.tsx` | `SecurityCenterOverview.approval_operations.customer_success_close_won_report_archive_delete_*` | Add compact metrics; do not add a separate page. |
| Approval type filter | Existing `approvalTypes` array | `SecurityApprovalWorkbenchType` | Add Chinese label “客户成功复盘归档删除”. |
| Approval list/detail | Existing approval list and `ApprovalDetailPanel` | `listSecurityApprovalWorkbenchItems`, `getSecurityApprovalWorkbenchItem` | Existing metadata JSON panel carries opportunity/archive context. |
| Review actions | Existing `SecurityConfirmDialog` + `reviewMutation` | `reviewSecurityApprovalWorkbenchItem` | No new frontend mutation needed. |
| Operation alert card | Existing `OperationAlertCard` | `operational_alerts` from `getSecurityCenterOverview` | New alert IDs render through existing card. |
| Cache invalidation | `invalidateApprovalWorkbenchSourceQueries` | React Query keys | Add customer success archive approval and archive list query keys. |
| Feedback states | Existing `PageError`, `EmptyState`, `LoadingRows`, success notices | Query/mutation states | Keep Chinese text. |
