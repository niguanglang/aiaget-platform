# Product Prototype / Wireframe Prompt

Create a low/mid-fidelity product prototype for `/security/events/[id]`.

Project context:
- Page/route: 安全事件详情 at /security/events/[id]
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 从安全事件列表打开审批工作台导出事件 -> 查看基础信息和链路 -> 在请求摘要和上下文中确认导出字段清单。
- API/service contract: `getSecurityCenterEvent(eventId)` returns `context.exported_fields` and `context.notification_archive_filter_fields`.

Prototype requirements:
- Show existing detail page regions only.
- Highlight the context JSON region containing exported_fields and notification_archive_filter_fields.
- Include loading, not found, error states as existing page placeholders.
- Keep component mapping to `SecurityEventDetailContent` and `JsonBlock`.

Avoid:
- No CSV preview modal.
- No new table/list UI.
- No unrelated approval operation controls.
