# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/security/page.tsx` | `/security` | No new route. |
| Operations card | `ApprovalArchiveOperationsCard` in `security-policy-content.tsx` | `SecurityCenterOverview.approval_operations` | Add team report archive delete metrics. |
| Summary tile | `OperationMetricTile` | numeric fields | Include team report pending in total helper. |
| Team report band | New section inside existing card | `agent_team_report_archive_delete_*` | Four metric tiles plus link to workbench. |
| Operational alerts | Existing `OperationAlertCard` list | `operational_alerts` | New alert IDs map through existing list. |
| Backend overview | `SecurityCenterService.loadApprovalOperations` | `approval_audit_event` source type `AGENT_TEAM_RUN_REPORT_ARCHIVE` | Summarize pending/approved/rejected/applied. |
| Backend risks | `buildRiskSignals` and `buildApprovalOperationAlerts` | new stats | Add pending and rejected-risk signals. |
| Shared types | `packages/shared-types/src/index.ts` | `SecurityCenterOverview` | Add new fields. |
| Product docs | `docs/product/` | milestone docs | Add M72 doc and README entry. |
