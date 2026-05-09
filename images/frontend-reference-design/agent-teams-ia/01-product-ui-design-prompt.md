# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the Agent 团队 IA split in a production enterprise admin console.

Project context:
- Product/module: AIAget Agent 协作中心.
- Page/route group: `/agent-teams`, `/agent-teams/create`, `/agent-teams/[id]`, `/agent-teams/[id]/edit`, `/agent-teams/[id]/members`, `/agent-teams/[id]/runs`, `/agent-teams/[id]/runs/[runId]`, `/agent-teams/[id]/runs/[runId]/steps/[stepId]`, `/agent-teams/report-archives`.
- Target users/roles: 租户管理员、Agent 管理员、团队运营人员、安全审批人员、审计人员.
- Business goal: Separate a crowded single Agent team page into focused route-level pages for list, creation, detail, editing, member management, run records, run replay/compare, step drilldown, audit report export, and report archives.
- Existing frontend stack/design system: Next.js app router, React Query, Tailwind CSS, local Button/MetricCard/StatusBadge/EmptyState/Card components, lucide icons.
- Existing page shell/layout: Console route content uses a constrained `max-w-7xl` main area, metric cards, bordered table panels, compact forms, detail cards, and icon buttons.

Interface contract that must appear in the UI:
- List page: overview metrics from `getAgentTeamOverview`, filters for keyword/status/mode/owner, table from `listAgentTeams`, action buttons to detail, edit, members, runs, create, report archives.
- Create page: route-level form calling `createAgentTeam`, with Chinese labels for team name, code, description, owner, status, mode, max rounds, timeout, handoff policy, failure policy, quality gate, budget limits.
- Detail page: `getAgentTeam` foundation, basic information, member summary, latest run summary, handoff/feedback entry links, edit/members/runs navigation.
- Edit page: route-level form calling `updateAgentTeam`, code read-only, same configuration fields as create.
- Members page: `getAgentTeam`, `listAgents`, `createAgentTeamMember`, `updateAgentTeamMember`, `deleteAgentTeamMember`, member table and member form.
- Runs page: `getAgentTeam`, `startAgentTeamRun`, run records, run summary, handoff and feedback panels using `createAgentTeamHandoff` and `createAgentTeamFeedback`, report export/archive actions.
- Run detail page: single-run header, top-level “导出报告/生成归档” actions, “审计报告导出” panel with report coverage tags, “当前运行回放” metrics, “上一轮运行对比” diff metrics, “成员差异” rows, trace graph, step timeline, handoff records, feedback records, and Trace linkage. It must derive data from `getAgentTeam` without new endpoints.
- Step detail page: one step and selected child event / reference / tool call / model call drilldown, entered from run detail deep links.
- Report archives page: `listAgentTeamRunReportArchives`, `listAgentTeamRunReportArchiveApprovals`, download, delete approval request, approve/reject controls.
- Main entities: AgentTeamListItem, AgentTeamDetail, AgentTeamMemberItem, AgentTeamRunSummary, AgentTeamHandoffItem, AgentTeamFeedbackItem, AgentTeamRunReportArchiveItem, AgentTeamRunReportArchiveApprovalItem.
- Status values: Team DRAFT/ACTIVE/DISABLED/ARCHIVED, mode SEQUENTIAL/PARALLEL/SUPERVISOR, run QUEUED/RUNNING/WAITING_HUMAN/SUCCESS/FAILED/CANCELLED, archive approval PENDING/APPROVED/REJECTED/APPLIED.
- Required states: loading, empty, error, validation, disabled, success, permission-denied, no previous run compare, missing run steps, trace missing, member added/missing between runs.
- High-impact confirmation states: deleting a team, removing a member, starting a team run, creating a handoff, generating a report archive, requesting archive deletion, approving archive deletion, and rejecting archive deletion must all show Chinese confirmation dialogs before mutation.

Design requirements:
- Make it look like a production SaaS/admin product, not a generic marketing page.
- Use Chinese visible text and realistic enterprise data density.
- Show the primary workflow clearly: list filters -> team detail -> edit/members/runs/report archive routes.
- Use compact tables, metric cards, segmented route actions, detail summary cards, and page-level forms.
- On the run detail page, place audit export and run replay before the trace graph/timeline, then put previous-run compare as a full-width panel so list pages remain clean.
- Keep cards at 8px radius or less and avoid nested cards.
- Use icon buttons for detail/edit/members/runs/download/delete/review actions with concise tooltips or titles.
- Use a consistent confirmation dialog pattern for high-impact actions, with clear impact copy and destructive button treatment.
- Keep the visual language calm, high contrast, and utilitarian with neutral backgrounds, restrained accent colors, and clear disabled/error states.
- Output should be a reference image suitable for implementation against the real code contracts.

Avoid:
- fake fields not listed in the API contract
- decorative hero sections, gradients, or one-note purple/blue themes
- large marketing copy or feature explanations inside the app
- unreadable tiny text, random charts, placeholder lorem ipsum
- mixing all member/run/archive operations back into the list page
