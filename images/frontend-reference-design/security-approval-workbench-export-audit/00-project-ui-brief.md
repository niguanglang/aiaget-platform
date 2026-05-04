# Project UI Brief

- Page: 安全中心 / 统一安全审批工作台
- Route: `/security`
- Feature goal: 统一安全审批工作台筛选结果导出 CSV，并把导出行为写入平台事件审计，方便审计员追踪谁导出了哪些审批范围。
- Users: 租户管理员、安全管理员、审计员；查看和导出均需要 `security:approval:view`，处理审批仍需要 `security:approval:handle`。
- APIs/services:
  - `GET /security-center/approval-workbench/overview`
  - `GET /security-center/approval-workbench`
  - `GET /security-center/approval-workbench/export`
  - `GET /security-center/approval-workbench/:approvalId`
  - `POST /security-center/approval-workbench/:approvalId/review`
- Entities/fields/statuses:
  - `SecurityApprovalWorkbenchItem`: `id`, `source_id`, `type`, `source_module`, `title`, `status`, `risk_domain`, `risk_level`, `target_label`, `requester`, `reviewer`, `requested_at`, `reviewed_at`, `request_id`, `trace_id`
  - `ListSecurityApprovalWorkbenchQuery`: `keyword`, `type`, `status`, `risk_domain`, `page`, `page_size`
  - Export audit event: `platform.security.approval_workbench.exported`, `filter`, `exported_count`
  - 状态：`PENDING`, `APPROVED`, `REJECTED`, `APPLIED`
- Existing components/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格；复用 `SecurityApprovalWorkbenchCard`, `Button`, `StatusBadge`, `MetricCard`, `SummaryTile`, `EmptyState`。
- Required states: loading, empty, error, disabled, success, permission-denied, exporting.
- Constraints: 前端可见文案使用中文；不新增路由、不新增数据库表、不新增中间件、不启动容器；导出遵循当前筛选条件，最多导出后端限制数量。
