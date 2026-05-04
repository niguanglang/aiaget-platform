# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Security page shell | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | Reuse existing page |
| Security overview API | `getSecurityCenterOverview` | `SecurityCenterOverview` | Extend response type |
| Backend aggregation | `SecurityCenterService.getOverview` | Prisma + StorageService | Add approval/archive operations stats |
| Storage archive stats | `StorageService.listTenantObjects` | MinIO prefix `audit-archives/approval-audits` | Catch storage unavailable gracefully |
| Operations card | new `ApprovalArchiveOperationsCard` component inside security content | `overview.approval_operations` | Chinese UI |
| Quick links | `Link`, `Button` | `/approvals`, `/approval-audits`, `/audit` | No new route |
| Product docs | `docs/product/m82-approval-archive-operations-dashboard.md` | milestone acceptance | Link from README |
