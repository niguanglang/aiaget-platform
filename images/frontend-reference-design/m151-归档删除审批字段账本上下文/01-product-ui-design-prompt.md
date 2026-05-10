# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise AI Agent Platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 审批中心 / 归档删除审批
- Page/route: M151 归档删除审批字段账本上下文 at `/approvals/archive-deletions`
- Target users/roles: 安全管理员、租户管理员、审计员
- Business goal: 在统一归档删除审批聚合页中，让审批人快速判断“安全告警归档”删除申请是否保留了通知审计字段账本上下文
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn-style `Card`/`Button`, `StatusBadge`, `MetricCard`, `DecisionActions`
- Existing page shell/layout: approval page shell, metric summary cards, left queue table, right detail panel

Interface contract that must appear in the UI:
- API/service functions: `listSecurityOperationAlertNotificationArchiveApprovals`, `approveSecurityOperationAlertNotificationArchiveApproval`, `rejectSecurityOperationAlertNotificationArchiveApproval`
- Main entities and fields: `archive_file_name`, `archive_key`, `archive_size_bytes`, `status`, `requested_by`, `reviewed_by`, `requested_at`, `reviewed_at`, `status_filter`, `alert_category_label`, `keyword`, `has_export_field_ledger`, `exported_field_count`, `notification_archive_filter_field_count`
- Status values/enums: `PENDING`, `APPROVED`, `REJECTED`, `APPLIED`
- User actions: filter source, select approval, approve deletion, reject deletion, open source page/storage
- Required states: loading, empty, error, disabled/read-only, confirmation dialog for approval actions

Design requirements:
- Use a production admin layout with clear left queue and right detail.
- Keep the queue table compact; show field ledger as a small chip group inside the archive file cell.
- Detail panel should show the same field ledger summary below filter context.
- Chinese text only.
- Use subtle borders, muted backgrounds, restrained shadows, and consistent component density.

Avoid:
- complete JSON blocks for this new context, full field arrays, new unrelated metrics, oversized decorative UI, excessive gradients, emoji, or adding fields not supported by the API.
