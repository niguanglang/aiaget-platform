# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | 继续增强 M96 面板 |
| 审批筛选工具栏 | local JSX inside `OperationAlertSlaDeadLetterAuditArchivePanel` | local state | keyword/status/pending-only |
| 审批队列 | `SlaDeadLetterAuditArchiveApprovalRow` | `SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[]` | 改为渲染 filtered approvals |
| 筛选摘要 | `ArchiveMetric` | filtered approval counts | 当前筛选数量、待办数量 |
| CSV 导出 | existing `downloadBlob` helper | filtered approvals | 前端本地生成 CSV |
| 详情和时间线 | M96 detail panel | selected approval detail API | 与筛选结果联动 |
| 空态 | `EmptyState` | filtered result | 区分没有审批和筛选无结果 |
