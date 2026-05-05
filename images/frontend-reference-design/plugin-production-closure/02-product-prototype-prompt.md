# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the enterprise plugin ecosystem page.

Project context:
- Page/route: 插件生态中心 at `/plugins`
- Users/roles: 租户管理员、插件管理员、安全审计员
- Main task flow: 用户进入插件中心，查看 KPI，切换市场/已安装列表，安装或选择插件，在详情区检查安全审查和版本差异，执行启用/停用/升级/卸载，必要时查看审计、切换菜单和 Hook 状态
- API/service contract: `getPluginOverview`, `listPluginMarket`, `listPluginInstallations`, `getPluginInstallation`, `installPlugin`, `updatePluginInstallation`, `enablePlugin`, `disablePlugin`, `upgradePlugin`, `uninstallPlugin`, `updatePluginHook`, `updatePluginMenuBinding`
- Data entities and fields: overview metrics, plugin list rows, selected plugin detail, security preview, permission preview, menu bindings, hooks, audit logs, uninstall result cleanup
- Actions and states: refresh, search, filter, install, custom Manifest validation, edit, enable disabled by `can_enable=false`, disable, upgrade, uninstall confirmation, no permission, loading, empty, error, success notification

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show page regions: header/actions, notification area, KPI grid, plugin table, detail/action panel, security review panel, menu/Hook cards, audit list, install/uninstall dialogs, edit side panel.
- Make disabled and blocked states explicit: high-risk plugin review required, enable button disabled, block reason shown.
- Show mobile behavior as stacked regions: header, KPI, list, detail panel below.
- Keep component boundaries obvious so implementation maps to existing `Button`, `Card`, `EmptyState`, `MetricCard`, `StatusBadge`, form controls and dialogs.

Avoid:
- polished decorative rendering
- invented backend fields or unrelated plugin marketplace concepts
- unrealistic navigation or actions not supported by the current API
