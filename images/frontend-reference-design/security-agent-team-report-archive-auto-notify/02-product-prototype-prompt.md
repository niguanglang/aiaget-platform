# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for a real enterprise SaaS admin page extension.

Project context:
- Page/route: 安全中心 at `/security`
- Users/roles: 安全管理员、租户管理员、审计员
- Main task flow: 安全管理员打开安全中心 -> 查看通知任务中心 -> 发现团队运行报告归档删除告警已纳入待自动通知和执行历史分类 -> 查看失败来源或自愈建议 -> 根据来源排查 Webhook、调度或策略。
- API/service contract: `getSecurityOperationAlertNotificationTaskOverview` returns task overview; `listSecurityOperationAlertNotificationTaskRuns` returns run history with source counts; `listSecurityOperationAlertNotificationTaskRecoveryAudits` returns self-healing audit by failure source.
- Data entities and fields: `agent_team_report_archive_delete_notify_count`, `notification_task_agent_team_report_archive_delete_failed_24h`, `agent_team_report_archive_delete_failed_count`, `agent_team_report_archive_delete_source_count`, task status, trigger type, request_id, trace_id.
- Actions and states: refresh task, run auto notify, run auto retry, filter by task/status/failure source, loading, empty, source warning.

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show regions: notification task status header, auto notify card, retry card, task run history table, recovery audit filter row, recovery audit table.
- Make the new team report source visible in metrics, row badges, filters, and warning banner.
- Keep component boundaries obvious for mapping to existing React components.

Avoid:
- polished decorative rendering, invented backend fields, unrelated navigation, unsupported batch approval actions.
