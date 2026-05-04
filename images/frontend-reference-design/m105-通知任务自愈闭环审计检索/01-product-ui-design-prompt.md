# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the real `/security` page section.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 通知任务自愈闭环审计
- Page/route: M105 通知任务自愈闭环审计检索 at `/security`
- Existing stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn/ui style Card/Button/Input/MetricCard/StatusBadge/EmptyState
- Existing placement: inside “通知任务中心”, directly below M101 task execution history.

Interface contract:
- API: `GET /security-center/operation-alert-notification-task-recovery-suggestions/audits`
- Filters: action, status, reason_code, keyword.
- Summary metrics: total_count, acknowledged_count, ignored_count, resolved_count, latest_action_at.
- Table fields: suggestion title, reason code, severity, action, status, note, request_id, trace_id, occurred_at.
- Link buttons: 审计, 链路.

Design requirements:
- Use a dense enterprise dashboard table.
- Top summary row with 5 metric cards.
- Filter toolbar with three selects, keyword input, clear button, refresh button.
- Table rows must show badges for action/status/reason/severity.
- Keep Chinese labels and concise operational wording.
- Empty state: “暂无闭环审计记录”.

Avoid:
- modal-heavy design
- automatic repair buttons
- unrelated modules, decorative hero sections, excessive gradients, emojis, glows
