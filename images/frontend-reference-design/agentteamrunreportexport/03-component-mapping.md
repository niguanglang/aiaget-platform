# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/agent-teams/page.tsx` | route `/agent-teams` | No new route. |
| Run selector action bar | `RunTraceWorkspace` in `agent-teams-content.tsx` | `AgentTeamRunSummary` | Add export button next to Trace actions. |
| Report coverage badges | New `RunReportExportPanel` or compact inline block | selected run + selected steps | Shows included report sections. |
| Export action | New API client `exportAgentTeamRunReport(runId)` | `GET /agent-teams/runs/:runId/report/export` | Downloads CSV Blob. |
| Export loading/error state | `useMutation` in `AgentTeamsContent` | Blob request | Disable while exporting and show `formError`. |
| Backend controller | `AgentTeamsController` | `AgentTeamsService.exportRunReport` | Set `text/csv; charset=utf-8` and content disposition. |
| Backend service | `AgentTeamsService` | Prisma team/run/steps/handoffs/feedback | Build CSV from current tenant data. |
| Shared types | `packages/shared-types/src/index.ts` | Optional report metadata types | Add lightweight result/coverage type only if needed. |
| Product docs | `docs/product/` | milestone docs | Add report export milestone and README entry. |
