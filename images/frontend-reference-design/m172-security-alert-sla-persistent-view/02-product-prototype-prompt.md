# Product Prototype / Wireframe Prompt

Create a mid-fidelity product prototype / wireframe image for the existing `/security/alerts` page.

Project context:
- Page/route: 告警运营 at `/security/alerts`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: 打开告警运营页 -> 查看 SLA 告警摘要 -> 查看自动重试候选和已死信通知 -> 查看死信最近处置字段 -> 使用 request_id/trace_id/replay_key 追溯。
- API/service contract: `getSecurityOperationAlertSlaOverview()` supplies SLA alert items; `getSecurityOperationAlertSlaNotificationRetryOverview()` supplies `retryable_items` and `dead_letter_items`; `getSecurityOperationAlertSlaDeadLetterOverview()` supplies dead letter items and `latest_action/latest_action_event_id/latest_action_at`。
- Data fields: `notification_event_id`、`title`、`status`、`retry_count`、`source_system`、`source_id`、`dedupe_key`、`request_id`、`trace_id`、`replay_key`、`delivered_at`、`disposition_status`、`latest_action`、`latest_action_event_id`、`latest_action_at`。
- Actions and states: 页面刷新；loading、empty、error。

Prototype requirements:
- Use the existing page shell and place the new SLA persistence area under the current SLA 告警 section.
- Show three clear cards/columns: `SLA 告警`、`SLA 自动重试`、`SLA 死信处置`。
- Each list item should have badges on top, title/message in the middle, and a compact metadata line with 事件来源、来源 ID、去重键、请求、Trace、重放键。
- Dead-letter items additionally show a second metadata line: 最近处置、处置事件、处置时间。
- Keep component boundaries obvious: card header, loading rows, empty state, error state, item rows.

Avoid:
- full detail drawer, modal workflow, or editable form
- extra charts unrelated to SLA retry/dead-letter tracking
- placing unrelated approval workbench details in the new region
