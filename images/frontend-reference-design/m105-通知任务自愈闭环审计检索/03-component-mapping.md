# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 审计检索面板 | `apps/web/src/components/security/security-policy-content.tsx` / `OperationAlertNotificationTaskRecoveryAuditCard` | `SecurityOperationAlertNotificationTaskRecoveryAuditOverview` | 放在通知任务中心 M101 历史下面。 |
| 汇总指标 | `MetricCard` | `summary.total_count` 等 | 复用现有指标卡。 |
| 筛选工具栏 | `select` + `Input` + `Button` | `action`、`status`、`reason_code`、`keyword` | 参照 M101 执行历史筛选。 |
| 审计表格 | HTML table + `StatusBadge` | audit item fields | 显示建议、原因、动作、状态、备注、请求、链路和处理时间。 |
| 审计联动 | `Button asChild` + `Link` | `request_id`、`trace_id` | `/audit?keyword=...` 和 `/monitor?keyword=...`。 |
| 后端 DTO | `apps/control-api/src/security-center/dto/list-security-operation-alert-notification-task-recovery-audits.dto.ts` | filters | action/status/reason/keyword。 |
| 后端接口 | `apps/control-api/src/security-center/security-center.controller.ts` | `GET /security-center/operation-alert-notification-task-recovery-suggestions/audits` | 复用 `security:rule:view`。 |
| 后端查询 | `apps/control-api/src/security-center/security-center.service.ts` | `platform_event` | 读取 M104 三类 lifecycle event。 |
| 共享类型 | `packages/shared-types/src/index.ts` | `SecurityOperationAlertNotificationTaskRecoveryAudit*` | 前后端共用列表合同。 |
| 前端 API | `apps/web/src/lib/api-client.ts` | `listSecurityOperationAlertNotificationTaskRecoveryAudits` | 用 React Query 接入。 |
