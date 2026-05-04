# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心 / 通知任务中心
- Page/route: M110 通知任务自愈归档删除审批自动通知任务 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: extend the existing automatic first-notification task from SLA dead-letter archive deletion alerts to also cover notification task self-healing audit archive deletion approval alerts.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges, lucide icons.
- Existing page shell/layout: Reuse existing `/security` page and `OperationAlertNotificationTaskCard` inside the approval/archive operations card.

Interface contract that must appear in the UI:
- Auto notify alert ids:
  - SLA 死信归档删除等待审批
  - SLA 死信归档删除拒绝偏多
  - 通知任务自愈归档删除等待审批
  - 通知任务自愈归档删除拒绝偏多
- API/service functions: task overview, run auto notify, run auto retry, task run history.
- Main fields: pending_auto_notify_count, auto_notified_count, oldest_auto_notify_at, pending_auto_retry_count, failed_notification_count, partial_notification_count, last_auto_notify_result.
- Actions: 刷新任务、立即自动通知、立即扫描重试.
- Required states: loading, running, disabled, empty pending notification, last run success/failure/skipped.

Design requirements:
- Keep the existing security center dashboard layout; do not add a new route.
- In the task center, make it clear that automatic first notification now covers “SLA 死信 + 自愈归档删除” alerts.
- Use compact metric tiles and status badges: `M100 自动通知`, `M110 自愈归档`, `M87 自动重试`.
- Keep visual language restrained and enterprise-grade: subtle border, soft shadow, no decorative hero, no emoji, no excessive gradients.
- UI text must be Chinese and fit compact admin cards.

Avoid:
- new notification settings pages
- unsupported channels or queue concepts
- invented fields beyond task overview/result contracts
- large marketing-style panels
