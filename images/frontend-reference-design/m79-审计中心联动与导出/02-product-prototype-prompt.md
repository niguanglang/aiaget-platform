# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for an enterprise audit enhancement across two console pages.

Project context:
- Routes: `/audit` and `/approval-audits`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: open audit center -> review unified audit metrics and approval audit linkage card -> jump to approval audit center -> filter approval audit events -> export CSV -> inspect detail and jump to approval/Trace.
- API/service contract:
  - `getAuditOverview`, `listAuditEvents`, `getAuditEvent`
  - `getApprovalAuditOverview`, `listApprovalAuditEvents`, `getApprovalAuditEvent`
  - new `exportApprovalAuditEvents`
- Data entities:
  - Audit overview/list/detail
  - Approval audit overview/list/detail
  - Approval audit status/source/type/window filters
- Actions and states:
  - refresh, clear filters, open approval audit, export CSV, open approval, view Trace
  - loading, empty, error, disabled export, export success, export failure

Prototype requirements:
- Show two connected page wireframes side by side or as stacked screens.
- On `/audit`, show top metrics, ranking cards, approval audit linkage card, unified audit event table, detail panel.
- On `/approval-audits`, show metrics, source/event rankings, filter/export toolbar, event table, detail panel.
- Make component boundaries explicit and map to existing Cards, tables, buttons, badges and query states.
- Use Chinese section labels.

Avoid:
- visual decoration, invented fields, unrelated navigation, marketing hero layout.
