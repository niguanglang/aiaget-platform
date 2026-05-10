# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity product prototype / wireframe image for the same security event list page.

Project context:
- Page/route: 安全事件 at `/security/events`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: filter security events, identify approval workbench export events with field ledger counts, open detail for complete exported field list
- API/service contract: list only uses `listSecurityCenterEvents`; detail is a separate route
- Data entities and fields: title, reason preview, severity, source, Trace marker, request_id, method/path, resource type, occurred_at, `has_export_field_ledger`, `exported_field_count`, `notification_archive_filter_field_count`
- Actions and states: search, source filter, window filter, Trace-only checkbox, clear filters, pagination, open detail, loading, empty, error

Prototype requirements:
- Show clear page regions: header, metrics, filter toolbar, event list, pagination.
- In each relevant list row, show a compact “字段账本” metadata line with count chips.
- Label unsupported/forbidden content clearly as absent from list: complete field arrays remain in detail page.
- Make component boundaries obvious for implementation with existing `SecurityEventsContent` and `SecurityEventRow`.
- Use Chinese labels in the wireframe.

Avoid:
- expanded JSON panels in the list
- detail drawer or modal
- unrelated approval actions
- fake backend fields beyond the listed contract
