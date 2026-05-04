# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台，安全中心，审批与归档告警 SLA 通知可靠性
- Page/route: 安全中心 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 让运营人员看到 SLA 超时通知中失败或部分成功的投递，自动重试满足退避条件的记录，并把超过最大重试次数的记录进入死信视图，形成通知可靠性闭环。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，React Query，lucide-react 图标，现有 `Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`。
- Existing page shell/layout: `/security` 已是安全中心仪表盘页面，审批与归档运营区域使用 Bento/Dashboard Layout，细边框、浅背景、轻阴影、克制动效。

Interface contract that must appear in the UI:
- API/service functions:
  - `getSecurityOperationAlertSlaNotificationRetryOverview()`
  - `runSecurityOperationAlertSlaNotificationAutoRetry()`
  - `retrySecurityOperationAlertSlaNotification(notificationEventId)`
- Main entities and fields:
  - 策略：任务开关、扫描间隔、单批数量、最大重试、退避时间、回看窗口、配置来源
  - 摘要：待自动重试、失败投递、部分成功、已重试、死信、最早可重试时间、最近死信时间
  - 投递记录：通知事件 ID、告警标题、状态、渠道、目标、Webhook 状态、Webhook 错误、重试次数、来源事件、投递时间、死信原因
  - 最近执行结果：扫描、重试、成功、失败、跳过、死信、完成时间、错误信息
- Status values/enums: `SENT` 已投递, `PARTIAL` 部分成功, `SKIPPED` 已跳过, `FAILED` 投递失败; task `SUCCESS` 成功, `FAILED` 失败, `SKIPPED` 已跳过。
- User actions: 刷新重试状态、立即扫描重试、单条重试、查看死信列表。
- Required states: loading, empty, error, disabled while running, success, partial-data, dead-letter warning.

Design requirements:
- Make it look like a production SaaS/admin product, not a generic template.
- Use Chinese UI text only.
- Use a clean enterprise dashboard composition with a retry health strip, metric cards, policy panel, retry queue, dead-letter queue, and latest task result.
- Keep gradients subtle; use fine borders, soft shadows, backdrop blur, and clear hierarchy.
- Use restrained motion cues implied by hover states and refresh spinners, but do not make animation flashy.
- Avoid oversized decorative elements, emoji, cheap glow, over-saturated gradients, and information overload.
