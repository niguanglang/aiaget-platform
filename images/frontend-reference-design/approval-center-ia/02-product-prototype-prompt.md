# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend route family.

Project context:
- Page/route: `/approvals`, `/approvals/tools`, `/approvals/notification-policy`, `/approvals/archive-deletions`.
- Users/roles: security operators and tenant admins; processing is gated by approval handling permission.
- Main task flow: land on `/approvals` to inspect pending totals and choose the right queue, then enter a child route to search/filter, select a request, inspect detail/audit context, approve or reject with a note.
- API/service contract: use existing exported functions only; no invented endpoints.
- Data entities and fields: tool approval rows, notification policy snapshot approvals, archive deletion approval rows and timeline detail where available.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show `/approvals` as overview only: title, metric strip, three queue cards, recent risk notes, links to child routes and `/approval-audits`.
- Show child page structure: route header, filters, table/list, side detail panel or below-row detail panel, decision note textarea, approve/reject buttons, context links.
- Clearly separate the three child routes with Chinese titles and API responsibility labels.
- Include loading, empty, error, disabled, and post-action feedback placeholders.
- Keep component boundaries obvious so a frontend engineer can map each region to existing `Card`, `MetricCard`, `StatusBadge`, `Button`, and React Query states.

Avoid:
- polished decorative rendering
- unsupported detail routes or new API shapes
- making `/approval-audits` part of the editable approval center implementation
