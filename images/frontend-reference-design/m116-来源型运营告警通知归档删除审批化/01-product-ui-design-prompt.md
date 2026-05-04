# Product UI Design Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: 企业 AIAgent 平台 / 安全中心 / 审批与归档运营
- Page/route: 来源型运营告警通知归档删除审批化 at `/security`
- Target users/roles: 安全管理员、租户管理员、审计员，权限沿用 `security:rule:view`
- Business goal: 用户在通知投递审计归档列表中只能提交“申请删除”，安全管理员在同一区域查看归档删除审批队列、审批详情和事件时间线；审批通过后对象存储归档才会被删除。
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui-style components, existing `Card` / `Button` / `Input` / `StatusBadge` / `MetricCard` / `EmptyState`.
- Existing page shell/layout: `/security` page, inside “审批与归档运营 -> 通知投递审计”, dense SaaS admin layout with tables, compact metric cards, filters and detail panels.

Interface contract that must appear in the UI:
- API/service functions:
  - `deleteSecurityOperationAlertNotificationArchive(archiveId)`
  - `getSecurityOperationAlertNotificationArchiveApprovalOverview()`
  - `listSecurityOperationAlertNotificationArchiveApprovals()`
  - `getSecurityOperationAlertNotificationArchiveApproval(approvalId)`
  - `approveSecurityOperationAlertNotificationArchiveApproval(approvalId, { decision_note })`
  - `rejectSecurityOperationAlertNotificationArchiveApproval(approvalId, { decision_note })`
- Main entities and fields:
  - Archive: `id`, `file_name`, `key`, `folder`, `size_bytes`, `last_modified`
  - Approval item: `id`, `archive_id`, `archive_key`, `archive_file_name`, `archive_size_bytes`, `status`, `reason`, `requested_by`, `reviewed_by`, `requested_at`, `reviewed_at`
  - Timeline: `event_id`, `event_type`, `status`, `title`, `note`, `actor`, `request_id`, `trace_id`, `occurred_at`
- Status values/enums: `PENDING`, `APPROVED`, `REJECTED`, `APPLIED`
- User actions: refresh archive list, download archive, request delete, filter approvals, view approval detail, approve delete, reject delete, refresh approvals, export current approval filter locally.
- Required states: loading, empty, filtered empty, error message, success message, disabled buttons while deleting/downloading/approving/rejecting.

Design requirements:
- Make it look like a production SaaS/admin product, not a generic marketing page.
- Use compact cards and tables suited for repeated security operations.
- Show the primary workflow clearly: archive list -> request delete -> approval queue -> approval detail -> timeline -> approve/reject.
- Use restrained borders, soft shadows, subtle glass/backdrop treatment only where consistent with the current page.
- Use Chinese UI text.
- Emphasize operational clarity, auditability, and traceability.

Avoid:
- fake API fields not listed above
- decorative charts unrelated to archive deletion approval
- unreadable tiny text, placeholder lorem ipsum
- visually loud gradients, emoji, cheap glow, or oversized rounded blocks
