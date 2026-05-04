# Project UI Brief

- Page: 安全中心 / 审批与归档运营
- Route: `/security`
- Feature goal: 将统一安全审批工作台导出事件纳入运营指标与告警闭环，识别导出量异常、短时间重复导出、高风险筛选导出。
- Users: 租户管理员、安全管理员、审计员；查看需要 `security:rule:view`。
- APIs/services:
  - `GET /security-center/overview`
  - `POST /security-center/operation-alerts/:alertId/notify`
  - `POST /security-center/operation-alerts/:alertId/actions`
  - 导出事件来源：`platform.security.approval_workbench.exported`
- Entities/fields/statuses:
  - `SecurityCenterOverview.approval_operations`
  - 新增字段：`approval_workbench_exports_24h`, `approval_workbench_exported_records_24h`, `approval_workbench_high_risk_exports_24h`, `approval_workbench_repeated_exports_24h`
  - `SecurityCenterOperationalAlert`: `id`, `title`, `description`, `severity`, `metric`, `status`, `action_label`
- Existing components/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格；复用 `SecurityOperationsCard`, `OperationMetricTile`, `OperationAlertCard`, `StatusBadge`, `Button`。
- Required states: loading, empty, degraded alert, acknowledged/escalated/closed alert, notification sending.
- Constraints: 前端可见文案使用中文；不新增路由、不新增数据库表、不新增中间件、不启动容器；复用已有运营告警和通知动作。
