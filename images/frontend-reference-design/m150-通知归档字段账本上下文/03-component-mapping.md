# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-archives-content.tsx` | `/security/archives` route | 复用安全中心背景、Header、归档来源切换 |
| Source cards and metrics | `archiveSources`, `buildSourceSummary`, `MetricCard` | archive list summaries and approval overview | 不新增业务对象 |
| Archive table | `ArchiveRow` | `SecurityOperationAlertNotificationArchiveItem` plus recovery/SLA union | 通知归档行额外展示字段账本摘要，其他来源不展示 |
| Deletion approval list | `ApprovalRow` | `SecurityOperationAlertNotificationArchiveApprovalItem` plus recovery/SLA union | 通知归档删除审批保留同样字段账本摘要 |
| Field ledger chips | new helper in `security-archives-content.tsx` | `has_export_field_ledger`, `exported_field_count`, `notification_archive_filter_field_count` | 只展示计数和是否存在，不展开完整字段清单 |
| Actions | Existing `Button`, `SecurityConfirmDialog` | download/delete services | 删除继续二次确认并进入审批 |
| Contract test | `apps/web/src/components/security/security-route-ia-contract.test.ts` | source-level IA contract | 先补红灯，确保不把字段明细塞进列表 |
| Product docs | `docs/product/m150-notification-archive-field-ledger-frontend.md` | milestone acceptance criteria | 记录 M150 页面边界和验收 |
