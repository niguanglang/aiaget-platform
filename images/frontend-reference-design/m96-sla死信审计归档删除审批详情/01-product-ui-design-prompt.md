# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform security center page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: M96 SLA 死信审计归档删除审批详情 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: make archive deletion approvals traceable by showing approval detail, event timeline, audit links, and trace links
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style `Card`, `Button`, `Input`, `StatusBadge`, `EmptyState`
- Existing page shell/layout: security operations dashboard, compact cards, subtle borders, soft shadows, Chinese labels

Interface contract that must appear in the UI:
- API/service functions:
  - list archive deletion approvals
  - get archive deletion approval detail
  - approve deletion
  - reject deletion
- Main entities and fields:
  - approval id, archive file name, archive key, archive size, status, reason, requested_by, reviewed_by, requested_at, reviewed_at
  - audit timeline: event id, event type, event status, title, note, actor, request id, trace id, occurred_at
- Status values:
  - 待审批、已批准、已拒绝、已生效
  - 申请删除、批准删除、拒绝删除、删除生效
- User actions:
  - 选择审批记录、查看详情、填写审批意见、批准删除、拒绝、打开审计中心、查看 Trace、刷新审批
- Required states:
  - loading, empty, error, selected, approving, rejecting, disabled

Design requirements:
- Extend the existing M95 deletion approval card.
- Use a two-region layout: approval queue on one side, selected approval detail and timeline on the other side.
- Make the selected approval visually clear without oversized cards.
- Show timeline rows with event status badges, actor, time, note, request id, trace id, and action links.
- Use Chinese UI text only.
- Keep it production SaaS/admin, dense but readable, with clear hierarchy and restrained motion-ready surfaces.

Avoid:
- invented fields not present in the data contract
- direct destructive delete without approval
- unrelated charts, marketing hero, excessive gradients, emoji, glow
