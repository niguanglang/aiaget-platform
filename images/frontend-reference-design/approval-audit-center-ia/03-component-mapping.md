# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Event list shell | `apps/web/src/components/approval-audits/approval-audit-content.tsx` | `getApprovalAuditOverview`, `listApprovalAuditEvents` | Keep overview, rankings, filters, table, route actions only. |
| Event detail route | `apps/web/src/components/approval-audits/approval-audit-event-detail-content.tsx` | `getApprovalAuditEvent`, `ApprovalAuditEventItem` | Dedicated route for full event fields and metadata JSON. |
| Archive management route | `apps/web/src/components/approval-audits/approval-audit-archives-content.tsx` | `listApprovalAuditArchives`, `getApprovalAuditArchiveDownloadUrl`, `deleteApprovalAuditArchive` | Dedicated archive table; delete uses confirmation because it creates approval. |
| Archive generation route | `apps/web/src/components/approval-audits/approval-audit-archive-create-content.tsx` | `createApprovalAuditArchive`, `exportApprovalAuditEvents` | Focused form for export filters, CSV download, and MinIO archive generation. |
| Shared labels/formatting | `apps/web/src/components/approval-audits/approval-audit-shared.tsx` | shared-types enums | Keep labels, status tones, detail rows, JSON preview, filters, and helpers small. |
| Route pages | `apps/web/src/app/(console)/approval-audits/.../page.tsx` | App Router params/searchParams | Wrap client pages that use `useSearchParams` in Suspense. |
| Menu seed | `apps/control-api/prisma/seed.ts` | `securityApprovalView` | Add static `/approval-audits/archives` child menu; keep dynamic event and create routes out of menu seed. |
| Contract tests | `apps/web/src/components/approval-audits/approval-audits-route-ia-contract.test.ts`, `apps/control-api/src/menus/approval-audit-menu-ia-contract.test.ts` | source-level IA contracts | Protect route boundaries and menu placement. |
