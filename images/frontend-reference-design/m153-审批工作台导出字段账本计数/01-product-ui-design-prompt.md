# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise AI Agent Platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 告警运营 / 审批工作台导出治理
- Page/route: M153 审批工作台导出字段账本计数 at `/security/alerts`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 用户导出统一审批工作台 CSV 前能确认导出会包含通知归档字段账本计数，离线审计不用再回查对象存储归档 metadata
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS, compact dashboard layout, cards, buttons, status badges
- Existing page shell/layout: `/security/alerts` approval workbench card with filters and export button

Interface contract:
- API/service functions: `exportSecurityApprovalWorkbenchItems`
- Fields in CSV: existing approval columns plus `通知归档字段账本`, `导出字段数`, `归档筛选字段数`
- User actions: filter approval queue, export current filter, see success/error notice

Design requirements:
- Keep the approval queue table unchanged.
- Update the export helper text and success notice to mention field ledger counts.
- Chinese text only.
- Compact operational UI, no extra charts.

Avoid:
- adding list columns, expanding JSON in rows, fake fields, decorative effects.
