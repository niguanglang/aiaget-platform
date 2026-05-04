# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: M97 SLA 死信审计归档删除审批筛选批量运营 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: improve operational efficiency for archive deletion approvals with status filtering, keyword search, pending-only view, and current-filter CSV export
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style `Card`, `Button`, `Input`, `StatusBadge`, `EmptyState`
- Existing page shell/layout: compact security operations dashboard, subtle border cards, Chinese UI

Interface contract that must appear in the UI:
- API/service functions:
  - list archive deletion approvals
  - get archive deletion approval detail
  - approve deletion
  - reject deletion
- Fields:
  - approval id, archive file name, archive key, archive size, status, reason, requester, reviewer, requested_at, reviewed_at
- Status values:
  - 全部、待审批、已批准、已拒绝、已生效
- User actions:
  - 搜索、状态筛选、只看待办、重置筛选、导出 CSV、刷新审批、查看详情、批准删除、拒绝
- Required states:
  - loading, empty filtered result, disabled export, selected row, success feedback

Design requirements:
- Extend existing M96 approval card without changing route.
- Add a compact toolbar above approval queue.
- Show filter summary: total approvals, filtered count, pending in current filter.
- Keep approval detail and timeline visible below the filtered queue.
- Use Chinese UI text only.
- Keep visual language production SaaS/admin, dense and operational.

Avoid:
- invented backend fields
- unrelated bulk destructive actions
- decorative charts, hero sections, emoji, excessive gradients
