# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M110 通知任务自愈归档删除审批自动通知任务 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow:
  1. M108/M109 形成自愈归档删除审批运营告警和手动通知能力。
  2. 后台自动通知任务扫描可首发通知告警。
  3. 扫描范围覆盖 SLA 死信归档删除和自愈归档删除审批告警。
  4. 任务投递站内记录和 Webhook。
  5. 任务中心展示待自动通知、已覆盖、最早待通知、最近执行结果。
- API/service contract:
  - get task overview
  - run auto notify
  - run auto retry
  - list task runs
- Actions and states: refresh, run auto notify, run auto retry, loading, running, empty, success, failed, skipped.

Prototype requirements:
- Use wireframe style.
- Keep the existing `/security` page shell and task center region.
- Show these regions clearly:
  1. Task center header with M100/M110/M87 badges and scheduler state.
  2. Scheduling status card.
  3. Policy card.
  4. First auto-notify card with coverage text “SLA 死信 + 自愈归档删除”.
  5. Metric tiles for pending, covered, oldest pending.
  6. Last auto notify result block.
  7. Existing auto retry card unchanged.
- Include empty state for no pending auto notification.

Avoid:
- separate task page
- settings forms or unrelated notification channels
- charts not backed by existing fields
