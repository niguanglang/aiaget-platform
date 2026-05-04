# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform security center enhancement.

Project context:
- Product/module: 企业 AI Agent 平台，安全中心
- Page/route: `m86-审批与归档告警通知重试与投递审计` at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: make approval/archive operation alert notification delivery auditable and retryable.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-like Card/Button/StatusBadge/EmptyState, lucide-react icons, TanStack Query.
- Existing layout: `审批与归档运营` Bento card with operational alerts, lifecycle buttons and notification controls.

Interface contract:
- `GET /api/v1/security-center/operation-alert-notifications`
- `POST /api/v1/security-center/operation-alert-notifications/:notificationEventId/retry`
- Item fields: notification_event_id, alert_id, status, channels, targets, webhook_status, webhook_error, message, retry_count, retried_from_event_id, delivered_at, created_at.
- Status values: SENT, PARTIAL, SKIPPED, FAILED.

Design requirements:
- Chinese UI labels only.
- Add a compact `通知投递审计` region inside the operations card.
- Use a table or dense list with status badge, alert id, channels, Webhook status, delivered time and retry action.
- Failed and partial rows should expose a clear `重试` button.
- Include loading and empty states.
- Keep visual hierarchy restrained and enterprise-grade.

Avoid:
- new page
- unrelated notification settings form
- fake charts
- emoji
