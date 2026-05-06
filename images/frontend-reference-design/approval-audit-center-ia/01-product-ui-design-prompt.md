Create a high-fidelity product UI design image for an enterprise approval audit center.

Project context:
- Product/module: 企业 AI Agent 平台 / 安全中心 / 审批审计
- Page/route set: `/approval-audits`, `/approval-audits/events/[eventId]`, `/approval-audits/archives`, `/approval-audits/archives/create`
- Target users/roles: 安全管理员、审计员、租户管理员、平台运营人员
- Business goal: 快速检索审批事件，按来源/类型/状态/Trace 定位风险，再进入独立详情页或归档管理页处理审计留痕。
- Existing frontend stack/design system: Next.js App Router, React Query, TypeScript, Tailwind CSS, shadcn-style Button/Card/EmptyState/MetricCard/StatusBadge, lucide icons, motion microinteractions.
- Existing page shell/layout: 企业控制台左侧导航 + 顶栏；内容区最大宽度 `max-w-7xl`，卡片 8px radius，细边框、轻阴影、紧凑表格。

Interface contract that must appear in the UI:
- API/service functions: `getApprovalAuditOverview`, `listApprovalAuditEvents`, `getApprovalAuditEvent`, `listApprovalAuditArchives`, `getApprovalAuditArchiveDownloadUrl`, `deleteApprovalAuditArchive`, `createApprovalAuditArchive`, `exportApprovalAuditEvents`.
- Main entities and fields: approval audit event `id`, `source_type`, `source_id`, `event_type`, `event_status`, `title`, `note`, `request_id`, `trace_id`, `actor`, `occurred_at`, `metadata`; archive `file_name`, `folder`, `size_bytes`, `key`, `last_modified`, `download_expires_in`.
- Status values/enums: `INFO`, `SUCCESS`, `WARNING`, `FAILED`; source values `TOOL_APPROVAL`, `NOTIFICATION_POLICY`, `APPROVAL_AUDIT_ARCHIVE`; windows `24h`, `7d`, `30d`.
- User actions: filter/search, clear, refresh, open event detail, open related approval, open Trace, open archive center, download archive, request archive deletion with confirmation, generate archive, export CSV.
- Required states: loading, empty, error, disabled, success feedback, delete confirmation, mutation in progress.

Design requirements:
- Show `/approval-audits` as a focused list page with metric cards, source/type ranking cards, filter toolbar, and event table with a row-level “查看详情” action.
- Show event detail as a dedicated page layout with a back button, event identity, status badges, basic information, actor/source/request fields, metadata JSON, and related action buttons.
- Show archive management as a dedicated table with archive metrics, file rows, download and delete-request actions.
- Show archive generation as a focused form/workflow with filter controls, CSV export, MinIO archive generation, and success/error feedback.
- Keep visual language minimal, technical, polished, and operational. Use Chinese labels. Avoid marketing hero composition.

Avoid:
- invented API fields not listed above
- mixing event detail and archive tables back into the list page
- overly decorative gradients, emoji, large rounded blobs, or fake unrelated charts
