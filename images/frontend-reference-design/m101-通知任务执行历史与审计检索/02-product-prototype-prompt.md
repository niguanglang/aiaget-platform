# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M101 通知任务执行历史与审计检索 at `/security`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 用户查看通知任务中心 -> 展开任务执行历史 -> 使用任务类型/状态/关键字筛选 -> 查看每次执行计数和错误 -> 点击 request_id 跳审计中心 -> 点击 trace_id 跳监控中心
- API/service contract: `GET /security-center/operation-alert-notification-tasks/runs`
- Data fields: event_id, event_type, task, status, trigger_type, scanned_count, notified_count, retried_count, success_count, failed_count, skipped_count, started_at, finished_at, duration_ms, request_id, trace_id, error_message, summary
- Actions and states: refresh, filter, search, audit link, trace link, loading, empty, error

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Put the history section below the existing M100/M87 task panels.
- Layout regions:
  - section header with status badges
  - metric summary row
  - filter toolbar
  - execution table
  - empty/loading placeholders
- Make component boundaries obvious for direct mapping to existing React components.
- Keep labels Chinese and data dense but readable.

Avoid:
- decorative rendering
- invented backend fields
- unrelated navigation or new standalone page
