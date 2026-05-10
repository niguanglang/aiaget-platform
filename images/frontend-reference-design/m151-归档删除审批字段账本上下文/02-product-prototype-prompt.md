# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype wireframe for the same real frontend page.

Project context:
- Page/route: M151 归档删除审批字段账本上下文 at `/approvals/archive-deletions`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: open archive deletion approvals -> filter source to 安全告警归档 -> select deletion request -> inspect filter context and field ledger summary -> approve or reject
- API/service contract: notification archive approval list and approve/reject services
- Data entities and fields: archive identity, status, requester/reviewer, notification filter source/status/keyword, `has_export_field_ledger`, exported field count, notification archive filter field count
- Actions and states: source filter, row select, approve, reject, loading, empty, error, disabled/read-only

Prototype requirements:
- Show page regions: header, metrics, source filter, approval queue table, approval detail panel, action form.
- In queue row, field ledger summary appears as compact chips under file name.
- In detail panel, field ledger summary appears as a small bordered block after filter summary.
- Include annotation: no full field arrays in this page.

Avoid:
- invented backend fields, details embedded in every row, or moving approval permission assignment into this page.
