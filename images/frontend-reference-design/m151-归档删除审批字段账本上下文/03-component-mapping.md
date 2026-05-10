# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/approvals/archive-deletion-approvals-content.tsx` | `/approvals/archive-deletions` route | 复用审批中心页面壳 |
| Queue table | `ArchiveDeletionApprovalTable` | unified `ArchiveApprovalItem` | 安全告警归档行显示字段账本摘要 |
| Detail panel | `ArchiveDeletionApprovalDetailPanel` | selected `ArchiveApprovalItem` | 在筛选摘要后追加字段账本摘要 |
| Field ledger summary | new `ArchiveFieldLedgerSummary` helper | M149 fields from `SecurityOperationAlertNotificationArchiveApprovalItem` | 只展示已保留和计数，不展示完整数组 |
| Context mapping | `archiveApprovalFilterContext` and new ledger mapping | shared type fields | 其他归档来源没有字段时保持空摘要 |
| IA contract | `approvals-route-ia-contract.test.ts` | source-level route contract | 先补红灯，保护列表边界 |
| Product docs | `docs/product/m151-archive-deletion-approval-field-ledger.md` | milestone acceptance criteria | 记录验收边界 |
