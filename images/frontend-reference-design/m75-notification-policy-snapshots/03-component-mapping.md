# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 设置页壳 | `apps/web/src/components/settings/settings-content.tsx` | route `/settings` | 复用现有三栏布局 |
| 通知策略参数卡片 | `SystemSettingCard` | `SystemSettingItem` | 保留 M74 影响预览 |
| 最近审计 | `NotificationPolicyAuditPanel` | `NotificationPolicyAuditOverview` | 已在 M74 完成 |
| 版本快照面板 | 新增 `NotificationPolicySnapshotPanel` 内联组件 | `NotificationPolicySnapshotOverview` | 仅通知策略分类显示 |
| 快照回滚确认 | 复用 `ConfirmDialog` | `rollbackNotificationPolicySnapshot(snapshotId)` | 成功后刷新设置、审计、快照 |
| 状态标识 | `StatusBadge` | action / approval_status | 中文标签 |
| 空/错/加载态 | `EmptyState` + 文本提示 | React Query states | 不新建全局组件 |
