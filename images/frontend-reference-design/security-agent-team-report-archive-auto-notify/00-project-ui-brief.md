# Project UI Brief

- Page: Security Agent Team Report Archive Auto Notify
- Route: /security
- Feature goal: 团队运行报告归档删除审批告警自动通知任务分类
- Target users and permissions: 安全管理员、租户管理员、审计员；查看安全中心需要安全中心权限，执行自动通知任务沿用现有安全中心操作入口。
- Parent layout: Next.js App Router 控制台布局，页面入口 `apps/web/src/app/(console)/security/page.tsx`，主体组件 `apps/web/src/components/security/security-policy-content.tsx`。
- APIs/services: `getSecurityOperationAlertNotificationTaskOverview`、`listSecurityOperationAlertNotificationTaskRuns`、`listSecurityOperationAlertNotificationTaskRecoveryAudits`、`runSecurityOperationAlertNotificationAutoNotify`、`runSecurityOperationAlertNotificationAutoRetry`。
- Entities/fields/statuses: `SecurityOperationAlertNotificationTaskRunResult` 新增 `agent_team_report_archive_delete_notify_count`；`SecurityCenterOverview.approval_operations` 新增 `notification_task_agent_team_report_archive_delete_failed_24h`；自愈建议和审计新增 `AGENT_TEAM_REPORT_ARCHIVE_DELETE` 来源与 `agent_team_report_archive_delete_failed_count`。
- Existing components/design system: Tailwind CSS、shadcn 风格 `Card`、`Button`、`MetricCard`、`SummaryTile`、`StatusBadge`、`EmptyState`，图标使用 `lucide-react`。
- Required states: loading, empty, error, disabled, success；自动通知任务支持空闲、执行中、已启用、未启用、失败来源风险状态。
- Constraints: 页面文案中文；复用 `/security` 的“通知任务中心”和“任务执行历史与审计检索”，不新建路由，不新增中间件或容器。
