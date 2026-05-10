# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/security/security-archives-content.tsx` | `/security/archives` route | Reuse current archive governance page; no new route. |
| Source cards | Existing `archiveSources` section | Archive source queries | Keep three source cards: 告警通知归档、自愈审计归档、SLA 死信归档。 |
| Archive table | `ArchiveRow` | `SecurityOperationAlertNotificationArchiveItem.status_filter/alert_category_label/keyword` | Add compact filter-context badges below file key for notification archives. |
| Delete approval list | `ApprovalRow` | `SecurityOperationAlertNotificationArchiveApprovalItem.status_filter/alert_category_label/keyword` | Add context strip so reviewers see the archive creation filters. |
| Download/delete actions | Existing `downloadMutation` / `deleteMutation` | `getSecurityOperationAlertNotificationArchiveDownloadUrl`, `deleteSecurityOperationAlertNotificationArchive` | Preserve existing guarded actions and confirmation dialog. |
| Backend archive mapping | `SecurityCenterService.mapOperationAlertNotificationArchive` | S3 object metadata `status/alert_category/keyword` | Map metadata to `status_filter`, `alert_category_label`, `keyword`. |
| Backend delete approval events | `recordOperationAlertNotificationArchiveEvent` payload | Platform event payload fields | Copy filter context into delete-request, approve, reject and applied events. |
| Object storage metadata | `StorageService.listTenantObjects({ includeMetadata })` | `StorageObjectItem.metadata` | Only include metadata for archive governance calls that need it. |
