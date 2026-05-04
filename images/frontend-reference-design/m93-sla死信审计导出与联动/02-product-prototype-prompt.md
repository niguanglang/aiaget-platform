# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M93 SLA 死信审计导出与联动 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. User reviews SLA dead-letter disposition audit timeline.
  2. User filters by keyword, action, and disposition status.
  3. User exports current filtered result as CSV.
  4. User opens Audit Center by request ID or Monitor Center by Trace ID from a row.
- API/service contract:
  - `GET /api/v1/security-center/operation-alert-sla/dead-letter-audits`
  - `GET /api/v1/security-center/operation-alert-sla/dead-letter-audits/export`
- Data entities and fields:
  - event_id, notification_event_id, alert_id, title, action, disposition_status, note, delivery_event_id, handled_by, request_id, trace_id, occurred_at
- Actions and states:
  - 搜索、筛选、重置、刷新、导出 CSV、上一页、下一页、打开审计中心、查看 Trace
  - loading, empty, exporting, success, error, disabled

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on the audit card structure: header, export/refresh buttons, success/error banner, filter bar, timeline rows, row action buttons, pagination.
- Make component boundaries obvious for `Card`, `Button`, `Input`, native select, `StatusBadge`, and `EmptyState`.
- Keep layout realistic for the existing `/security` dashboard.

Avoid:
- invented backend fields
- complex modals not supported by the current implementation
- decorative charts unrelated to export or linkage
