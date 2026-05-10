# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform security event detail page enhancement.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: 安全事件详情 at /security/events/[id]
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 审计员查看审批工作台导出事件时，可以在上下文 JSON 中确认 CSV 导出了哪些字段，以及是否包含通知归档筛选来源、状态和关键词。
- Existing frontend stack/design system: Next.js + React Query + TypeScript + Tailwind CSS + shadcn/ui style components.

Interface contract:
- Existing API: `getSecurityCenterEvent(eventId)`.
- Existing detail component: `SecurityEventDetailContent`.
- Data appears in existing JSON areas: request_summary, context.
- New context fields: `exported_fields`, `notification_archive_filter_fields`.

Design requirements:
- Chinese UI only.
- Keep current detail page layout: header, base info, request/trace, related object, request summary, subject/resource/context JSON.
- Do not add a separate CSV preview.
- Make the JSON context readable and focused for audit review.

Avoid:
- No new list columns.
- No customer success report content or notification audit body.
- No new settings or export controls.
