# Project UI Brief

## 目标

第二批 IA 重构将租户管理和系统设置从单页混合工作台拆成 canonical 路由：租户列表、租户详情、租户编辑，以及系统参数列表、通知策略概览、通知策略快照回滚。中文 UI 保持控制台后台风格，优先信息密度、可扫描性和明确操作入口。

## 路由与布局

- `/tenants`：租户列表与当前租户入口，只负责搜索、筛选、状态概览和跳转。
- `/tenants/[id]`：租户详情，读取 `getTenant`。
- `/tenants/[id]/edit`：租户编辑，读取详情并通过 `updateTenant` 保存。
- `/settings`：系统参数列表和基础配置入口，读取 overview/list/update/reset，不承载通知策略审计、快照、审批状态。
- `/settings/notification-policy`：通知策略配置和审计概览，承载通知策略参数变更影响预览和审计信息。
- `/settings/notification-policy/snapshots`：通知策略版本快照和回滚。
- `/system/settings`：兼容旧链接，跳转到 `/settings`。

## 用户与权限

目标用户是租户管理员和系统运维人员。租户编辑需要 `tenant_admin` 或 `system:tenant:manage`，系统参数编辑需要 `tenant_admin` 或 `system:settings:manage`；无权限用户可查看但不能保存或回滚。

## 数据契约

- 租户：`listTenants`、`getTenant`、`updateTenant`。
- 系统设置：`getSystemSettingsOverview`、`listSystemSettings`、`updateSystemSetting`、`resetSystemSetting`。
- 通知策略：`previewNotificationPolicySettingChange`、`getNotificationPolicyAudit`、`listNotificationPolicySnapshots`、`rollbackNotificationPolicySnapshot`。

## 状态与操作

列表页提供 loading、empty、error、readonly、refresh、filter 状态。编辑页提供表单校验、保存中、保存成功、保存失败、无权限禁用。快照页提供加载、空态、回滚确认和回滚中状态。

## 约束

不修改 api-client；菜单 seed 只暴露 `/tenants` 和 `/settings`，不把详情、编辑或设置子页写入动态菜单。保留已有卡片、按钮、状态徽标、指标卡和表格风格。
