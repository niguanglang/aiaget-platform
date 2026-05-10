# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell/header | `apps/web/src/components/approvals/archive-deletion-approvals-content.tsx` + `ApprovalPageShell` | Route `/approvals/archive-deletions` | Keep Chinese approval-center child page responsibility. |
| Overview metrics | `MetricCard` in archive deletion approvals content | `getApprovalAuditArchiveApprovalOverview` plus workbench aggregate counts | No new chart; only compact counts. |
| Source filter/list toolbar | Local source filter controls in `ArchiveDeletionApprovalsContent` | `ArchiveSource` local union | Filters approval source only; notification archive status remains displayed context, not page filter. |
| Approval table | `ArchiveDeletionApprovalTable` | `ArchiveApprovalItem` mapped from archive approval list DTOs | Core columns only; render `ArchiveFilterSummary` under file metadata. |
| Filter context chips | `ArchiveFilterSummary` + `archiveFilterSummary` | `status_filter`、`alert_category_label`、`keyword` | Shows 筛选来源、筛选状态、筛选关键词 with fallback label for customer success report archive delete. |
| Detail panel | `ArchiveDeletionApprovalDetailPanel` | Selected `ArchiveApprovalItem` and `getSecurityApprovalWorkbenchItem` detail | Detail includes same filter context and links; does not expand customer success or notification body details. |
| Decision actions | `DecisionActions` | approve/reject archive deletion approval mutations | Disabled while pending or when user lacks handling permission. |
| Timeline | `ApprovalAuditTimeline` | `SecurityApprovalWorkbenchDetail.timeline` | Backend timeline carries filter context for notification archive delete requests. |
| Feedback states | `ErrorBanner`、`EmptyState`、loading blocks | React Query loading/error states | Keep existing page behavior and Chinese messages. |
