# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/route: M102 通知任务失败聚合与运营告警升级 at `/security`
- Users/roles: 安全管理员、审计员、租户管理员
- Main task flow: 用户查看审批与归档运营 -> 看到通知任务风险指标 -> 如果失败率或连续失败触发告警 -> 在运营告警闭环卡片中通知/确认/升级/关闭 -> 打开通知任务历史排查。
- API/service contract: `GET /security-center/overview`, alert notify/action APIs.
- Data fields: notification_task_runs_24h, notification_task_failed_24h, notification_task_skipped_24h, notification_task_failure_rate_24h, notification_task_consecutive_failures, operational_alerts.
- Actions/states: healthy, degraded, high-risk, notify, acknowledge, escalate, close.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Place M102 metric strip inside existing approval/archive operations card, before operational alert cards.
- Show a clear boundary between metrics and alert cards.
- Alert cards remain existing component shape; only new alert content is added.
- Include empty/healthy state where no task failure risk exists.
- Keep labels Chinese.

Avoid:
- polished decorative rendering
- invented backend fields
- unrelated pages or extra modules
