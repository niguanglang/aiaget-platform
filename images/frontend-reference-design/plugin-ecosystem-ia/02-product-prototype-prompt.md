# Product Prototype Prompt

Create a product prototype / wireframe image for the same real frontend IA split.

Project context:
- Page/route: 插件生态中心 `/plugins` plus `/plugins/[pluginId]`, `/plugins/[pluginId]/installations`, `/plugins/[pluginId]/security`, `/plugins/[pluginId]/bindings`
- Users/roles: 租户管理员、插件运营、安全审核人员，受 `plugin:center:*` 权限控制
- Main task flow: 用户在 `/plugins` 搜索筛选插件，查看市场与已安装概览，点击入口进入插件详情、安装配置、安全审核或绑定配置；深层页面负责对应 API 数据与操作
- API/service contract: reuse existing plugin functions from `apps/web/src/lib/api-client.ts`, no new backend endpoints
- Data entities and fields: `PluginMarketItem`, `PluginInstallationItem`, `PluginInstallationDetail`, `PluginMenuBindingItem`, `PluginHookItem`, `PluginSecurityPreview`
- Actions and states: search/filter/refresh/install/navigate/enable/disable/upgrade/uninstall/update installation/update hook/update menu binding; loading/empty/error/no permission/disabled/success/error/JSON validation

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Show `/plugins` with four regions: header actions, metric overview, filter toolbar, market/installed table.
- Mark the list table as containing only summaries and route entry buttons; do not place manifest preview, security review details, or binding editors in it.
- Show `/plugins/[pluginId]` as overview/detail with manifest summary, install status, permissions, hook/menu summaries, version/audit summaries.
- Show `/plugins/[pluginId]/installations` as installation/config management with status/runtime/risk/config JSON form and enable/disable/upgrade/uninstall actions.
- Show `/plugins/[pluginId]/security` as security preview/review page with risks, notes, can-enable gate, audit snippets.
- Show `/plugins/[pluginId]/bindings` as menu binding and hook binding tables with toggles/edit controls.
- Include clear placeholders for loading, empty, error, permission-denied, and validation states.

Avoid:
- Inventing routes outside the required IA
- Putting dynamic detail/config routes in the navigation menu seed
- Replacing the existing console shell or adding unrelated modules
