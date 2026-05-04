# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 导出按钮 | `OperationAlertNotificationTaskRecoveryAuditCard` | `exportSecurityOperationAlertNotificationTaskRecoveryAudits` | 下载当前筛选结果 CSV。 |
| 归档面板 | 新增局部组件 `OperationAlertNotificationTaskRecoveryAuditArchivePanel` | `SecurityOperationAlertNotificationTaskRecoveryAuditArchiveListResult` | 放在 M105 审计表格下方。 |
| 归档指标 | `MetricCard` | `summary.archive_count`、`summary.total_size_bytes` | 展示文件数和容量。 |
| 归档列表 | Tailwind list rows + `Button` | archive item fields | 文件名、大小、更新时间、下载。 |
| 后端导出 | `apps/control-api/src/security-center/security-center.controller.ts` | `GET .../audits/export` | 返回 `text/csv`。 |
| 后端归档 | `apps/control-api/src/security-center/security-center.service.ts` | storage service | 写入 `audit-archives/security-notification-task-recovery-audits/`。 |
| 共享类型 | `packages/shared-types/src/index.ts` | archive item/list/create result | 复用 SLA 死信归档字段形态。 |
| 前端 API | `apps/web/src/lib/api-client.ts` | export/create/list/download functions | 复用已有 CSV blob 和 signed URL 模式。 |
| 文档 | `docs/product/m106-approval-archive-alert-notification-task-recovery-audit-archive.md` | N/A | 记录边界：M106 不做删除审批。 |
