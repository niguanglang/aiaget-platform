# Project UI Brief

- Page: Security Approval Workbench Agent Team Archive
- Route: /security
- Feature goal: 团队运行报告归档删除审批纳入统一安全审批工作台
- Target users and permissions: 安全管理员、租户管理员、审计员；查看使用 `security:approval:view`，处理使用 `security:approval:handle`，租户管理员可绕过权限编码限制。
- Parent layout: Next.js App Router 控制台布局，页面入口 `apps/web/src/app/(console)/security/page.tsx`，主体组件 `apps/web/src/components/security/security-policy-content.tsx`。
- APIs/services: 继续使用 `getSecurityApprovalWorkbenchOverview`、`listSecurityApprovalWorkbenchItems`、`getSecurityApprovalWorkbenchItem`、`reviewSecurityApprovalWorkbenchItem`；后端 `SecurityApprovalWorkbenchService` 新增来源聚合并转发到 `AgentTeamsService.approveRunReportArchiveDeleteApproval/rejectRunReportArchiveDeleteApproval`。
- Entities/fields/statuses: 新审批类型 `AGENT_TEAM_RUN_REPORT_ARCHIVE_DELETE`；状态 `PENDING/APPROVED/REJECTED/APPLIED`；风险域 `AUDIT_ARCHIVE`；风险等级 `CRITICAL`；metadata 包含 `archive_id/archive_key/archive_file_name/archive_size_bytes/team_id/team_name/run_id/run_objective`。
- Existing components/design system: Tailwind CSS、自定义 shadcn 风格 `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`，图标使用 `lucide-react`，动效使用 `motion/react`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied；处理审批时需要防重复提交，审批备注为空允许提交。
- Constraints: 页面文案必须中文；保持现有安全中心页面和统一审批工作台，不新建路由；不新增中间件或容器。
