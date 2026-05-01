# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 控制台页面壳 | `apps/web/src/app/(console)/settings/page.tsx`, `SettingsContent` | `/settings` route | 复用现有设置中心入口，不新增路由。 |
| 页头与里程碑标识 | `StatusBadge`, `Button` | `system:settings:view/manage` | 标题改为 M45，按钮按权限禁用。 |
| 指标卡 | `MetricCard` | `SystemSettingOverview` | 展示参数总数、启用参数、敏感参数、偏离默认数量。 |
| 分类筛选 | `Button` + local state | `SystemSettingCategory` | 使用分段按钮，不引入新 Tabs 组件。 |
| 参数配置卡 | `Card`, `StatusBadge`, native input/select/textarea | `SystemSettingItem`, `UpdateSystemSettingInput` | 按 `value_type` 渲染布尔、数字、文本、JSON、下拉。 |
| 保存/恢复动作 | `Button` + React Query mutation | `updateSystemSetting`, `resetSystemSetting` | 单项保存，恢复默认用确认弹窗。 |
| 权限只读状态 | `hasPermission`, `currentUser.roles` | `system:settings:manage` | 无管理权限时控件和动作禁用并显示只读提示。 |
| 加载/错误/空状态 | `EmptyState`, text alert | React Query `isLoading/isError` | 覆盖 loading、empty、error。 |
| 现有设置区 | 当前 `SettingsContent` 下半部分 | tenants/users/roles/api-keys APIs | 保留现有租户、接口密钥、角色、用户管理能力。 |
