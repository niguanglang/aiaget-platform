# Project UI Brief

- Page: M92 SLA处置审计时间线与搜索
- Route: /security
- Feature goal: 审批与归档告警 SLA 死信处置事件时间线、关键词搜索与动作筛选
- Target users/permissions: 安全管理员、租户管理员、审计员；沿用 `security:rule:view`。
- APIs/services:
  - `GET /api/v1/security-center/operation-alert-sla/dead-letter-audits`
  - 前端 `listSecurityOperationAlertSlaDeadLetterAudits`
- Entities/fields/statuses:
  - 审计项：事件 ID、通知事件 ID、告警 ID、标题、动作、处置状态、备注、处置人、请求 ID、Trace ID、重新投递事件 ID、发生时间
  - 筛选：`keyword`、`action`、`disposition_status`、`page`、`page_size`
  - 动作：`CLAIM`、`REQUEUE`、`CLOSE`
  - 状态：`OPEN`、`CLAIMED`、`REQUEUED`、`CLOSED`
- Existing components/design system: Next.js App Router；React Query；Tailwind CSS；`Card`、`Button`、`Input`、`StatusBadge`、`EmptyState`；安全中心已有审计列表、分页和时间线样式。
- Required states: loading, empty, error, filter reset, disabled refresh, paginated result.
- Constraints:
  - 只读查询，不新增表，不跑迁移。
  - UI 文案中文。
