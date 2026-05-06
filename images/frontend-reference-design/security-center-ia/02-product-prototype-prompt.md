# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype/wireframe for the same security center IA split.

Project context:

- Routes: `/security`, `/security/policies`, `/security/events`, `/security/alerts`, `/security/recovery`
- Users/roles: security admins and operators with permission-gated actions
- Main task flow: land on overview -> inspect security posture -> open a focused workspace -> filter list/table -> inspect details -> run supported action -> see success/error/disabled state
- IA contract: the focused workspace files are standalone page components, not `SecurityPolicyContent view="..."` wrappers; prototype each page as owning its relevant API calls and Chinese page responsibility.
- API/service contract: reuse existing security center, policy, event, approval workbench, operation alert notification, SLA, recovery audit, archive and approval services
- Data entities and fields: security posture metrics, module cards, risk signals, policy rows/evaluations, event rows/detail JSON, approval rows/detail timeline, alert rows, notification/SLA/recovery task and archive rows
- Actions and states: create/edit/delete/toggle policy, simulate policy, open event detail, export approval/audit CSV, approve/reject archive deletion, acknowledge/escalate/close alert, notify/retry, run auto tasks, refresh, empty/error/loading/permission states

Prototype requirements:

- Show `/security` as a concise information architecture entry: header, metrics, module cards linking to four subroutes, risk/recent-denial column.
- Show `/security/policies` as two-column policy list + simulation panel, followed by evaluation log.
- Show `/security/events` as full-width searchable event table with right-side/modal detail behavior.
- Show `/security/alerts` as approval workbench plus alert/notification/SLA operation sections.
- Show `/security/recovery` as notification task run history, recovery suggestions, recovery audit/archive approval sections.
- Make component boundaries obvious: page header, navigation cards, filters, tables, details, dialogs, drawers, status messages.
- Use compact enterprise admin spacing and Chinese labels.

Avoid:

- Polished decorative rendering
- New backend fields, unrealistic navigation, or hidden required actions
- Combining all detailed workspaces back into the overview route
