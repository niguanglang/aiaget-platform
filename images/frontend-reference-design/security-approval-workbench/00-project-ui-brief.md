# Project UI Brief

- Page: security-approval-workbench
- Route: /security
- Feature goal: 安全中心细分审批统一工作台
- Target users and permissions: 安全管理员、租户管理员、审计员；查看需要 `security:approval:view`，处理需要 `security:approval:handle` 或租户管理员角色。
- Parent layout: Next.js App Router 控制台布局 `apps/web/src/app/(console)/layout.tsx`，页面入口 `apps/web/src/app/(console)/security/page.tsx`，主体组件 `apps/web/src/components/security/security-policy-content.tsx`。
- APIs/services: 新增 `getSecurityApprovalWorkbenchOverview`、`listSecurityApprovalWorkbenchItems`、`getSecurityApprovalWorkbenchItem`、`reviewSecurityApprovalWorkbenchItem`；保留现有工具审批、通知策略审批、归档删除审批接口。
- Entities/fields/statuses: 审批类型 `TOOL_CALL`、`NOTIFICATION_POLICY`、`APPROVAL_AUDIT_ARCHIVE_DELETE`、`SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE`、`NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE`、`OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE`；状态 `PENDING`、`APPROVED`、`REJECTED`、`APPLIED`；风险域 `TOOL`、`POLICY`、`AUDIT_ARCHIVE`、`OPERATION_ALERT`。
- Existing components/design system: Tailwind CSS、自定义 shadcn 风格 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`，图标使用 `lucide-react`，动效使用 `motion/react`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied；处理审批时需要防重复提交，审批备注为空允许提交。
- Constraints: 页面文案必须中文；保持 SaaS 管理后台信息密度，避免过度渐变和无关装饰；复用现有安全中心页面，不新建独立路由。
