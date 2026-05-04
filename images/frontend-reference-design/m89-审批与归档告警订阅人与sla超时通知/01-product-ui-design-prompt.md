# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: 安全中心 at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 让审批与归档告警 SLA 超时后能按订阅目标投递通知，并在安全中心审计投递结果。
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui style components, existing `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`, TanStack Query.
- Existing page shell/layout: console dashboard layout with left navigation and dense security operation panels.

Interface contract that must appear in the UI:
- API/service functions:
  - `GET /api/v1/security-center/operation-alert-sla/overview`
  - `GET /api/v1/security-center/operation-alert-sla/notifications/overview`
  - `POST /api/v1/security-center/operation-alert-sla/notify-overdue`
- Main entities and fields:
  - Subscription policy: `enabled`, `channels`, `default_targets`, `high_risk_targets`, `archive_targets`, `webhook_configured`, `source`
  - Notification summary: `pending_overdue_count`, `sent_count`, `partial_count`, `failed_count`, `skipped_count`, `last_delivered_at`
  - Notification item: `notification_event_id`, `alert_id`, `title`, `status`, `channels`, `targets`, `webhook_status`, `webhook_error`, `delivered_at`
  - Notification result: `scanned_count`, `notified_count`, `sent_count`, `failed_count`, `skipped_count`
- Status values/enums:
  - Notification status: `SENT`, `PARTIAL`, `SKIPPED`, `FAILED`
  - SLA status: `OVERDUE`, `WARNING`, `WITHIN_SLA`, `CLOSED`
- User actions:
  - 刷新通知
  - 通知超时项
  - 查看投递审计
- Required states: loading, empty, error, disabled when notification policy is off, partial delivery, last result.

Design requirements:
- Make it look like a production security operations console, not a generic mockup.
- Use a Bento/Dashboard layout with compact enterprise cards, subtle borders, soft shadows, and Chinese text.
- Show subscription targets and delivery audit clearly without adding a new page.
- Use restrained blue/slate/white style with amber/red only for risk and failed delivery states.
- Do not overload the panel; prioritize scanability.

Avoid:
- fake API fields not listed above
- decorative orbs or heavy glow
- marketing hero layout
- emoji
- unrelated charts
