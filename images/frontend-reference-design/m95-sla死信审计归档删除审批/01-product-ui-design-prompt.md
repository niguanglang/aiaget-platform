# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: M95 SLA 死信审计归档删除审批 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: protect archived SLA dead-letter audit CSV files by requiring approval before deletion
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style `Card`, `Button`, `Input`, `MetricCard`, `StatusBadge`, `EmptyState`
- Existing page shell/layout: security operations dashboard, compact cards, subtle borders, soft shadows, Chinese labels

Interface contract that must appear in the UI:
- APIs:
  - request archive deletion
  - list archive deletion approvals
  - approve deletion
  - reject deletion
- Main entities and fields:
  - approval id, archive id, archive file name, archive key, archive size, status, reason, requested_by, reviewed_by, requested_at, reviewed_at
- Status values:
  - 待审批、已批准、已拒绝、已生效
- User actions:
  - 申请删除、填写审批意见、批准删除、拒绝删除、刷新审批
- Required states:
  - loading, empty, requesting, approving, rejecting, success, error, disabled

Design requirements:
- Extend the M94 archive download panel with an “申请删除” button for each archive.
- Add a separate approval card below the archive list showing metrics and pending deletion approvals.
- Include an approval note input and row actions “批准删除” and “拒绝”.
- Use Chinese UI text only.
- Keep it production SaaS/admin, operational and dense, no marketing hero.

Avoid:
- direct destructive delete without approval
- invented billing/storage settings
- excessive gradients, emoji, glow, oversized cards
