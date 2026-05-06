# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise AI operations console page.

Project context:
- Product/module: AIAget approval center.
- Page/route: Approval Center at `/approvals`, with child route entries for `/approvals/tools`, `/approvals/notification-policy`, and `/approvals/archive-deletions`.
- Target users/roles: security operators and tenant admins who can view approval queues; only users with approval handling permission can approve or reject.
- Business goal: make the first screen a concise approval workbench overview and route users into the correct focused queue without mixing all approval types into one long page.
- Existing frontend stack/design system: Next.js App Router, React Query, Tailwind, lucide icons, compact SaaS/admin UI, existing `Button`, `Card`, `MetricCard`, `StatusBadge`, `EmptyState` components.
- Existing page shell/layout: console content area with constrained max width, compact header, metric cards, cards/tables, Chinese UI copy.

Interface contract that must appear in the UI:
- API/service functions: `getToolApprovalOverview`, `getNotificationPolicyApprovalOverview`, `getApprovalAuditArchiveApprovalOverview`, `listToolApprovals`, `getToolApproval`, `approveToolApproval`, `rejectToolApproval`, `listNotificationPolicyApprovals`, `getNotificationPolicyApproval`, `approveNotificationPolicyApproval`, `rejectNotificationPolicyApproval`, `listApprovalAuditArchiveApprovals`, `getApprovalAuditArchiveApproval`, `approveApprovalAuditArchiveApproval`, `rejectApprovalAuditArchiveApproval`, plus existing security and Agent team archive deletion approval APIs for archive-deletion entry summaries.
- Main entities and fields: tool approvals with tool name/code, trigger source, approval status, execution status, requester, context; notification policy approvals with setting name/key, action, approval status, impact level, previous/next status; archive deletion approvals with archive file name, object key, file size, status, reason, requester, review time.
- Status values/enums: pending, approved, rejected, applied, high/medium/low impact, test/runtime trigger source, execution success/failed/waiting/rejected.
- User actions: refresh, filter/search within child pages, select row, view detail, approve, reject, open related tool/conversation/settings/audit page.
- Required states: loading, empty, API error, action error, disabled actions without permission, success after mutation, stale data refresh.

Design requirements:
- Make `/approvals` look like a production admin workbench overview: header, total pending summary, three queue cards, critical indicators, and clear route buttons.
- Show that full tables and review forms live on focused child pages, not on the overview.
- Use Chinese labels: 审批中心, 高危工具审批, 通知策略审批, 归档删除审批, 待审批, 已通过, 已拒绝, 已生效, 审批审计.
- Keep the visual style quiet, utilitarian, dense, and scannable; avoid a marketing hero.
- Show realistic tables/detail/action panels on child page references, using only fields listed above.
- Include permission-disabled approve/reject states and empty/error placeholders.

Avoid:
- fake API fields not listed above
- unrelated workflow engines or custom backend routes
- decorative dashboards, random charts, lorem ipsum, or English-only UI
- putting all approval queues and processing forms on `/approvals`
