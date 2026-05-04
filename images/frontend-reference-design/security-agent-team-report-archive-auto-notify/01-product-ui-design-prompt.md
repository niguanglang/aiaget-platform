# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS admin page extension.

Project context:
- Product/module: 企业 Agent 平台 / 安全中心 / 通知任务中心
- Page/route: 安全中心 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 把团队运行报告归档删除审批告警纳入自动通知任务分类，使安全管理员可以在同一个安全中心页面看到 SLA 死信、团队报告和自愈归档删除三类来源的通知覆盖、失败来源和自愈审计。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn 风格组件，使用 `Card`、`Button`、`MetricCard`、`SummaryTile`、`StatusBadge`、`EmptyState`。
- Existing page shell/layout: 复用 `/security` 安全中心页面，增强现有“审批与归档运营 -> 通知任务中心”和“任务执行历史与审计检索”区域。

Interface contract that must appear in the UI:
- API/service functions: `getSecurityOperationAlertNotificationTaskOverview`, `listSecurityOperationAlertNotificationTaskRuns`, `listSecurityOperationAlertNotificationTaskRecoveryAudits`, `runSecurityOperationAlertNotificationAutoNotify`, `runSecurityOperationAlertNotificationAutoRetry`.
- Main fields: `sla_dead_letter_notify_count`, `agent_team_report_archive_delete_notify_count`, `recovery_archive_delete_notify_count`, `notification_task_agent_team_report_archive_delete_failed_24h`, `agent_team_report_archive_delete_failed_count`, `agent_team_report_archive_delete_source_count`.
- Status values/enums: `AUTO_NOTIFY`, `AUTO_RETRY`, `SUCCESS`, `FAILED`, `SKIPPED`, `SLA_DEAD_LETTER_ARCHIVE_DELETE`, `AGENT_TEAM_REPORT_ARCHIVE_DELETE`, `NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE`, `MIXED`, `UNKNOWN`.
- User actions: 刷新任务、立即自动通知、立即扫描重试、刷新执行历史、按任务/状态/来源筛选、查看自愈闭环审计。
- Required states: loading, empty, running, disabled, success, failed source warning.

Design requirements:
- Production SaaS/admin style, compact and operational.
- The notification task center should clearly show three source categories: SLA 死信、团队报告、自愈归档.
- Task history metrics should include “团队覆盖” next to “SLA 覆盖”和“自愈覆盖”.
- Failure source warning should include SLA、团队、自愈 counts and a concise Chinese alert banner.
- Recovery audit filter should include “团队报告归档删除” source.
- Use subtle borders, soft shadows, compact cards, no marketing hero.

Avoid:
- invented routes, unrelated batch actions, decorative gradients, emoji, loud glow, oversized rounded blocks.
