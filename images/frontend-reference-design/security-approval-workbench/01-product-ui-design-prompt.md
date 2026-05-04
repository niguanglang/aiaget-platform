# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI Agent platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心
- Page/route: 安全中心细分审批统一工作台 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员；查看审批、处理审批、审计归档删除风险
- Business goal: 把散落在工具调用、通知策略、审批审计归档、SLA 死信归档、自愈审计归档、运营告警通知归档中的审批统一到一个可筛选、可处理、可审计的工作台
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn-like components, lucide icons, motion micro-interactions
- Existing page shell/layout: 控制台左侧导航 + 顶部栏；主内容为安全中心页面中的一个宽屏工作区

Interface contract that must appear in the UI:
- API/service functions: `getSecurityApprovalWorkbenchOverview`, `listSecurityApprovalWorkbenchItems`, `getSecurityApprovalWorkbenchItem`, `reviewSecurityApprovalWorkbenchItem`
- Main entities and fields: approval id, approval type, title, description, status, risk domain, risk level, source module, requester, reviewer, requested time, reviewed time, target label, target id, reason, decision note, request id, trace id, timeline events
- Status values/enums: `PENDING`, `APPROVED`, `REJECTED`, `APPLIED`; decision actions `APPROVE`, `REJECT`; risk levels `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- User actions: search keyword, filter by approval type, risk domain, status, select row, approve, reject, refresh, open detail, inspect timeline, copy request id/trace id
- Required states: loading, empty, error, disabled when no permission, success message after approval decision, permission-denied banner for read-only users

Design requirements:
- Use a production SaaS/admin dashboard style with clear hierarchy, Chinese labels, compact but readable density.
- Top section: 4-6 metric cards for pending approvals, high-risk pending, archive-delete pending, applied count, SLA overdue-related approvals.
- Main section: left or center approval table/list with segmented filters and search; right detail panel with approval summary, risk facts, action buttons, note textarea, and timeline.
- Include subtle border, soft shadow, restrained glass-like panels, but avoid heavy glowing effects and oversized decorative elements.
- Use familiar icons for approval, archive, shield, clock, trace, and warning.
- Keep interactions clear: selected row, hover states, disabled buttons when not allowed, loading placeholders.

Avoid:
- fake backend fields not listed above
- landing page composition, marketing hero, random charts, unreadable tiny text
- overuse of purple/blue gradient, large rounded blobs, emoji, excessive glow
