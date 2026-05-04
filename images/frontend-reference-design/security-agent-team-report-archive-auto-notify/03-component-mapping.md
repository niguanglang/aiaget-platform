# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/security/page.tsx` | `/security` | No new route. |
| Security content | `SecurityPolicyContent` | security center queries | Existing page state and query hooks. |
| Notification task center | `OperationAlertNotificationTaskCenter` | `SecurityOperationAlertNotificationTaskOverview` | Add team report wording and badges. |
| Auto notify metrics | `MetricCard`, `SummaryTile` | `pending_auto_notify_count`, task result counts | Show SLA/team/recovery source coverage. |
| Run history | `OperationAlertNotificationTaskRunHistoryCard` | `SecurityOperationAlertNotificationTaskRunOverview.summary` | Add `agent_team_report_archive_delete_notify_count`. |
| Run history row | `OperationAlertNotificationTaskRunRow` | `SecurityOperationAlertNotificationTaskRunItem` | Add team source badge. |
| Recovery audit | `OperationAlertNotificationTaskRecoveryAuditCard` | `SecurityOperationAlertNotificationTaskRecoveryAuditOverview` | Add team source metric and filter option. |
| Backend task service | `SecurityOperationAlertNotificationTaskService` | platform events payload | Add team report alert IDs and payload count. |
| Backend overview | `SecurityCenterService` | notification task platform events | Add team failed source aggregation and alert category. |
| Shared types | `packages/shared-types/src/index.ts` | task and security overview contracts | Add new team count fields. |
| Product docs | `docs/product/` | milestone docs | Add M73 doc and README entry. |
