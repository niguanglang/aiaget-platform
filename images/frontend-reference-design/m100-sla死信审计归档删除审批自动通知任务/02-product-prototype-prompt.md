# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M100 SLA 死信审计归档删除审批自动通知任务 at `/security`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 安全中心加载任务概览 -> 用户查看自动通知待办和自动重试待办 -> 用户可点击“立即自动通知”或“立即扫描重试” -> 最近执行结果刷新 -> 通知审计列表记录投递结果
- API/service contract:
  - `GET /security-center/operation-alert-notification-tasks/overview`
  - `POST /security-center/operation-alert-notification-tasks/run-auto-notify`
  - `POST /security-center/operation-alert-notification-tasks/run-auto-retry`
- Data entities and fields:
  - policy: auto notify/retry enabled, interval, batch size, retry max/backoff/lookback
  - summary: pending auto notify, auto notified count, oldest auto notify time, pending auto retry, failed/partial/retried notification counts
  - result: task, status, scanned, notified, retried, success, failed, skipped, finished time, error message
- Actions and states:
  - refresh
  - run auto notify
  - run auto retry
  - loading card
  - empty pending work
  - disabled while running
  - recent result success/failed/skipped

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show the existing safety center card shell, then a section titled “通知任务中心”.
- Inside that section, split content into two columns on desktop:
  - Left: “M100 首发自动通知”
  - Right: “M87 失败自动重试”
- Each column should have:
  - status badges
  - top metrics
  - policy summary tiles
  - action button
  - latest result block
  - empty state placeholder
- On mobile, stack the two panels vertically.
- Make component boundaries obvious so each area maps to existing React components.
- Keep labels Chinese and match the listed API fields.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation or unrelated charts
