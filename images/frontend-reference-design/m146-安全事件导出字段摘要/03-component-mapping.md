# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Event detail page | `apps/web/src/components/security/security-event-detail-content.tsx` | `getSecurityCenterEvent(eventId)` | Add conditional read-only summary card. |
| Export field card | `ExportFieldSummary` | `event.context.exported_fields` | Renders only when field array exists. |
| Notification archive field chips | `FieldChipGroup` | `event.context.notification_archive_filter_fields` | Keeps notification filter fields separated for audit review. |
| Raw context | existing `JsonBlock` | `event.context` | Preserve original JSON panel. |
| IA contract | `security-route-ia-contract.test.ts` | source assertions | Locks page boundary and required labels. |
