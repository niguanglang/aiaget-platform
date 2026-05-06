# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype/wireframe for the audit center IA split.

Project context:
- Routes: `/audit` and `/audit/events/[id]`
- Users/roles: security admin, auditor, platform operator
- Main task flow: enter `/audit` with optional `keyword`/`window` query, review overview and failures, filter the event table, click "查看详情", land on `/audit/events/[id]` with current `window`/`keyword` carried in the URL, inspect event context and return to the filtered list
- API/service contract: list route uses `getAuditOverview`, `listAuditEvents`, `getApprovalAuditOverview`; detail route uses `getAuditEvent`
- Data entities: audit overview metrics/rankings/failures, audit event list items, audit event detail context and `request_summary` JSON

Prototype requirements:
- Draw two route frames side by side or stacked:
  1. `/audit` list/overview frame: header, metric row, ranking/failure area, approval audit shortcut, filter toolbar, event table, row detail link.
  2. `/audit/events/[id]` detail frame: back link, event header/status, base info, request context, Trace/subject region, JSON detail region, timeline/related entry region.
- Emphasize component boundaries and information architecture rather than polished visuals.
- Label the route responsibilities clearly: list route has no inline detail panel and no single event fetch; detail route owns single event fetch.
- Show compatibility with existing query parameters: `keyword` and `window` appear as initial filter chips/inputs.
- Include placeholders for loading, empty, error, and no payload states.

Avoid:
- Dialog-only detail pattern
- Dynamic menu entry for `/audit/events/[id]`
- Invented actions such as edit/delete audit events
