# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/agent-teams/page.tsx`, `ConsoleShell` | route `/agent-teams`, permission `agent:team:view` | Reuse current console layout and Chinese copy. |
| Overview metrics | `MetricCard` in `agent-teams-content.tsx` | `getAgentTeamOverview`, `AgentTeamOverview` | Keep existing four-card strip; no new chart needed. |
| Filter toolbar and team table | Existing table/filter code in `agent-teams-content.tsx` | `listAgentTeams`, `AgentTeamListItem` | Add minimal policy/budget indicators only if space remains; avoid table overload. |
| Team detail panel | Existing selected team detail section | `getAgentTeam`, `AgentTeamDetail` | Show Supervisor model, failure policy, quality gate and budget values. |
| Team create/edit modal | `TeamForm` in `agent-teams-content.tsx` | `CreateAgentTeamInput`, `UpdateAgentTeamInput`, model options from `listModelProviders` | Add select/number/textarea fields; enforce validation through DTO and disabled state. |
| Runtime dispatch | `AgentTeamsService.buildRuntimeTeamRequest` | `RuntimeAgentTeamRequest.team` | Pass strategy/budget into Runtime without changing route. |
| Runtime supervisor logic | `apps/agent-runtime/app/runtime/team_execution.py` | `RuntimeAgentTeamSnapshot` | Prefer explicit Supervisor model, enforce token/cost budget and failure policy. |
| Feedback states | Existing `EmptyState`, query loading/error text, disabled buttons | React Query state and permissions | Keep Chinese empty/error/loading messages. |
