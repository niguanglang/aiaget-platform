# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the enterprise AI Agent platform security approval workbench.

Project context:
- Page/route: 安全中心 at `/security`, section name `细分审批工作台`
- Users/roles: 安全管理员 handles approvals; 审计员 can view but cannot approve/reject
- Main task flow: user filters approval queue -> selects one approval -> reviews risk and timeline -> enters optional decision note -> approves or rejects -> queue and metrics refresh
- API/service contract: overview endpoint returns counts by type/status/risk; list endpoint returns approval rows; detail endpoint returns a selected approval and timeline; review endpoint handles approve/reject
- Data entities and fields: approval type, status, risk domain, risk level, title, requester, reviewer, target label/id, requested_at, reviewed_at, reason, decision note, request_id, trace_id, timeline
- Actions and states: search, type/status/risk filters, refresh, approve, reject, loading, empty, error, read-only disabled state

Prototype requirements:
- Use mid-fidelity admin wireframe style.
- Layout: metric strip at top; filter toolbar under it; two-column content with approval list/table on the left and detail/action panel on the right.
- Detail panel must show: title, type badge, status badge, target metadata, requester/reviewer, risk explanation, note input, approve/reject buttons, and audit timeline.
- Include empty state when no approval matches filters and permission state when user cannot handle approvals.
- Component boundaries should be obvious for mapping to React components.

Avoid:
- decorative rendering unrelated to implementation
- invented channels or billing fields
- deep nested navigation or modal-only flow
