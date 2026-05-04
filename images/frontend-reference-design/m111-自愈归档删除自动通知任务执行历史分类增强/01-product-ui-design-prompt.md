# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心 / 通知任务执行历史
- Page/route: M111 自愈归档删除自动通知任务执行历史分类增强 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: make each auto-notification task run show how many SLA dead-letter archive delete alerts and self-healing archive delete alerts it covered.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges.
- Existing page shell/layout: Reuse existing `/security` page and `OperationAlertNotificationTaskRunHistoryCard`.

Interface contract that must appear in the UI:
- New task result fields:
  - `sla_dead_letter_notify_count`
  - `recovery_archive_delete_notify_count`
- Existing fields: task, status, trigger_type, scanned_count, notified_count, retried_count, success_count, failed_count, skipped_count, request_id, trace_id, finished_at.
- Actions: 刷新历史, 筛选任务类型, 筛选状态, 搜索, 清空筛选, 跳转审计, 跳转链路.
- Required states: loading, empty, old events with zero category counts, failed run with error message.

Design requirements:
- Keep dense enterprise dashboard style.
- Add two compact category metrics to the task history summary: SLA 死信覆盖, 自愈归档覆盖.
- In each task history row, show category coverage as small labels under “扫描 / 通知 / 重试”.
- In latest task result card, show category coverage fields when present.
- UI text must be Chinese.
- Keep table readable on desktop with horizontal scroll.

Avoid:
- new route or standalone report page
- charts or unsupported filters
- decorative visuals, emoji, excessive gradients
