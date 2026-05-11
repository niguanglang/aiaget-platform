# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise AI Agent Platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 告警运营
- Page/route: 告警运营 at `/security/alerts`
- Target users/roles: 安全管理员、租户管理员、审计员；审批操作需要 `security:approval:handle`，SLA 持久化视图为只读审计展示。
- Business goal: 在安全告警页补齐 SLA 自动重试与死信通知的持久化追踪字段，帮助运营人员追溯通知来源、请求、Trace 和重放键。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件，使用 Card、MetricCard、StatusBadge、Button、EmptyState。
- Existing page shell/layout: 控制台页面，中文界面，`max-w-7xl` 内容宽度，卡片式 Bento/Dashboard 布局，细边框、轻阴影、玻璃质感但不夸张。

Interface contract that must appear in the UI:
- API/service functions: `getSecurityOperationAlertSlaOverview()`、`getSecurityOperationAlertSlaNotificationRetryOverview()`、`getSecurityOperationAlertSlaDeadLetterOverview()`。
- Main entities and fields: SLA 告警 `title/status/due_at`；自动重试 `retryable_items/dead_letter_items/notification_event_id/status/retry_count/source_system/source_id/dedupe_key/request_id/trace_id/replay_key/delivered_at`；死信处置 `disposition_status/latest_action/latest_action_event_id/latest_action_at`。
- Status values/enums: 通知状态 `SENT/PARTIAL/SKIPPED/FAILED`；死信处置 `OPEN/CLAIMED/REQUEUED/CLOSED`；死信动作 `CLAIM/REQUEUE/CLOSE`。
- User actions: 页面级刷新、跳转自愈恢复；本区域只读展示，不新增复杂操作。
- Required states: loading rows、empty state、error message、disabled refresh while fetching。

Design requirements:
- Show the primary workflow clearly: SLA 告警摘要 -> 自动重试候选 -> 死信队列 -> 最近处置。
- Use compact operational cards with clear field labels: 事件来源、来源 ID、去重键、请求、Trace、重放键、最近处置。
- Keep list density moderate; each item should show identity, status badges, short message, and persistence identifiers.
- Use restrained enterprise SaaS styling: subtle border, soft shadow, clean whitespace, Chinese labels.

Avoid:
- inventing unsupported actions such as inline dead-letter approval on this page
- overcrowding the existing notification audit list
- decorative gradients that reduce readability
- English UI labels or emojis
