# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent Platform security center enhancement.

Project context:
- Product/module: 企业 AI Agent 平台，安全中心
- Page/route: `m84-审批与归档告警通知投递` at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: allow M83 approval/archive operational alerts to be notified through in-app event recording and external Webhook delivery.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-like Card/Button/StatusBadge/EmptyState, lucide-react icons, TanStack Query, Motion.
- Existing page shell/layout: security center with M82 `审批与归档运营` card and M83 `运营告警闭环` alert cards.

Interface contract that must appear in the UI:
- `SecurityCenterOverview.approval_operations.operational_alerts`
- `POST /api/v1/security-center/operation-alerts/:alertId/notify`
- `notifySecurityOperationAlert(alertId, input)`
- Notification channels: `IN_APP`, `WEBHOOK`
- Result status: `SENT`, `PARTIAL`, `SKIPPED`, `FAILED`
- Fields: alert_id, status, channels, targets, delivery_event_id, webhook_status, message, delivered_at.

Design requirements:
- Chinese UI labels only.
- Add compact notification controls inside each `运营告警闭环` card.
- Show a `通知` button, pending state, and latest delivery result.
- Use subtle borders, soft shadow, clean enterprise dashboard style.
- Preserve hierarchy: alert severity and处理 action are primary; notification is secondary.
- Include state copy for Webhook not configured and partial delivery.

Avoid:
- new routes
- unrelated notification settings form
- fake charts
- emoji
- overdone gradients
