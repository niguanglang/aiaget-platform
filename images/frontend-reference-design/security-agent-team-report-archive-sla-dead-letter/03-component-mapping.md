# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route shell | 复用当前安全中心长页面，不新增路由 |
| SLA 通知概览 | `OperationAlertSlaNotificationCard` | `SecurityOperationAlertSlaNotificationOverview` | 通知列表增加 `alert_category` 标签 |
| 通知重试队列 | `OperationAlertSlaNotificationRetryCard` / `OperationAlertSlaNotificationRetryRow` | `SecurityOperationAlertSlaNotificationRetryOverview` | 可重试项展示来源分类 |
| 失败死信队列 | `OperationAlertSlaDeadLetterRow` | `SecurityOperationAlertSlaNotificationItem` | 死信卡片展示团队报告归档删除来源 |
| 死信处置 | `OperationAlertSlaDeadLetterDispositionCard` / `OperationAlertSlaDeadLetterDispositionRow` | `SecurityOperationAlertSlaDeadLetterOverview` | 处置队列展示来源分类 |
| 死信处置审计 | `OperationAlertSlaDeadLetterAuditCard` / `OperationAlertSlaDeadLetterAuditRow` | `ListSecurityOperationAlertSlaDeadLetterAuditsParams`, `SecurityOperationAlertSlaDeadLetterAuditItem` | 增加来源筛选和审计行标签 |
| 后端事件映射 | `security-operation-alert-sla.service.ts` | `platformEvent.payloadJson.alert_category` | 通知事件、重试、重投、死信动作、CSV 导出统一携带来源 |
| API 客户端 | `apps/web/src/lib/api-client.ts` | `ListSecurityOperationAlertSlaDeadLetterAuditsParams` | 列表、导出、归档请求透传 `alert_category` |
