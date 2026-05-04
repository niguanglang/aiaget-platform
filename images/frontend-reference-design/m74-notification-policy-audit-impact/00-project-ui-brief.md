# Project UI Brief

- Page: M74 Notification Policy Audit Impact
- Route: /settings
- Feature goal: 通知策略审计与变更影响预览
- Target users/roles: 租户管理员、监控运营、安全管理员；查看需要 `system:settings:view`，保存需要 `system:settings:manage`。
- APIs/services:
  - `previewNotificationPolicySettingChange(settingId, { value, status })`
  - `getNotificationPolicyAudit()`
  - `updateSystemSetting(id, { value, status })`
- Entities/fields/statuses:
  - `NotificationPolicyChangePreview`: setting, current, next, changed_fields, impact, warnings, recent_task_summary
  - `NotificationPolicyAuditOverview`: recent_changes, summary
  - Impact levels: `LOW`, `MEDIUM`, `HIGH`
- Existing components/design system: `SettingsContent`, `SystemSettingCard`, Tailwind CSS, shadcn-style `Card` / `Button`, `StatusBadge`, `EmptyState`, `MetricCard`.
- Required states: preview loading, no change, high-impact warning, read-only, recent audit empty, save success/error.
- Constraints:
  - Do not add tables or migrations; reuse `operation_log` and `system_setting`.
  - UI text must be Chinese.
  - Preview must be compact and fit existing settings page.
