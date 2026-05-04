# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main flow:
  1. 用户输入关键词或选择动作/状态筛选。
  2. 查看 SLA 死信处置事件时间线。
  3. 通过 request_id / trace_id / delivery_event_id 关联处置链路。
  4. 翻页查看更多历史事件。
- API contract:
  - `GET /security-center/operation-alert-sla/dead-letter-audits`
  - Query params: page, page_size, keyword, action, disposition_status
- Data fields: event_id, notification_event_id, title, action, disposition_status, note, handled_by, delivery_event_id, request_id, trace_id, occurred_at

Prototype requirements:
- Low- to mid-fidelity wireframe.
- Sections: header, filter toolbar, timeline/list, pagination, empty/loading states.
- Keep component boundaries obvious and map to existing `Card`, `Input`, `Button`, `StatusBadge`, `EmptyState`.
