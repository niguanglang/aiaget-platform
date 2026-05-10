# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-alerts-content.tsx` | `/security/alerts` route | Reuse current page; no new route. |
| Notification filters | Existing notification audit card toolbar | `ListSecurityOperationAlertNotificationsParams.status/alert_category/keyword` | Add source filter with customer success option. |
| Export action | Existing `downloadBlob` helper + API client | `exportSecurityOperationAlertNotifications` | Export current notification filters only. |
| Archive action | Notification audit card action button | `createSecurityOperationAlertNotificationArchive` | Create object storage archive for current filters; deletion remains in `/security/archives`. |
| Notification rows | Existing compact list rows | `SecurityOperationAlertNotificationItem.alert_category_label/status/message/retry_count/created_at` | Show Chinese source label instead of raw enum when available. |
| Backend CSV label | `SecurityCenterService` CSV builder | `alert_category_label` | Keep enum as machine field, add readable label for operations. |
