# Project UI Brief

- Page: 安全中心 / 统一安全审批工作台
- Route: `/security`
- Feature goal: 团队运行报告归档删除统一审批工作台详情审计与来源筛选增强
- Users: 租户管理员、安全管理员、审计员；查看需要 `security:approval:view`，处理需要 `security:approval:handle`。
- APIs/services:
  - `GET /security-center/approval-workbench/overview`
  - `GET /security-center/approval-workbench`
  - `GET /security-center/approval-workbench/:approvalId`
  - `POST /security-center/approval-workbench/:approvalId/review`
- Entities/fields/statuses:
  - `SecurityApprovalWorkbenchItem`: `id`, `source_id`, `type`, `source_module`, `target_id`, `target_label`, `status`, `risk_domain`, `risk_level`, `requester`, `reviewer`, `request_id`, `trace_id`
  - `SecurityApprovalWorkbenchDetail.metadata`: `archive_id`, `archive_key`, `archive_file_name`, `archive_size_bytes`, `team_id`, `team_name`, `run_id`, `run_objective`
  - `SecurityApprovalWorkbenchTimelineItem`: `type`, `title`, `status`, `actor`, `occurred_at`, `request_id`, `trace_id`
  - 状态：`PENDING`, `APPROVED`, `REJECTED`, `APPLIED`
- Existing components/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格；复用 `SecurityApprovalWorkbenchCard`, `SecurityApprovalWorkbenchDetailPanel`, `StatusBadge`, `MetricCard`, `SummaryTile`, `EmptyState`, `Button`。
- Required states: loading, empty, error, validation, disabled, success, permission-denied.
- Constraints: 前端文案使用中文；不新增中间件、容器、数据库表或迁移；详情增强必须兼容历史归档删除申请。
