# Project UI Brief

- Page: 系统设置入口页
- Routes: `/settings` 继续可用，新增兼容路由 `/system/settings`
- Feature goal: 将设置中心从混合管理台简化为系统参数概览、系统参数编辑和配置入口页。

## Users And Permissions

- 目标用户：租户管理员、系统配置维护人员、安全治理人员。
- 查看权限：`system:settings:view`。
- 编辑权限：租户管理员或拥有 `system:settings:manage`。
- 配置入口按目标模块权限提示：`system:tenant:view`、`system:user:view`、`system:role:view`、`system:api_key:view`、`security:rule:view`、`storage:object:view`。

## Route And Layout

- 复用当前 `(console)` 控制台布局。
- 页面主体使用 shadcn/Tailwind 风格：`Card`、`Button`、`MetricCard`、`StatusBadge`、`EmptyState`。
- 不在本页面嵌入租户、用户、角色、API Key 等管理列表或表单，只提供入口卡片跳转到现有模块。

## API Contracts

- `getSystemSettingsOverview()` 获取参数总览。
- `listSystemSettings({ category, status })` 查询系统参数列表。
- `updateSystemSetting(settingId, { value, status })` 保存参数。
- `resetSystemSetting(settingId)` 恢复默认值。
- `previewNotificationPolicySettingChange(settingId, { value, status })` 预览通知策略影响。
- `getNotificationPolicyAudit()` 获取通知策略审计摘要。
- `listNotificationPolicySnapshots()` 获取通知策略版本快照。
- `rollbackNotificationPolicySnapshot(snapshotId, input)` 回滚通知策略快照。

## Entities And Fields

- `SystemSettingOverview`: `total`、`active`、`disabled`、`secret`、`changed_from_default`、`category_count`、`last_updated_at`、`categories`。
- `SystemSettingItem`: `id`、`category`、`key`、`name`、`description`、`value`、`default_value`、`value_type`、`options`、`is_secret`、`status`、`updated_at`、`updated_by`。
- 分类枚举：`GENERAL`、`SECURITY`、`RUNTIME`、`OBSERVABILITY`、`NOTIFICATION`、`RETENTION`、`INTEGRATION`。
- 状态枚举：`ACTIVE`、`DISABLED`、`DELETED`。
- 值类型：`STRING`、`NUMBER`、`BOOLEAN`、`JSON`、`SELECT`。

## Required States

- 总览加载、列表加载、空数据、查询失败。
- 参数编辑校验失败、保存中、保存成功、恢复默认确认、无权限禁用。
- 通知策略的影响预览、审计加载失败、快照加载失败、回滚确认。
- 配置入口无权限时展示禁用状态，不在设置页内展开目标模块的数据表。
