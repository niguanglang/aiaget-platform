# Component Mapping

| Reference region | Existing/new component or file | API/type backing it | Notes |
| --- | --- | --- | --- |
| List route shell | `apps/web/src/app/(console)/agent-teams/page.tsx` -> `AgentTeamsContent` | Next app route | Keep `/agent-teams` working as the overview/list page. |
| List metrics | `AgentTeamsContent` + `MetricCard` | `getAgentTeamOverview`, `AgentTeamOverview` | Metrics: total, active, running, waiting human. |
| List filters | `AgentTeamsContent` | `listAgentTeams({ keyword, status, mode, owner_id })`, `listUsers` | Search, status, mode, owner, clear. |
| List table | `AgentTeamsContent` + `StatusBadge` + `Button` | `AgentTeamListItem` | Columns: team, status, mode, members, latest run, owner, updated time, route actions. |
| Create route | `apps/web/src/app/(console)/agent-teams/create/page.tsx` -> `AgentTeamCreateContent` | `createAgentTeam`, `CreateAgentTeamInput` | Route-level form with validation and permission disabled state. |
| Detail route | `apps/web/src/app/(console)/agent-teams/[id]/page.tsx` -> `AgentTeamDetailContent` | `getAgentTeam`, `AgentTeamDetail` | Basic info, member summary, run summary, handoff/feedback entry links. |
| Edit route | `apps/web/src/app/(console)/agent-teams/[id]/edit/page.tsx` -> `AgentTeamEditContent` | `getAgentTeam`, `updateAgentTeam`, `UpdateAgentTeamInput` | Code read-only, otherwise same form as create. |
| Members route | `apps/web/src/app/(console)/agent-teams/[id]/members/page.tsx` -> `AgentTeamMembersContent` | `getAgentTeam`, `listAgents`, member CRUD APIs | Dedicated member form/table, no route backflow into list. |
| Runs route | `apps/web/src/app/(console)/agent-teams/[id]/runs/page.tsx` -> `AgentTeamRunsContent` | `getAgentTeam`, `startAgentTeamRun`, handoff, feedback, report export/archive APIs | Basic run records and actions; deep step detail can remain future work. |
| Report archives route | `apps/web/src/app/(console)/agent-teams/report-archives/page.tsx` -> `AgentTeamReportArchivesContent` | report archive list/download/delete/review APIs | Global archive and approval page. |
| Shared labels/helpers | `apps/web/src/components/agent-teams/agent-teams-shared.tsx` | shared-types enums | Status labels, tones, date/number format, detail rows, page loading/error boxes. |
| Shared team form | `apps/web/src/components/agent-teams/agent-team-form-panel.tsx` | `CreateAgentTeamInput`, `UpdateAgentTeamInput`, `AgentTeamDetail`, `UserListItem` | Used by create/edit pages. |
| Menu contract | `apps/control-api/src/menus/agent-team-menu-ia-contract.test.ts` | `prisma/seed.ts` | Add only if seed needs submenus. Dynamic detail/edit routes should remain outside seed; report archive can be a menu child if needed. |

Implementation constraints:
- Use Chinese UI text.
- Do not change Docker/container/middleware.
- Do not submit git commits.
- Only edit Agent 团队 owned paths plus optional menu/config files if required.
- Preserve existing `/agent-teams` route as a basic working list/overview page.
