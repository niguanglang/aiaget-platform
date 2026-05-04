# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M63-11 渠道自动重试任务中心 at `/channels`
- Users/roles: 租户管理员、渠道管理员、运维人员、审计人员
- Main task flow: 用户进入全渠道发布中心，查看自动重试和清理任务健康状态；如果有管理权限，可以点击“立即扫描重试”或“立即清理过期记录”；执行后在结果区域看到本次扫描、重试、成功、失败、跳过、删除数量。
- API/service contract:
  - `GET /channels/sender-tasks/overview`
  - `POST /channels/sender-tasks/run-auto-retry`
  - `POST /channels/sender-tasks/run-cleanup`
- Data entities and fields:
  - Overview: generated_at, scheduler_enabled, running, last_tick_at, next_tick_after_seconds
  - Summary: pending_auto_retry_count, expired_delivery_count, auto_retry_enabled_channel_count, failed_delivery_count, oldest_failed_at
  - Run result: task, started_at, finished_at, scanned_count, retried_count, success_count, failed_count, skipped_count, deleted_count, error_message
- Actions and states: refresh, run auto retry, run cleanup, loading, empty, error, disabled by permission, success result

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show a single panel under the existing sender policy and delivery sections.
- Define clear regions:
  - header with title, status badges, refresh button
  - metric cards row
  - scheduler status strip
  - two action cards side by side
  - latest run result detail area
  - permission hint and error/success alerts
- Make component boundaries obvious so a frontend engineer can map each region to existing Card, Button, MetricCard, StatusBadge, EmptyState and React Query states.
- Keep all labels in Chinese.

Avoid:
- polished decorative rendering
- invented backend fields
- unrelated settings or navigation changes
