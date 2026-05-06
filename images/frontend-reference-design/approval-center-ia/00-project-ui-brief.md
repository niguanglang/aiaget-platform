# Project UI Brief

- Page: Approval Center IA
- Route family: `/approvals`, `/approvals/tools`, `/approvals/notification-policy`, `/approvals/archive-deletions`
- Feature goal: Keep `/approvals` as an approval workbench overview with pending summaries and route entries, then move each complete approval list and processing surface into a focused child route.
- Target users/roles: 安全运营、租户管理员、系统运营；read surfaces use `security:approval:view`, processing actions use `security:approval:handle`, and tenant admins continue to bypass through existing auth conventions.
- API/service contract from `apps/web/src/lib/api-client.ts`:
  - Overview: `getToolApprovalOverview`, `getNotificationPolicyApprovalOverview`, `getApprovalAuditArchiveApprovalOverview`, plus archive deletion counts from security/Agent team approval list and overview APIs already exported in `api-client`.
  - `/approvals/tools`: `listToolApprovals`, `getToolApproval`, `approveToolApproval`, `rejectToolApproval`.
  - `/approvals/notification-policy`: `listNotificationPolicyApprovals`, `getNotificationPolicyApproval`, `approveNotificationPolicyApproval`, `rejectNotificationPolicyApproval`.
  - `/approvals/archive-deletions`: `listApprovalAuditArchiveApprovals`, `getApprovalAuditArchiveApproval`, `approveApprovalAuditArchiveApproval`, `rejectApprovalAuditArchiveApproval`, and existing security/Agent team archive deletion approval APIs where list/review flows are already supported.
- Entities/fields/statuses: `ToolApprovalListItem` and `ToolApprovalDetail` with created time, tool, trigger source, approval status, execution status, requester, request/response payloads, audit timeline; `SystemSettingSnapshotItem` with setting name/key, action, approval status, impact level, requester, previous/next value and audit timeline; archive deletion approval items with archive file name/key/size, status, reason, requester/reviewer timestamps, audit timeline when detail is available.
- Existing components/design system: Next App Router, React Query, `useAuth`, `hasPermission`, `Button`, `Card`, `EmptyState`, `MetricCard`, `StatusBadge`, Tailwind utilities, lucide icons, and the existing approval status helpers.
- Required states: loading, empty, API error, action error, disabled action buttons when permission is missing or item is no longer pending, refresh, filter reset, row selection, and route entry cards from the overview.
- IA constraints: `/approvals` must not contain all approval type tables and processing forms; child pages own their respective full list/detail/action workflows; no new backend APIs; keep `/approval-audits` unchanged except linking to it.
