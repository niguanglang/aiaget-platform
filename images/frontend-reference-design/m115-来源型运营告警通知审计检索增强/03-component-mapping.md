# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 通知投递审计筛选 | `OperationAlertNotificationAuditCard` | `ListSecurityOperationAlertNotificationsParams` | 新增来源分类和关键词筛选。 |
| 通知投递审计导出 | `exportSecurityOperationAlertNotifications` | `GET /operation-alert-notifications/export` | 当前筛选条件导出 CSV。 |
| 通知投递审计归档 | `create/list/get...Archive` | StorageService object archive | 归档为对象存储 CSV，不新增表。 |
| 后端过滤 | `listOperationAlertNotifications` | `platform_event.payloadJson.alert_category` | 支持 status、alert_category、keyword。 |
| CSV 构建 | `buildSecurityOperationAlertNotificationCsv` | `SecurityOperationAlertNotificationItem[]` | 包含 request_id、trace_id、分类、Webhook 错误。 |
| Archive item type | `packages/shared-types` | `SecurityOperationAlertNotificationArchiveItem` | 复用对象存储字段结构。 |
| 前端 API | `apps/web/src/lib/api-client.ts` | security-center endpoints | 增加导出、归档列表、下载 URL。 |
| 产品文档 | `docs/product/m115-...md` | milestone traceability | 记录不迁移、不容器、不新增表边界。 |
