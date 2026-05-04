# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心 / 审批与归档运营告警通知
- Page/route: M109 通知任务自愈归档删除审批通知投递 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: make notification task self-healing audit archive delete approval alerts clearly notifiable and auditable.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges, lucide icons.
- Existing page shell/layout: Reuse existing `/security` page and `ApprovalArchiveOperationsCard`; notification audit remains inside the same security center card.

Interface contract that must appear in the UI:
- Alert ids:
  - `notification-task-recovery-audit-archive-delete-pending`
  - `notification-task-recovery-audit-archive-delete-rejected-risk`
- Notification category: `NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE`.
- Notification actions: 通知, 重试, 查看自愈归档审批.
- Delivery fields: status, channels, targets, webhook status, webhook error, retry_count, delivered_at.
- Required states: 正在通知、已投递、部分成功、已跳过、投递失败、可重试、无投递记录、加载中.

Design requirements:
- Keep the existing security center dashboard layout; do not create a separate route or modal-heavy flow.
- Highlight self-healing archive delete approval notifications in the delivery audit list with a compact Chinese badge: “自愈归档删除”.
- In alert cards, show notification result with status, channels, target roles, webhook status, and delivered time.
- Show target roles clearly: medium risk -> 安全管理员、审计员; high risk -> 租户管理员、安全管理员、审计员.
- Keep a dense enterprise SaaS style: subtle border, soft shadow, restrained spacing, no decorative hero, no emoji.
- Use Chinese UI text only.

Avoid:
- unrelated notification channels or settings pages
- fake fields not supported by `SecurityOperationAlertNotificationItem`
- overdesigned marketing visuals, excessive gradients, or large decorative elements
