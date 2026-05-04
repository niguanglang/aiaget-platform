# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise AI Agent Platform archive approval workflow.

Project context:
- Product/module: 企业 AI Agent 平台，归档操作审计与删除审批化
- Page/routes: `/approval-audits` and `/approvals`
- Target users/roles: 安全管理员、审计员、租户管理员
- Business goal: every approval audit archive operation is auditable, and deleting an archive requires approval before the MinIO object is removed.
- Existing design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-like Card/Button/MetricCard/StatusBadge/EmptyState, TanStack Query, Motion.

Interface contract:
- `/approval-audits` archive card shows existing archive files with actions `下载`, `申请删除`, and operation status.
- Archive operation audit states: `已归档`, `下载链接已生成`, `删除待审批`, `删除已通过`, `删除已拒绝`, `删除已生效`.
- `/approvals` adds a third queue tab `归档删除`.
- Archive deletion approval list fields: 时间、归档文件、审批状态、申请人、对象路径、原因.
- Archive deletion approval detail fields: 归档文件、对象路径、大小、更新时间、申请人、申请时间、审批审计时间线、决策备注.
- Actions: approve archive delete, reject archive delete, open approval audit, refresh.

Design requirements:
- Chinese UI labels only.
- Enterprise SaaS operations style: clean hierarchy, subtle borders, soft shadow, glass-like cards, compact table density.
- Show the workflow clearly: user requests archive deletion -> approval queue -> decision -> audit timeline.
- Keep the design restrained and product-realistic.

Avoid:
- fake unrelated channels, emoji, overdone gradients, noisy decorations, invented database fields.
