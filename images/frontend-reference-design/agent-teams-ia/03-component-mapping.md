# Component Mapping

| Reference region | Existing/new component or file | API/type backing it | Notes |
| --- | --- | --- | --- |
| List route shell | `apps/web/src/app/(console)/agent-teams/page.tsx` -> `AgentTeamsContent` | Next app route | Keep `/agent-teams` working as the overview/list page. |
| List metrics | `AgentTeamsContent` + `MetricCard` | `getAgentTeamOverview`, `AgentTeamOverview` | Metrics: total, active, running, waiting human. |
| List filters | `AgentTeamsContent` | `listAgentTeams({ keyword, status, mode, owner_id })`, `listUsers` | Search, status, mode, owner, clear. |
| List table | `AgentTeamsContent` + `StatusBadge` + `Button` | `AgentTeamListItem` | Columns: team, status, mode, members, latest run, owner, updated time, route actions. |
| Create route | `apps/web/src/app/(console)/agent-teams/create/page.tsx` -> `AgentTeamCreateContent` | `createAgentTeam`, `CreateAgentTeamInput` | Route-level form with validation and permission disabled state. |
| Detail route | `apps/web/src/app/(console)/agent-teams/[id]/page.tsx` -> `AgentTeamDetailContent` | `getAgentTeam`, `AgentTeamDetail` | Basic info, member summary, latest run summary, handoff/feedback entry links, Trace summary, and Resource ACL simulation entry. |
| Edit route | `apps/web/src/app/(console)/agent-teams/[id]/edit/page.tsx` -> `AgentTeamEditContent` | `getAgentTeam`, `updateAgentTeam`, `UpdateAgentTeamInput` | Code read-only, otherwise same form as create. |
| Members route | `apps/web/src/app/(console)/agent-teams/[id]/members/page.tsx` -> `AgentTeamMembersContent` | `getAgentTeam`, `listAgents`, member CRUD APIs | Dedicated member form/table, no route backflow into list. |
| Runs route | `apps/web/src/app/(console)/agent-teams/[id]/runs/page.tsx` -> `AgentTeamRunsContent` | `getAgentTeam`, `startAgentTeamRun`, handoff, feedback, report export/archive APIs | Basic run records and actions; each row links to the run detail route. |
| Run detail route | `apps/web/src/app/(console)/agent-teams/[id]/runs/[runId]/page.tsx` -> `AgentTeamRunDetailContent` | `getAgentTeam`, `exportAgentTeamRunReport`, `createAgentTeamRunReportArchive` | Single run header, audit report export panel, current run replay, previous-run compare, member diff, timeline, handoffs, feedback, Trace linkage, report actions, and compact RAG/tool/model drilldowns. |
| Run replay metrics | `AgentTeamRunDetailContent`, `buildRunReplayMetrics`, `filterRunSteps` | `AgentTeamRunSummary`, `AgentTeamStepItem.run_id`, `AgentTeamStepItem.trace_id`, `child_steps`, `references`, `tool_calls`, `model_call` | `filterRunSteps` prefers `step.run_id === run.id`; if historical data lacks `run_id`, it falls back to matching `trace_id`. |
| Previous run compare | `RunComparePanel`, `RunDiffMetric`, `buildMemberReplayRows` | Current and previous `runs/steps` from `getAgentTeam` | Shows Token, cost, duration, step, internal event, RAG, tool and model deltas; empty state title is “暂无上一轮可对比”. |
| Member diff rows | `MemberReplaySnapshot`, `aggregateMemberSteps` | Step `member_id`, `agent_id`, `agent_code`, `agent_name`, output summary and usage fields | Shows current vs previous member participation, member added/missing states, output summaries and usage counts. |
| Audit report export | `AgentTeamRunDetailContent` report panel | `exportAgentTeamRunReport(runId)`, `createAgentTeamRunReportArchive(runId)` | Shows “审计报告导出”, coverage tags, run ID, Trace, CSV/UTF-8 format, export and archive actions before replay/compare work. |
| Run trace graph | `apps/web/src/components/agent-teams/agent-team-run-trace-graph.tsx` | `AgentTeamRunSummary.trace_id`, `AgentTeamStepItem.trace_id/span_id/parent_span_id`, `child_steps`, `model_call` | Builds an in-run Trace graph from existing ledger data and links each trace to `/monitor/traces/:traceId`. |
| Run step detail route | `apps/web/src/app/(console)/agent-teams/[id]/runs/[runId]/steps/[stepId]/page.tsx` -> `AgentTeamRunStepDetailContent` | `getAgentTeam`, `AgentTeamStepItem.child_steps/references/tool_calls/model_call` | Single step detail page. `eventType` and `eventId` query params deep-link to one child event, reference, tool call, or model call. |
| Report archives route | `apps/web/src/app/(console)/agent-teams/report-archives/page.tsx` -> `AgentTeamReportArchivesContent` | report archive list/download/delete/review APIs | Global archive and approval page. |
| High-impact confirmation | `apps/web/src/components/agent-teams/agent-team-confirm-dialog.tsx` | delete/run/handoff/archive/review mutation pending state | Shared confirmation for team delete, member removal, run start, handoff creation, archive generation, delete request, approve and reject decisions. |
| Shared labels/helpers | `apps/web/src/components/agent-teams/agent-teams-shared.tsx` | shared-types enums | Status labels, tones, date/number format, detail rows, page loading/error boxes. |
| Shared team form | `apps/web/src/components/agent-teams/agent-team-form-panel.tsx` | `CreateAgentTeamInput`, `UpdateAgentTeamInput`, `AgentTeamDetail`, `UserListItem` | Used by create/edit pages. |
| Menu contract | `apps/control-api/src/menus/agent-team-menu-ia-contract.test.ts` | `prisma/seed.ts` | Add only if seed needs submenus. Dynamic detail/edit routes should remain outside seed; report archive can be a menu child if needed. |

Implementation constraints:
- Use Chinese UI text.
- Do not change Docker/container/middleware.
- Do not submit git commits.
- Only edit Agent 团队 owned paths plus optional menu/config files if required.
- Preserve existing `/agent-teams` route as a basic working list/overview page.
