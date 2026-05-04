# Project UI Brief

- Page: Security Agent Team Report Archive Operations
- Route: /security
- Feature goal: 团队运行报告归档删除审批运营看板与告警闭环
- Target users and permissions: 安全管理员、租户管理员、审计员；查看安全中心需要现有安全中心权限，审批处理仍走统一审批工作台的 `security:approval:view` 和 `security:approval:handle`。
- Parent layout: Next.js App Router 控制台布局，页面入口 `apps/web/src/app/(console)/security/page.tsx`，主体组件 `apps/web/src/components/security/security-policy-content.tsx`。
- APIs/services: `GET /api/v1/security-center/overview` 返回 `approval_operations`；前端 `getSecurityOverview` 驱动 `ApprovalArchiveOperationsCard`。
- Entities/fields/statuses: 新增团队运行报告归档删除统计 `agent_team_report_archive_delete_pending/approved/rejected/applied`；待审最早时间 `agent_team_report_archive_delete_pending_oldest_at`；运营告警 `agent-team-report-archive-delete-pending` 和 `agent-team-report-archive-delete-rejected-risk`。
- Existing components/design system: Tailwind CSS、自定义 shadcn 风格 `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`，图标使用 `lucide-react`，动效使用 `motion/react`。
- Required states: loading, empty, error, disabled, success, permission-denied；运营告警需要正常、待处理、拒绝复核、归档风险状态。
- Constraints: 页面显示中文；复用现有安全中心页面和“审批与归档运营”卡片，不新建独立路由；不新增中间件或容器。
