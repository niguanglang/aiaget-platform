# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/security/page.tsx` | `/security` | No new route. |
| Unified approval card | `SecurityApprovalWorkbenchCard` in `security-policy-content.tsx` | Workbench queries | Existing card, extend labels only. |
| Type selector | `approvalWorkbenchTypes` | `SecurityApprovalWorkbenchType` | Add `AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE`. |
| Approval row | `SecurityApprovalWorkbenchRow` | `SecurityApprovalWorkbenchItem` | Existing row uses type label and risk domain. |
| Detail panel | `SecurityApprovalWorkbenchDetailPanel` | `SecurityApprovalWorkbenchDetail` | Existing metadata grid displays new archive/team/run fields. |
| Timeline | `SecurityApprovalTimelineItem` | `SecurityApprovalWorkbenchTimelineItem` | Existing delete event labels cover requested/approved/rejected/applied. |
| Backend aggregation | `SecurityApprovalWorkbenchService.loadAll` | `approval_audit_event` source type `AGENT_TEAM_RUN_REPORT_ARCHIVE` | Add approval audit event loader and item builder. |
| Backend review forwarding | `SecurityApprovalWorkbenchService.review` | `AgentTeamsService` | Forward approve/reject to team report archive delete methods. |
| Shared types | `packages/shared-types/src/index.ts` | `SecurityApprovalWorkbenchType` | Add new union value. |
| DTO validation | `ListSecurityApprovalWorkbenchDto` | class-validator `IsIn` | Add new type for query filter. |
| Product docs | `docs/product/` | milestone docs | Add M71 doc and README entry. |
