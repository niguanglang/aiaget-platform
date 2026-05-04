# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 通知任务中心
- Page/route: M101 通知任务执行历史与审计检索 at `/security`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: show execution history for M100 auto notify and M87 auto retry tasks, with audit search linkage by request_id and trace_id
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS，shadcn/ui 风格 Card/Button/Input/MetricCard/StatusBadge/EmptyState
- Existing page shell/layout: 安全中心“审批与归档运营”卡片内部，M100/M87 通知任务中心下方

Interface contract that must appear in the UI:
- API/service function: `listSecurityOperationAlertNotificationTaskRuns`
- Main entities and fields: event_id, event_type, task, status, trigger_type, scanned_count, notified_count, retried_count, success_count, failed_count, skipped_count, started_at, finished_at, duration_ms, request_id, trace_id, error_message, summary
- Status values: task AUTO_NOTIFY/AUTO_RETRY, status SUCCESS/FAILED/SKIPPED, trigger_type MANUAL/SCHEDULED
- User actions: filter task, filter status, keyword search, refresh, open audit by request_id, open monitor by trace_id
- Required states: loading, empty, disabled refresh, success, error

Design requirements:
- Keep it as a production admin SaaS interface, not a marketing page.
- Use a compact dashboard/table layout with subtle borders, soft shadow, and clear hierarchy.
- Add a header titled “任务执行历史” with badges for M101 and audit linkage.
- Add metric tiles for total/success/failed/manual/scheduled/latest run.
- Add toolbar filters with Chinese labels: 任务类型、执行状态、关键字.
- Add a dense table with columns: 任务, 触发, 状态, 扫描/通知/重试, 成功/失败/跳过, 请求/链路, 完成时间, 操作.
- Use restrained status colors and no decorative excess.
- Make mobile behavior stack filters and allow horizontal table overflow.

Avoid:
- fake fields not listed above
- random charts
- excessive gradients, glow, emojis, oversized cards
- English UI labels
