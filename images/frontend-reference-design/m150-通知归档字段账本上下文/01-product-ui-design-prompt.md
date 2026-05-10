# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real Enterprise AI Agent Platform admin page.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 归档治理
- Page/route: M150 通知归档字段账本上下文 at `/security/archives`
- Target users/roles: 安全管理员、租户管理员、审计员；查看需要 `security:approval:view`，处理需要 `security:approval:handle`
- Business goal: 让安全人员在归档治理页快速确认告警通知归档是否保留了导出字段账本上下文，同时不把完整字段清单塞进列表页
- Existing frontend stack/design system: Next.js + React + TypeScript + Tailwind CSS, shadcn-style `Button`/`Card`, lucide icons, `MetricCard`, `StatusBadge`, `SecurityConfirmDialog`
- Existing page shell/layout: `SecurityPolicyBackground` with centered max-width console layout, header actions, source cards, metric cards, two-column archive list and deletion approval queue

Interface contract that must appear in the UI:
- API/service functions: `listSecurityOperationAlertNotificationArchives`, `listSecurityOperationAlertNotificationArchiveApprovals`, `getSecurityOperationAlertNotificationArchiveDownloadUrl`, `deleteSecurityOperationAlertNotificationArchive`
- Main entities and fields: archive `file_name`, `key`, `folder`, `size_bytes`, `last_modified`, `status_filter`, `alert_category_label`, `keyword`, `has_export_field_ledger`, `exported_field_count`, `notification_archive_filter_field_count`; approval `archive_file_name`, `archive_key`, `archive_size_bytes`, `status`, `requested_by`, `reviewed_by`, `requested_at`, `reviewed_at`
- Status values/enums: approval `PENDING`, `APPROVED`, `REJECTED`, `APPLIED`; notification status `SENT`, `PARTIAL`, `SKIPPED`, `FAILED`
- User actions: refresh, switch archive source, download archive, request archive deletion, open deletion approval center
- Required states: loading, empty, error, disabled, success notice, permission-denied, read-only approval handling

Design requirements:
- Production SaaS/admin product, quiet and operational.
- Show the primary workflow clearly: pick "告警通知归档", scan archive files, see lightweight "通知归档字段账本" badges/counts, download or request deletion, review deletion approvals.
- Keep the archive table lean: file identity, filter context chips, field ledger count chips, size/time/actions only.
- Use subtle borders, restrained shadow, light backdrop blur, dense but readable spacing.
- Use Chinese visible text only.
- Emphasize that field ledger context is present without showing full field arrays.

Avoid:
- full JSON blocks, full field arrays, oversized decorative hero, random charts, fake API fields, excessive glow, emoji, or overloaded table columns.
