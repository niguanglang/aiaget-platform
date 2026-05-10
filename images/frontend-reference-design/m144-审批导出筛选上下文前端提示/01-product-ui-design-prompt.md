# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform security approval export notice enhancement.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: 告警与审批 at /security/alerts
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: 让用户在点击“导出当前筛选”前明确知道 CSV 会包含通知归档筛选上下文，导出完成后明确知道 CSV 已包含通知筛选来源、状态和关键词。
- Existing stack/design system: Next.js + React Query + TypeScript + Tailwind CSS + shadcn/ui style components.

Interface contract:
- Existing export service: `exportSecurityApprovalWorkbenchItems(params)`.
- Existing page controls: keyword search, approval type/status/risk-domain filters, current result count, export button.
- New visible copy only: “导出会包含通知归档筛选上下文” and success notice “CSV 已包含通知筛选来源、状态和关键词”.

Design requirements:
- Chinese UI only.
- Keep current compact enterprise admin layout.
- Place helper copy in the existing current-filter line near the export button.
- Keep success notice as a restrained inline feedback banner.
- Preserve page responsibility: approval filtering, detail, review, export.

Avoid:
- No CSV preview table, no extra modal, no new export configuration panel.
- Do not show notification audit body, customer success report content, or archive deletion detail in this page.
