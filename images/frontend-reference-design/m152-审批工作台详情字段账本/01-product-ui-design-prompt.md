# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise AI Agent Platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 告警运营 / 统一审批工作台
- Page/route: M152 审批工作台详情字段账本 at `/security/alerts`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 审批人在统一安全审批工作台详情中，直接看到通知归档删除审批是否保留字段账本，而不是只能打开 JSON 查找
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn-style cards/buttons, `StatusBadge`, `DetailLine`, `JsonBlock`
- Existing page shell/layout: `/security/alerts` two-column approval workbench with left queue and right detail panel

Interface contract that must appear in the UI:
- API/service functions: `getSecurityApprovalWorkbenchItem`, `reviewSecurityApprovalWorkbenchItem`
- Main fields: `metadata.has_export_field_ledger`, `metadata.exported_field_count`, `metadata.notification_archive_filter_field_count`, timeline same fields, approval status/risk/requester/reviewer
- User actions: select approval, approve, reject, write note
- Required states: no selection, loading, error, disabled/read-only, handled approval

Design requirements:
- Keep approval queue unchanged and compact.
- In detail panel, show a small bordered field ledger block between approval reason and source extension JSON.
- The block uses Chinese labels: 通知归档字段账本、导出字段、归档筛选字段.
- Show timeline events with compact field ledger chips only when available.
- Preserve existing JSON source extension below as secondary technical context.

Avoid:
- full field arrays in the approval queue, oversized sections, invented backend fields, emoji, or decorative distractions.
