# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. 用户进入安全中心审批与归档运营区域。
  2. 查看 SLA 超时通知的待重试、失败、部分成功、死信指标。
  3. 检查当前重试策略：单批数量、最大次数、退避时间、回看窗口。
  4. 点击“立即扫描重试”触发后台任务。
  5. 对单条失败/部分成功通知点击“重试”。
  6. 查看最近执行结果和死信原因。
- API/service contract:
  - `GET /security-center/operation-alert-sla/notification-retry/overview`
  - `POST /security-center/operation-alert-sla/notification-retry/run`
  - `POST /security-center/operation-alert-sla/notifications/:notificationEventId/retry`
- Data entities and fields:
  - Retry overview summary: pending_auto_retry_count, failed_notification_count, partial_notification_count, retried_notification_count, dead_letter_count, oldest_retryable_at, last_dead_letter_at
  - Policy: auto_retry_enabled, retry_interval_ms, retry_batch_size, max_retry_count, retry_backoff_seconds, lookback_hours, source
  - Item row: title, status, channels, targets, webhook_status, webhook_error, retry_count, delivered_at, dead_letter_reason
  - Result: scanned_count, retried_count, success_count, failed_count, skipped_count, dead_letter_count, finished_at

Prototype requirements:
- Low- to mid-fidelity wireframe, focused on layout and states.
- Show one card inside the existing SLA notification area:
  - Header with status badges and actions.
  - Four to six metric tiles.
  - Left policy panel.
  - Right retry queue list with row action.
  - Dead-letter list below or beside retry queue.
  - Latest task result block.
- Include loading placeholder, empty queue placeholder, disabled running button, and error text area.
- Keep layout responsive: stacked on mobile, two-column on desktop.
