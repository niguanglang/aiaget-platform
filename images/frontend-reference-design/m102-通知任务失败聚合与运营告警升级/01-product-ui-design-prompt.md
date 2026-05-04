# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 审批与归档运营
- Page/route: M102 通知任务失败聚合与运营告警升级 at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: Surface notification task execution failure risks from M101 history as operational metrics and alerts, so users can acknowledge, escalate, close, or notify stakeholders.
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn/ui style Card/Button/MetricCard/StatusBadge/EmptyState
- Existing page shell/layout: Existing security center card, “审批与归档运营” section, with existing operational alert cards.

Interface contract that must appear in the UI:
- Main API: `GET /security-center/overview`
- Action APIs: `notifySecurityOperationAlert`, `updateSecurityOperationAlert`
- Main fields:
  - notification_task_runs_24h
  - notification_task_failed_24h
  - notification_task_skipped_24h
  - notification_task_failure_rate_24h
  - notification_task_consecutive_failures
  - operational_alerts
- Alert IDs:
  - operation-alert-notification-task-failure-risk
  - operation-alert-notification-task-consecutive-failure
- Actions: notify alert, acknowledge, escalate, close, open task history, open audit/monitor linkage.

Design requirements:
- Keep the interface as a compact production SaaS/admin dashboard, not a marketing screen.
- Add a small M102 “通知任务风险” metric strip near the operations overview.
- Show four metrics: 任务执行, 失败/跳过, 失败率, 连续失败.
- Existing operational alert cards should show the new task failure alerts with clear severity and action labels.
- Use restrained warning colors, subtle borders, soft shadow, and dense readable layout.
- Text must be Chinese.

Avoid:
- invented fields or fake charts
- excessive gradients, glows, emojis, decorative blobs
- standalone page or unrelated navigation
