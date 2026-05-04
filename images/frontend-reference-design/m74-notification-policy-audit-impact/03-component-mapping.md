# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 影响预览 | `SystemSettingCard` 内新增 `NotificationPolicyImpactPreview` | `NotificationPolicyChangePreview` | 仅通知策略且有变更时显示 |
| 最近审计 | 设置页右侧治理卡片 | `NotificationPolicyAuditOverview` | 使用 `operation_log` 投影 |
| 风险标识 | `StatusBadge` | `impact.level` | LOW/MEDIUM/HIGH |
| 保存动作 | 现有保存按钮 | `updateSystemSetting` | 预览不阻断保存 |
| 审计刷新 | React Query invalidate | `getNotificationPolicyAudit` | 保存成功后刷新 |
