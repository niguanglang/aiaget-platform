# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 审批与归档运营
- Page/route: M100 SLA 死信审计归档删除审批自动通知任务 at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员，复用 `security:rule:view` 权限
- Business goal: 把 SLA 死信归档删除审批运营告警纳入自动首发通知任务，并与已有失败自动重试任务并排呈现，让安全管理员可以看到待通知、已自动通知、失败重试和最近执行结果
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS，现有 shadcn/ui 风格 `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`
- Existing page shell/layout: 安全中心控制台内的“审批与归档运营”卡片，Bento/Grid 信息结构，细边框、轻阴影、backdrop blur，中文界面

Interface contract that must appear in the UI:
- API/service functions:
  - `getSecurityOperationAlertNotificationTaskOverview`
  - `runSecurityOperationAlertNotificationAutoNotify`
  - `runSecurityOperationAlertNotificationAutoRetry`
- Main entities and fields:
  - `policy.auto_notify_enabled`
  - `policy.auto_notify_interval_ms`
  - `policy.auto_notify_batch_size`
  - `policy.auto_retry_enabled`
  - `policy.retry_interval_ms`
  - `policy.retry_batch_size`
  - `policy.max_retry_count`
  - `policy.retry_backoff_seconds`
  - `summary.pending_auto_notify_count`
  - `summary.auto_notified_count`
  - `summary.oldest_auto_notify_at`
  - `summary.pending_auto_retry_count`
  - `summary.failed_notification_count`
  - `summary.partial_notification_count`
  - `summary.retried_notification_count`
  - `last_auto_notify_result`
  - `last_auto_retry_result`
- Status values/enums:
  - task: `AUTO_NOTIFY` / `AUTO_RETRY`
  - status: `SUCCESS` / `FAILED` / `SKIPPED`
- User actions:
  - 刷新任务
  - 立即自动通知
  - 立即扫描重试
- Required states:
  - loading task overview
  - empty pending auto notify
  - empty pending auto retry
  - disabled buttons while running
  - success/failed/skipped recent result

Design requirements:
- Make it look like a production SaaS/admin product, not a generic template.
- Keep visual style minimal, technical, high-end, and operationally dense but readable.
- Use two adjacent task panels inside one card: “M100 首发自动通知” and “M87 失败自动重试”.
- The automatic notification panel should emphasize SLA dead-letter archive-delete alerts and show the pending count, already notified count, oldest pending time, batch size, interval, and a primary action button.
- The retry panel should keep existing retry metrics and show retry policy, failed/partial counts, retry count, backoff, and recent result.
- Include small status badges such as “自动通知已启用”, “任务未启用”, “执行中”, “空闲”.
- Include an empty state row when no pending work exists.
- Use subtle borders, soft shadow, restrained background translucency, and a clean grid.
- Output should be a product UI design reference image suitable for implementation in the current page.

Avoid:
- fake API fields not listed above
- excessive gradients, cheap glow, emojis, huge rounded decorative cards
- random charts or invented modules
- English interface labels
