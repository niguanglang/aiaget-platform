# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/agent-teams/page.tsx` | route `/agent-teams` | Reuse existing route and shell. |
| Team list/detail | `AgentTeamsContent` | `listAgentTeams`, `getAgentTeam` | No visual rewrite. |
| Run selector | `RunTraceWorkspace` | `AgentTeamDetail.runs` | Keep existing select and Trace actions. |
| Current run summary | `RunSummaryPanel` | `AgentTeamRunSummary` | Reuse, then add replay panel below. |
| Step timeline/detail | `StepTimeline`, `StepDetailPanel` | `AgentTeamStepItem[]` | Keep M67 child event view. |
| Replay summary | New `RunReplayPanel` inside `agent-teams-content.tsx` | selected run + selected steps | Shows current run replay metrics. |
| Previous-run comparison | New `RunComparePanel` | current run/steps vs previous run/steps | Derived frontend-only from existing data. |
| Member delta rows | New `MemberDeltaList` | steps grouped by `agent_id/member_id/agent_name` | Compare duration, token, cost, output summary. |
| RAG/tool/model deltas | New compact sections in compare panel | `references`, `tool_calls`, `model_call`, `child_steps` | No new backend fields except exposing `run_id` on step. |
| Type contract | `packages/shared-types/src/index.ts` | `AgentTeamStepItem.run_id` | Add `run_id` for exact filtering. |
| Control API mapping | `AgentTeamsService.mapStep` | Prisma `AgentTeamStep.runId` | Return `run_id`. |
| Product docs | `docs/product/` | milestone docs | Add M68 doc and README entry. |
