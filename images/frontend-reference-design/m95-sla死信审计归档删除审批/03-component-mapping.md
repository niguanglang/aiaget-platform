# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | 继续增强 M94 归档面板 |
| 申请删除按钮 | archive table row `Button` + `Trash2` | `deleteSecurityOperationAlertSlaDeadLetterAuditArchive` | 只提交审批，不直接删除 |
| 审批概览 | `MetricCard` / local archive metric | `SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalOverview` | pending/approved/rejected/applied |
| 审批队列 | new local approval panel | `SecurityOperationAlertSlaDeadLetterAuditArchiveApprovalItem[]` | 展示文件、状态、申请人、时间 |
| 审批意见 | `Input` | `ReviewToolApprovalInput` | 复用 decision_note |
| 批准/拒绝 | `Button` | approve/reject API | 批准后删除对象并刷新归档列表 |
| 后端事件 | `platform_event` | event type `...archive_delete_*` | 不新增表 |
| 后端删除 | `SecurityOperationAlertSlaService.approveDeadLetterAuditArchiveDeleteApproval` | `StorageService.deleteTenantObject` | 审批通过后生效 |
