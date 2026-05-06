# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `(console)` layout with `SettingsContent` in `apps/web/src/components/settings/settings-content.tsx` | route files under `apps/web/src/app/(console)/settings` and `apps/web/src/app/(console)/system/settings` | Reuse layout, no custom shell. |
| Header and permission state | `StatusBadge`, `Button`, `Link` | `useAuth`, `hasPermission`, `system:settings:manage` | Header copy must state this page is for system parameters and configuration entries. |
| Overview metrics | `MetricCard` | `getSystemSettingsOverview`, fallback to `listSystemSettings` result | Show total, active, secret, changed from default. |
| Configuration entry grid | Local `ConfigurationEntryCard` using `Card`, `Button`, lucide icons | Existing pages: `/tenants`, `/users`, `/roles`, `/api-keys`, `/security/policies`, `/storage` | Entry cards replace embedded management lists and forms. |
| Category and status filters | Local `CategoryButton`, native `select` | `SystemSettingCategory`, `SystemSettingStatus`, `listSystemSettings({ category, status })` | Keep query scope to system settings only. |
| Editable setting cards | Local `SystemSettingCard` | `SystemSettingItem`, `updateSystemSetting`, `resetSystemSetting` | Supports string, number, boolean, JSON and select values. |
| Notification policy preview | Local `NotificationPolicyPreview` | `previewNotificationPolicySettingChange`, `NotificationPolicyChangePreview` | Only shown for `NOTIFICATION` category settings. |
| Governance panel | Local `NotificationPolicyAuditPanel`, `NotificationPolicySnapshotPanel`, `DetailRow` | `getNotificationPolicyAudit`, `listNotificationPolicySnapshots`, `rollbackNotificationPolicySnapshot` | Keeps system-parameter governance without reintroducing mixed CRUD lists. |
| Confirmation dialogs | Local `ConfirmDialog` | `resetSystemSetting`, `rollbackNotificationPolicySnapshot` | Reuse simple fixed overlay pattern from existing page. |
| Module metadata | `apps/web/src/config/modules.ts` | `ModuleSpec` for `settings` | Update description, metrics, sections and primary action to match simplified IA. |
