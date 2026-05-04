# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AI Agent 平台，安全中心，审批与归档告警 SLA 通知死信处置
- Page/route: 安全中心 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 将 M90 的 SLA 通知死信展示升级为可运营闭环，支持认领、重新投递、关闭和处置审计，让外部 Webhook 或订阅策略故障可以被追踪处理。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，React Query，lucide-react 图标，现有 `Card`、`Button`、`Input`、`MetricCard`、`StatusBadge`、`EmptyState`。
- Existing page shell/layout: `/security` 安全中心仪表盘，审批与归档运营区域使用 Bento/Dashboard Layout，细边框、浅背景、轻阴影、克制动效。

Interface contract that must appear in the UI:
- API/service functions:
  - `getSecurityOperationAlertSlaDeadLetterOverview()`
  - `handleSecurityOperationAlertSlaDeadLetterAction(notificationEventId, { action, note })`
- Main entities and fields:
  - 概览：待处理、已认领、已重新投递、已关闭、最早死信、最近处置时间
  - 死信项：标题、通知事件 ID、状态、重试次数、Webhook 状态、错误、死信原因、处置状态、处理人、处理时间、备注
  - 最近处置结果：动作、处置状态、备注、处理人、处理时间
- Status values/enums:
  - `OPEN` 待处理, `CLAIMED` 已认领, `REQUEUED` 已重新投递, `CLOSED` 已关闭
  - actions: `CLAIM` 认领, `REQUEUE` 重新投递, `CLOSE` 关闭
- User actions: 输入处置备注、认领、重新投递、关闭、刷新死信。
- Required states: loading, empty, error, disabled while pending, success, permission-denied where relevant.

Design requirements:
- Use Chinese UI text only.
- Keep the design production-grade and operational: clear metrics, queue list, action area, audit summary.
- Match existing security center cards: subtle border, soft shadow, clean dashboard spacing, restrained motion.
- Avoid decorative noise that competes with operational data; no emoji, no cheap glow, no overdone gradients.
