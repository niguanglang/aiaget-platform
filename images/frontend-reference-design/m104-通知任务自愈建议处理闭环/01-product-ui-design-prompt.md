# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page section.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 通知任务自愈建议
- Page/route: M104 通知任务自愈建议处理闭环 at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Existing stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn/ui style Card/Button/StatusBadge/EmptyState
- Existing placement: inside “审批与归档运营” card, under the M102 “通知任务失败聚合” metrics and M103 recommendation section.

Interface contract that must appear:
- Suggestions come from `GET /security-center/overview` field `approval_operations.notification_task_recovery_suggestions[]`.
- Each suggestion has title, description, severity, reason_code, evidence, primary/secondary action links, status, last_action, last_note, updated_at.
- Lifecycle actions: 确认、忽略、标记已处理.
- Status labels: 待处理、已确认、已忽略、已处理.
- Backend action endpoint: `POST /security-center/operation-alert-notification-task-recovery-suggestions/:suggestionId/actions`.

Design requirements:
- Keep the layout compact and enterprise dashboard-like.
- Each suggestion card should show severity badge, reason label, lifecycle status badge, evidence, last action note, troubleshooting links, and lifecycle buttons.
- Buttons must feel operational and restrained: outline buttons for 确认/忽略, primary button for 标记已处理.
- Include a pending action visual state: disabled buttons and “处理中”.
- Include an empty state: “暂无排障建议”.
- Use Chinese text only.

Avoid:
- automatic repair or configuration mutation UI
- standalone page, modal-heavy layout, decorative hero sections
- excessive gradients, glows, emojis, or unrelated modules
