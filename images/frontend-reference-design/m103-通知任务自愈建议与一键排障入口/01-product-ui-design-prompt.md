# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 通知任务中心
- Page/route: M103 通知任务自愈建议与一键排障入口 at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: turn notification task failures into concrete troubleshooting recommendations and links without auto-changing settings.
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn/ui style Card/Button/MetricCard/StatusBadge/EmptyState
- Existing page shell/layout: inside existing “审批与归档运营” card, near M102 notification task risk metrics and M101 task history.

Interface contract that must appear in the UI:
- Main API: `GET /security-center/overview`
- Main fields: `approval_operations.notification_task_recovery_suggestions[]`
- Suggestion fields: id, title, description, severity, reason_code, primary_action_label, primary_action_href, secondary_action_label, secondary_action_href, evidence
- Reason codes: WEBHOOK_NOT_CONFIGURED, WEBHOOK_DELIVERY_FAILED, AUTO_NOTIFY_DISABLED, AUTO_RETRY_DISABLED, CONSECUTIVE_FAILURES, HIGH_FAILURE_RATE
- Actions: open settings integration, open notification settings, open task history, open monitor, open audit.

Design requirements:
- Add a compact “自愈建议” area with 2-3 suggestion cards.
- Each card should show severity badge, reason code label, evidence text, and primary/secondary action buttons.
- Use Chinese labels and concise operational language.
- Keep visual style aligned with existing dashboard: subtle border, soft shadow, restrained color.
- Provide a healthy empty state: “暂无排障建议”.

Avoid:
- automatic repair buttons that imply changing middleware/config directly
- fake fields not listed above
- excessive gradients, glows, emojis, decorative blobs
- standalone page or unrelated modules
