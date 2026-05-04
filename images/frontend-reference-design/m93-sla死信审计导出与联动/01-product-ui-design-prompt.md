# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: M93 SLA 死信审计导出与联动 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: make SLA notification dead-letter disposition audits exportable and traceable across audit center and monitoring center
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style `Card`, `Button`, `Input`, `StatusBadge`, `EmptyState`
- Existing page shell/layout: enterprise admin dashboard, dense operational cards, subtle borders, soft shadow, clear Chinese labels

Interface contract that must appear in the UI:
- API/service functions:
  - `listSecurityOperationAlertSlaDeadLetterAudits`
  - `exportSecurityOperationAlertSlaDeadLetterAudits`
- Main entities and fields:
  - 事件 ID、通知事件 ID、告警 ID、标题、动作、处置状态、备注、投递事件 ID、操作人、请求 ID、Trace ID、发生时间
- Status values/enums:
  - 动作：认领、重新投递、关闭
  - 状态：待处理、已认领、已重投、已关闭
- User actions:
  - 关键词搜索、动作筛选、状态筛选、重置筛选、刷新审计、导出 CSV、打开审计中心、查看 Trace
- Required states:
  - loading, empty, export running, export success, export error, disabled export when empty/loading

Design requirements:
- Show the M92 audit timeline card extended with a compact action cluster containing “导出 CSV”.
- Each timeline row should expose direct links/buttons for “审计中心” and “Trace” when request_id / trace_id exists.
- Use Chinese UI text only.
- Keep visual style production SaaS/admin: clean hierarchy, subtle border, soft shadow, glass-like white panels, restrained motion hint.
- Use Bento/dashboard layout density; do not add marketing hero content.

Avoid:
- invented API fields
- decorative charts unrelated to audit/export
- exaggerated glow, oversized cards, emoji, unreadable tiny text
