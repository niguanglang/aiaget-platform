# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `SecurityWorkspaceHeader`, `SecurityPolicyBackground` | `/security/recovery` route | Keep existing security console visual language |
| Metrics row | `MetricCard` | task overview, security overview | Summary only, no detail overload |
| Task run actions | `Button`, `useMutation` | `runSecurityOperationAlertNotificationAutoNotify`, `runSecurityOperationAlertNotificationAutoRetry` | Refresh overview and run history after completion |
| Task run history | existing card/list markup | `listSecurityOperationAlertNotificationTaskRuns` | Compact list with filters |
| Recovery suggestions | `StatusBadge`, `Button`, `SecurityConfirmDialog` | `SecurityOperationAlertNotificationTaskRecoverySuggestion`, `updateSecurityOperationAlertNotificationTaskRecoverySuggestion` | Row actions: acknowledge, ignore, resolve |
| Recovery audit toolbar | `Button`, `Download` icon | `exportSecurityOperationAlertNotificationTaskRecoveryAudits`, `createSecurityOperationAlertNotificationTaskRecoveryAuditArchive` | Uses active filters |
| Recovery audit list | existing card/list markup | `listSecurityOperationAlertNotificationTaskRecoveryAudits` | Keep trace/request/replay identifiers compact |
| Archive approval evidence | `MetricCard`, `StatusBadge` | archive list and approval overview APIs | Read-only summary; review remains in approval routes |
