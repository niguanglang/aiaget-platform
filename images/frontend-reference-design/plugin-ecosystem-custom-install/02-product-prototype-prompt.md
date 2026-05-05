# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the enterprise plugin ecosystem page at `/plugins`.

Project context:
- Users/roles: 租户管理员、插件管理员、安全管理员、审计员
- Main task flow: 打开插件中心 -> 查看市场/已安装 -> 点击“自定义插件” -> 填写 Manifest JSON -> 解析预览 -> 校验失败显示错误，校验通过显示插件名称、版本、权限、菜单、Hook、工具、风险 -> 确认安装 -> 详情页查看并管理启停、升级、菜单、Hook、审计。
- API/service contract: 使用现有 plugin API client，不新增中间件；安装调用 `installPlugin`。
- Data entities and fields: `PluginMarketItem`, `PluginInstallationDetail`, `PluginHookItem`, `PluginMenuBindingItem`, `PluginVersionItem`; Manifest 字段 `code/name/provider/version/permissions/menus/hooks/tools/config/risk_level`。
- Actions and states: 搜索、筛选、刷新、市场安装、自定义安装、编辑配置、启用、停用、升级、归档、Hook/菜单切换；loading、empty、error、validation、disabled、success、permission-denied。

Prototype requirements:
- Low- to mid-fidelity wireframe, focused on layout and flow.
- Regions: header/metrics, tabbed list/filter toolbar, detail panel, custom manifest modal with editor left and parsed preview right, validation message area, confirm buttons.
- Make component boundaries obvious for existing Card/Button/Input/StatusBadge/EmptyState implementation.
- Keep labels in Chinese and avoid invented backend fields.
