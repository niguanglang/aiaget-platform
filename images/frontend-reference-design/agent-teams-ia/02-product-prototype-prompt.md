# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the Agent 团队 IA split.

Project context:
- Page group: Agent 团队 IA at `/agent-teams` and child routes.
- Users/roles: 租户管理员、Agent 管理员、团队运营人员、安全审批人员、审计人员.
- Main task flow: user opens `/agent-teams`, scans metrics and filters teams, enters detail, then uses dedicated routes for create, edit, members, runs, and report archives.
- API/service contract: `getAgentTeamOverview`, `listAgentTeams`, `createAgentTeam`, `getAgentTeam`, `updateAgentTeam`, `deleteAgentTeam`, member CRUD, `startAgentTeamRun`, handoff/feedback APIs, report export/archive/list/download/delete/review APIs.
- Data entities and fields: Agent team basic fields, members, run summaries, handoffs, feedback, report archives, archive approvals.
- Actions and states: search, filter, clear filters, create, open detail, edit, manage members, view runs, start run, create handoff, save feedback, export report, create archive, download archive, request delete archive, approve/reject delete approval, loading, empty, error, validation, permission disabled.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show one overview frame plus smaller route frames for create/edit, detail, members, runs, and report archives.
- Make page boundaries explicit: the list frame must not contain inline member CRUD, run step detail, handoff review, feedback form, or archive approval table.
- Show component boundaries for route header, metric strip, filter toolbar, table, route action buttons, detail summary regions, form fields, validation messages, and destructive confirmation areas.
- Keep the layout realistic for the existing console shell: `max-w-7xl` content, bordered panels, compact tables, responsive rows.
- Include empty/error/loading/permission placeholders as labeled wireframe states.

Avoid:
- polished decoration or illustrations
- invented backend fields
- unrealistic navigation
- modal-heavy all-in-one workflows that undo the requested IA split
