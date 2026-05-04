# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe for `/approval-audits`.

Main task flow:
1. User opens approval audit search.
2. User reviews summary metrics.
3. User filters by window/source/event type/status/keyword/trace-only.
4. User selects an audit event from the table.
5. Detail panel shows trace, request, operator, note, source record and metadata.
6. User can jump back to `/approvals` with the source record if needed.

API contract:
- `getApprovalAuditOverview`
- `listApprovalAuditEvents`
- `getApprovalAuditEvent`

Prototype regions:
- Header and refresh action
- Metric cards
- Filter toolbar
- Main audit event table
- Right detail panel
- Empty/error/loading states

Use Chinese UI labels only. Keep layout consistent with existing SaaS console pages.
