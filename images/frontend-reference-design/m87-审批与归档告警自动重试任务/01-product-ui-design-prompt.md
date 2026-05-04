# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform security center enhancement.

Project context:
- Product/module: 企业 AI Agent 平台，安全中心
- Page/route: `m87-审批与归档告警自动重试任务` at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: automatically scan and retry failed or partially successful approval/archive alert notification deliveries.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-like Card/Button/StatusBadge/EmptyState/MetricCard, lucide-react icons, TanStack Query.

Interface contract:
- `GET /api/v1/security-center/operation-alert-notification-tasks/overview`
- `POST /api/v1/security-center/operation-alert-notification-tasks/run-auto-retry`
- Metrics: pending_auto_retry_count, failed_notification_count, partial_notification_count, retried_notification_count.
- Policy: auto_retry_enabled, retry_interval_ms, retry_batch_size, max_retry_count, retry_backoff_seconds, lookback_hours, source.
- Last result: status, scanned_count, retried_count, success_count, failed_count, skipped_count, error_message.

Design requirements:
- Chinese UI only.
- Add a compact `通知自动重试任务` section below the delivery audit list.
- Use metric cards and two small policy/status panels.
- Include `立即扫描重试` button and running state.
- Keep layout dense and enterprise-grade with subtle borders.

Avoid:
- new page
- decorative charts
- unrelated notification settings editor
- emoji
