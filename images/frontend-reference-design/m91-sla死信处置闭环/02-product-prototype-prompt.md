# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. 用户查看 SLA 通知失败死信队列。
  2. 输入处置备注。
  3. 对单条死信执行认领、重新投递或关闭。
  4. 系统写入处置事件，刷新死信状态和最近处置结果。
  5. 审计员查看处置人、处置时间和备注。
- API/service contract:
  - `GET /security-center/operation-alert-sla/dead-letters/overview`
  - `POST /security-center/operation-alert-sla/dead-letters/:notificationEventId/actions`
- Data entities and fields:
  - Summary: open_count, claimed_count, requeued_count, closed_count, oldest_open_at, last_action_at
  - Item: notification_event_id, title, status, retry_count, webhook_status, webhook_error, dead_letter_reason, disposition_status, disposition_note, handled_by, handled_at, delivered_at
  - Action result: action, disposition_status, note, handled_at

Prototype requirements:
- Low- to mid-fidelity wireframe focused on layout and flow.
- Show card sections:
  - Header with M91 badges and refresh button.
  - Metric row.
  - Note input.
  - Dead-letter queue list with three actions per row.
  - Recent disposition result panel.
  - Empty/loading/error placeholders.
- Keep layout responsive: one column on mobile, two columns on desktop if useful.
