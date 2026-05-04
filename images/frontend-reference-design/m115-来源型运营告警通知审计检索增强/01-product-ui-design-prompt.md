# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心 / 运营告警通知投递审计
- Page/route: M115 来源型运营告警通知审计检索增强 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: source-specific operational alert notification deliveries can be filtered, searched, exported as CSV, and archived for audit retention.
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style cards/buttons/status badges.
- Existing page shell/layout: Reuse current `/security` approval/archive operations card and notification delivery audit section.

Interface contract that must appear in the UI:
- Metrics for total delivery records, retryable records, source-risk records, failed/partial records.
- Filters: status select, alert category select, keyword input, reset button.
- Actions: refresh, export CSV, create archive, retry notification.
- Archive panel: archive file name, size, last modified, download link.
- Table rows show status, alert id, category badge, message, channels, targets, webhook status/error, retry count, request/trace, delivery time.

Design requirements:
- Chinese UI text only.
- Dense enterprise operations layout with compact controls.
- Subtle borders, soft shadows, background transparency consistent with existing security center.
- Keep controls ergonomic for repeated audit work.

Avoid:
- new route
- decorative charts
- marketing hero layout
- unsupported approval workflow changes
