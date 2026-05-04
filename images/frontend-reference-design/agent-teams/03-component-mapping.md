# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page route | `apps/web/src/app/(console)/agent-teams/page.tsx` | `/agent-teams` route | New console page under existing shell |
| Page content | `apps/web/src/components/agent-teams/agent-teams-content.tsx` | `AgentTeamOverview`, `AgentTeamListItem`, `AgentTeamDetail` | New feature component, reuse AgentsContent layout density |
| Header/KPI | `MetricCard`, `StatusBadge`, `Button` | `GET /api/v1/agent-teams` overview fields | Chinese visible copy |
| Filter toolbar | Native inputs/selects + `Button` | list query: keyword, status, owner_id | Match existing table filters |
| Team table | Local table markup | `AgentTeamListItem` | Columns: 团队、状态、模式、成员、最近运行、负责人、更新时间、操作 |
| Detail panel | Local detail rows/cards | `AgentTeamDetail` | Shows members, runs, handoffs, feedback |
| Team form | Inline modal/panel | `CreateAgentTeamInput`, `UpdateAgentTeamInput` | Validate required name/code/mode |
| Member form | Inline modal/panel | `CreateAgentTeamMemberInput`, `UpdateAgentTeamMemberInput`, `AgentListItem` | Agent selector uses `listAgents` |
| Start run form | Inline modal/panel | `StartAgentTeamRunInput` | Objective required |
| Handoff/feedback actions | Inline modal/panel | `CreateAgentTeamHandoffInput`, `CreateAgentTeamFeedbackInput` | Disabled without `agent:team:run` |
| Feedback states | Existing loading/error/empty patterns | React Query + mutations | Include loading, empty, error, permission-disabled |
