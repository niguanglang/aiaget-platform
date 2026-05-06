# Product Prototype / Wireframe Prompt

Create a mid-fidelity wireframe for the AIAget Chinese admin console page “系统设置”.

Project context:
- Page/routes: `/system/settings` and legacy `/settings`
- Users/roles: 租户管理员、系统配置维护人员、安全治理人员
- Main task flow: 查看系统参数概览 -> 从入口卡跳转到专项配置页 -> 在当前页筛选系统参数 -> 编辑、保存、恢复默认或预览通知策略影响
- API/service contract: `getSystemSettingsOverview`, `listSystemSettings`, `updateSystemSetting`, `resetSystemSetting`, `previewNotificationPolicySettingChange`, `getNotificationPolicyAudit`, `listNotificationPolicySnapshots`, `rollbackNotificationPolicySnapshot`
- Data entities and fields: overview metrics, category summary, setting item fields, notification policy audit, notification policy snapshots
- Actions and states: category/status filters, save, reset confirm dialog, notification preview, rollback confirm dialog, loading, empty, error, disabled, success, permission-denied

Prototype requirements:
- Use a console page wireframe, not a marketing page.
- Region 1: title and short description explaining this page only manages system parameters and configuration entry navigation.
- Region 2: metric row with 系统参数, 启用参数, 敏感参数, 偏离默认.
- Region 3: “配置入口” grid with six cards: 租户资料 `/tenants`, 用户管理 `/users`, 角色权限 `/roles`, API Key `/api-keys`, 安全策略 `/security/policies`, 文件存储 `/storage`.
- Region 4: system parameter workspace with left category filter, center setting cards/form controls, right governance/audit panel.
- Region 5: confirmation dialogs for restore default and notification policy rollback.
- Show placeholder blocks for loading, empty, error, validation and no-permission disabled states.
- Make component boundaries obvious for implementation with existing `Card`, `Button`, `MetricCard`, `StatusBadge`, `EmptyState`.

Avoid:
- embedded user management table
- role directory list
- API Key creation form or key list
- tenant edit drawer
- unsupported fields or invented backend actions
