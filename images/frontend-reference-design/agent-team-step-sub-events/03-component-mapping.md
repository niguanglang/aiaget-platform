# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/agent-teams/page.tsx` | route `/agent-teams` | No new route. |
| Run selector and summary | `RunTraceWorkspace`, `RunSummaryPanel` in `agent-teams-content.tsx` | `AgentTeamRunSummary` | Reuse existing run selector and metrics. |
| Step timeline | `StepTimeline` | `AgentTeamStepItem[]` | Keep left timeline; show selected step. |
| Step detail header | `StepDetailPanel` | `AgentTeamStepItem` | Extend, do not replace. |
| Child event timeline | New section inside `StepDetailPanel` | `AgentTeamStepItem.child_steps` using `ConversationRunStepItem` shape | Shows prompt/tool/knowledge/response child steps. |
| RAG references | New compact list inside detail | `AgentTeamStepItem.references` using `ConversationReferenceItem` shape | Empty state when no references. |
| Tool calls | New compact list inside detail | `AgentTeamStepItem.tool_calls` using `ConversationToolCallItem` shape | Status badge and output/error preview. |
| Model call | New compact card inside detail | `AgentTeamStepItem.model_call` | Request model, tokens, latency, preview/error. |
| Persistence | `agent_team_step` JSON fields | Prisma `Json?` columns | Store sub-events on the corresponding `AGENT_RUN` step. |
| Runtime mapping | `AgentTeamsService.persistRuntimeTeamRun` | `RuntimeAgentTeamResponse.member_results` | Merge member result internals into matching team step before persist. |
