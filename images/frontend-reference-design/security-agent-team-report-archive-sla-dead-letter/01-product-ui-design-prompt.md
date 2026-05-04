# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: 安全中心 at `/security`
- Target users/roles: 租户管理员、安全管理员、审计员
- Business goal: 管理审批与归档告警的 SLA 超时通知、自动重试、失败死信、人工处置和审计归档，并突出“团队报告归档删除”来源在 SLA 通知与死信闭环中的一致性。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui 风格组件
- Existing page shell/layout: 管理后台页面，卡片式运营区块，Bento Grid/Dashboard Layout，细边框、轻阴影、克制动效

Interface contract that must appear in the UI:
- API/service functions: SLA 通知概览、超时通知、自动重试概览、立即扫描重试、单条重试、死信概览、死信认领/重投/关闭、死信处置审计列表、CSV 导出、审计归档
- Main entities and fields: `notification_event_id`, `alert_id`, `alert_category`, `title`, `status`, `channels`, `targets`, `webhook_status`, `retry_count`, `dead_lettered`, `disposition_status`, `action`, `request_id`, `trace_id`, `occurred_at`
- Status values/enums: `SENT`, `PARTIAL`, `SKIPPED`, `FAILED`, `OPEN`, `CLAIMED`, `REQUEUED`, `CLOSED`, `AGENT_TEAM_REPORT_ARCHIVE_DELETE`, `SLA_DEAD_LETTER_ARCHIVE_DELETE`, `NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE`
- User actions: 刷新、手动通知、立即扫描重试、单条重试、认领、重新投递、关闭、按来源筛选、按动作筛选、按状态筛选、导出 CSV、创建归档
- Required states: loading, empty, error, validation, disabled, success, permission-denied where relevant

Design requirements:
- Make it look like a production SaaS/admin product, not a generic template.
- Use Chinese visible copy only.
- Show the primary workflow clearly: 来源分类进入 SLA 通知记录，失败后进入重试队列，超过次数进入死信，人工处置后进入审计与归档。
- Use compact status badges to identify “团队报告归档删除”.
- Use realistic table/card/detail regions based on the interface contract.
- Keep visual language minimal, technical, clean, and enterprise-grade with subtle borders, soft shadows, white/translucent surfaces, and restrained gradient mesh only as background depth.

Avoid:
- Fake API fields not listed above.
- Decorative UI that cannot map to project components.
- Emoji, over-glow, crowded cards, unreadable text, random charts, and unrelated modules.
