# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform security event detail enhancement.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: 安全事件详情 at /security/events/[id]
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 审计员打开审批工作台导出事件时，无需阅读原始 JSON 就能快速确认导出字段清单和通知归档筛选字段。
- Existing stack/design system: Next.js + React Query + TypeScript + Tailwind CSS + shadcn/ui style components.

Interface contract:
- Existing API: `getSecurityCenterEvent(eventId)`.
- New display source: `context.exported_fields`, `context.notification_archive_filter_fields`.
- Existing JSON panels remain.

Design requirements:
- Chinese UI only.
- Insert a restrained read-only card between request summary and JSON context.
- Use compact chips for field names.
- Hide the card for events without export field arrays.
- Keep operational, dense, audit-focused layout.

Avoid:
- No CSV preview modal.
- No new action buttons.
- No customer success report body or notification audit message body.
