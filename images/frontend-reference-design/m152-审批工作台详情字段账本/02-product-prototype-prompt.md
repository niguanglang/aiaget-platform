# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the same real frontend page.

Project context:
- Page/route: M152 审批工作台详情字段账本 at `/security/alerts`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: filter approval queue -> select operation alert notification archive deletion -> inspect detail -> see field ledger summary -> approve or reject
- API/service contract: `getSecurityApprovalWorkbenchItem` returns detail metadata and timeline.
- Data fields: `has_export_field_ledger`, `exported_field_count`, `notification_archive_filter_field_count`, status, requester, reviewer, request_id, trace_id.
- Actions and states: select, approve, reject, loading, error, read-only.

Prototype requirements:
- Show left approval queue unchanged.
- Right detail panel sections: status/title, basic details, reason, field ledger summary, source extension JSON, timeline, decision actions.
- Field ledger summary is a compact chip block, not a JSON panel.
- Timeline event chips show the same counts only when available.

Avoid:
- moving details into the list, full arrays, or new unsupported actions.
