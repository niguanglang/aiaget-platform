# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/agent-teams/page.tsx`, `AgentTeamsContent` | Console layout | Reuse existing route and page entry. |
| Header and KPI strip | `MetricCard`, `StatusBadge` | `AgentTeamOverview` | Keep Chinese labels and existing M63 badges. |
| Team table and filters | Existing table inside `AgentTeamsContent` | `listAgentTeams`, `AgentTeamListItem` | Preserve current search/status/mode/owner filters. |
| Team detail panel | Existing aside in `AgentTeamsContent` | `getAgentTeam`, `AgentTeamDetail` | Add compact run stats and trace access without changing API. |
| Member responsibility cards | Existing member section | `AgentTeamMemberItem` | Keep member edit/remove actions gated by manage permission. |
| Run selector | New local section in `AgentTeamsContent` | `AgentTeamRunSummary[]` | Select one run from `selectedTeam.runs`, default latest. |
| Run summary metrics | New local cards | `AgentTeamRunSummary` | Show steps, failed steps, tokens, cost, latency, trace/request IDs. |
| Step timeline | New local component/functions | `AgentTeamStepItem[]` filtered by selected run trace when possible | Timeline uses `step_type`, `status`, `agent_name`, token/cost/latency, span IDs. |
| Selected step detail | New local detail panel | `AgentTeamStepItem` | Show input/output/error, model-like token fields, trace/span metadata. |
| Trace entry | Link to `/monitor?keyword=<trace_id>` | existing monitor page query | Reuse Monitor Center instead of adding a new backend endpoint. |
| Handoff list | New local cards | `AgentTeamHandoffItem[]` | Show source/target agents, status, reason and decision note. |
| Feedback list | New local cards | `AgentTeamFeedbackItem[]` | Show rating, comment, author and timestamp. |
| Handoff/feedback forms | Existing form area | `createAgentTeamHandoff`, `createAgentTeamFeedback` | Keep validation and disabled state with `agent:team:run`. |
| Loading/empty/error states | Existing inline states + `EmptyState` where useful | React Query state | Keep all visible text in Chinese. |
