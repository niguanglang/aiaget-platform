# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-recovery-content.tsx` | `/security/recovery` route | Reuse existing `SecurityWorkspaceHeader` and page grid. |
| Task metrics | `MetricCard` | `getSecurityOperationAlertNotificationTaskOverview`, `getSecurityCenterOverview` | No new route or page. |
| Task run history | Existing task run list | `listSecurityOperationAlertNotificationTaskRuns` | Keep rows compact. |
| Failure source filter | Existing `failureSources` array | `SecurityOperationAlertNotificationTaskRecoveryFailureSource` | Add “客户成功复盘归档删除”. |
| Self-healing suggestions | Existing suggestion cards | `notification_task_recovery_suggestions` | Show source badge and customer success failed count. |
| Recovery audit | Existing recovery audit list | `listSecurityOperationAlertNotificationTaskRecoveryAudits` | Filter by new failure source; no customer success detail panels. |
| Archive approval summary | Existing archive queries | Recovery audit archive APIs | Unchanged; M139 does not add archive type. |
