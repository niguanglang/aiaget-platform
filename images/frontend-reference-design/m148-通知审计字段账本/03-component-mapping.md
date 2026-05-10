# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-alerts-content.tsx` | `/security/alerts` route | 复用现有安全中心背景和工作台 Header |
| Notification audit card | `SecurityAlertsContent` 内“通知审计” Card | `listSecurityOperationAlertNotifications` | 保持卡片职责，不拆新页面 |
| Filters | select/input in notification audit card | status/category/keyword query | 保持现有筛选项 |
| Export/archive actions | `Button` + `exportSecurityOperationAlertNotifications` / `createSecurityOperationAlertNotificationArchive` | notification query filters | 更新提示文案，说明字段账本进入 CSV |
| Field ledger hint | 新增轻量提示条 | `exported_fields`, `notification_archive_filter_fields` | 只展示字段账本概念和数量，不展开完整清单 |
| Row summary | existing notification row | `SecurityOperationAlertNotificationItem` | 加“字段账本”小标签，避免信息过载 |
| Feedback states | `LoadingRows`, `EmptyState`, `PageError`, notice/error blocks | React Query / mutations | 复用现有状态表达 |
