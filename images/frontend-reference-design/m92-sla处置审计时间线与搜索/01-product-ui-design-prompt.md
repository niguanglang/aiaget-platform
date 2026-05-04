# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台，安全中心，SLA 死信处置审计
- Page/route: 安全中心 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 把 SLA 通知死信的认领、重新投递、关闭事件做成可检索时间线，便于排查处置链路、关联 request_id/trace_id，并核对重新投递事件。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，React Query，`Card`、`Button`、`Input`、`StatusBadge`、`EmptyState`。
- Existing page shell/layout: `/security` 安全中心仪表盘，审批与归档运营区域为 Bento/Dashboard Layout，细边框、浅背景、轻阴影。

Interface contract that must appear in the UI:
- API/service function: `listSecurityOperationAlertSlaDeadLetterAudits({ page, page_size, keyword, action, disposition_status })`
- Fields: event_id, notification_event_id, alert_id, title, action, disposition_status, note, handled_by, delivery_event_id, request_id, trace_id, occurred_at
- Filters: keyword input, action select, disposition status select, refresh, reset
- Pagination: page, page_size, total
- States: loading, empty, error, disabled while refreshing

Design requirements:
- Use Chinese UI text only.
- Show a compact operational timeline: left status/action badges, center title/note/request/trace, right time and delivery event.
- Keep design restrained and consistent with existing security center cards.
- Avoid decorative filler, emoji, heavy gradients, or invented fields.
