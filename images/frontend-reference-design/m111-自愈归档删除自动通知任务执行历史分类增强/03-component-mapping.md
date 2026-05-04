# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 任务历史卡片 | `OperationAlertNotificationTaskRunHistoryCard` | `SecurityOperationAlertNotificationTaskRunOverview` | Add M111 badge and category metrics. |
| 任务历史行 | `OperationAlertNotificationTaskRunRow` | `SecurityOperationAlertNotificationTaskRunItem` | Show SLA/self-healing coverage labels. |
| 最近执行结果 | `OperationAlertNotificationTaskResult` | `SecurityOperationAlertNotificationTaskRunResult` | Add category summary tiles. |
| Shared types | `packages/shared-types/src/index.ts` | task run result/summary interfaces | Add two numeric fields to result and summary. |
| 后端任务执行 | `runAutoNotifyForTenant` | auto notify alert ids | Count notified alerts by id category. |
| 后端历史映射 | `mapTaskRunEvent` | `platform_event.payloadJson` | Read category fields with fallback 0 for old events. |
| 后端历史摘要 | `buildTaskRunSummary` | task run items | Sum category counts. |
| 产品文档 | `docs/product/m111-...md` | milestone traceability | Document no migration/container boundary. |
