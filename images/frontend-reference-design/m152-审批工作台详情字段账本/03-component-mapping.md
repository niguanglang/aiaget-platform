# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-alerts-content.tsx` | `/security/alerts` route | 复用安全中心告警运营布局 |
| Approval detail | `ApprovalDetailPanel` | `SecurityApprovalWorkbenchDetail` | 增加字段账本摘要块 |
| Timeline rows | timeline map inside `ApprovalDetailPanel` | `SecurityApprovalWorkbenchTimelineItem` | 事件级轻量 chip |
| Field ledger helpers | new local helpers | `has_export_field_ledger`, `exported_field_count`, `notification_archive_filter_field_count` | 不展开完整字段数组 |
| Backend detail mapping | `security-approval-workbench.service.ts` | platform event payload metadata | 把 M149 字段带入 metadata/timeline |
| Tests | `security-approval-workbench.service.test.ts`, `security-route-ia-contract.test.ts` | backend + frontend contracts | 红绿验证 |
