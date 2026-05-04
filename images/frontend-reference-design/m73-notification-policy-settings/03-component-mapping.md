# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 通知策略分类 | `SettingsContent` 分类栏 | `SystemSettingCategory = NOTIFICATION` | 新增系统设置分类 |
| 策略设置卡片 | 现有 `SystemSettingCard` | `SystemSettingItem` | 复用保存、恢复默认、状态切换 |
| 策略说明 | 右侧 `配置治理` 卡片 | `settingCategory` | 分类为通知策略时显示自动重试说明 |
| M72 任务联动 | `/monitor` `UsageAlertNotificationTaskCard` | `PlatformUsageAlertNotificationTaskOverview.policy` | 展示当前租户策略 |
| 保存反馈 | 现有 success/error 状态 | `updateSystemSetting` | 中文提示 |
