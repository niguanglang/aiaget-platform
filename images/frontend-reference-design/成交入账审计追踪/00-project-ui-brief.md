# Project UI Brief

- Page: 成交入账审计追踪
- Route: /audit
- Feature goal: 审计中心接入计费调账事件检索
- Target users/permissions: 审计员、租户管理员、财务/客户成功负责人；后端接口需要 `security:audit:view`。
- APIs/services: `getAuditOverview({ window })`、`listAuditEvents({ page, page_size, window, source_type, status, keyword })`；事件详情通过 `/audit/events/${event.event_id}` 跳转。
- Entities/fields/statuses: `AuditSummary.login_total/operation_total/approval_audit_total/billing_event_total/security_event_total/config_change_total/success_rate`；`AuditEventListItem.event_id/source_type/status/user_email/module/action/title/summary/request_id/occurred_at`；来源包含 `login/operation/approval_audit/billing`，状态包含 `SUCCESS/DEGRADED/FAILED`。
- Existing components/design system: Next.js App Router 控制台页面，Tailwind CSS，`Card`、`MetricCard`、`StatusBadge`、`EmptyState`、`Button`，`motion/react` 微交互，中文文案。
- Required states: overview/events loading，events error，empty state，筛选清空，详情跳转；本次不新增弹窗和表单。
