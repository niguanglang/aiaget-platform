# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/agent-teams/page.tsx` | `/agent-teams` | No new route. |
| Run workspace | `RunTraceWorkspace` | `AgentTeamDetail.runs/steps` | Add archive panel below report export. |
| Archive panel | New `RunReportArchivePanel` | `AgentTeamRunReportArchiveListResult` | Shows current run archive list and actions. |
| Archive create | API client `createAgentTeamRunReportArchive(runId)` | `POST /agent-teams/runs/:runId/report/archives` | Writes CSV to MinIO. |
| Archive download | API client `getAgentTeamRunReportArchiveDownloadUrl(archiveId)` | signed URL result | Opens short-lived URL. |
| Archive delete request | API client `deleteAgentTeamRunReportArchive(archiveId)` | returns approval id | Does not delete immediately. |
| Approval list | New compact section | `AgentTeamRunReportArchiveApprovalItem[]` | Show pending/approved/rejected/applied. |
| Approval actions | API client approve/reject | `security:approval:handle` | Buttons disabled without permission. |
| Backend storage | `StorageService` | `putTenantObject/listTenantObjects/getTenantObjectDownloadUrl/deleteTenantObject` | Reuse MinIO. |
| Backend audit | `ApprovalAuditEvent` | source type `AGENT_TEAM_RUN_REPORT_ARCHIVE` | Reuse event-based delete approval style. |
| Product docs | `docs/product/` | milestone docs | Add M70 doc and README entry. |
