# Project UI Brief

- Page: M91 SLA死信处置闭环
- Route: /security
- Feature goal: 审批与归档告警 SLA 通知死信认领、关闭、重新投递与处置审计
- Target users/permissions: 安全管理员、租户管理员、审计员；沿用 `security:rule:view` 后端权限入口。
- APIs/services:
  - `GET /api/v1/security-center/operation-alert-sla/dead-letters/overview`
  - `POST /api/v1/security-center/operation-alert-sla/dead-letters/:notificationEventId/actions`
  - 前端 `getSecurityOperationAlertSlaDeadLetterOverview`、`handleSecurityOperationAlertSlaDeadLetterAction`
- Entities/fields/statuses:
  - 死信项：通知事件 ID、告警 ID、标题、投递状态、重试次数、Webhook 状态、Webhook 错误、死信原因、处置状态、处置备注、处理人、处理时间、最近投递时间
  - 死信处置动作：`CLAIM` 认领、`REQUEUE` 重新投递、`CLOSE` 关闭
  - 死信处置状态：`OPEN` 待处理、`CLAIMED` 已认领、`REQUEUED` 已重新投递、`CLOSED` 已关闭
- Existing components/design system: Next.js App Router console；React Query；Tailwind CSS；`Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`；安全中心现有 bento/dashboard 卡片。
- Required states: loading, empty, error, action disabled while pending, success result, dead-letter risk state, audit trail preview.
- Constraints:
  - 不新增数据库表，死信处置通过 `platform_event` 写入生命周期事件。
  - 不启动容器、不安装中间件、不执行迁移。
  - 页面文案必须中文。
