# Product Prototype / Wireframe Prompt

Create a low- to mid-fidelity wireframe for the custom plugin install dialog on `/plugins`.

Project context:
- Users/roles: 插件管理员、安全管理员、租户管理员
- Main task flow: 打开插件中心 -> 新增自定义插件 -> 编辑 Manifest -> 执行后端预检 -> 查看包完整性、沙箱策略和 Tool Gateway 工具绑定 -> 安装或修正 Manifest。
- API/service contract: `POST /plugins/manifest/validate` returns `PluginManifestValidationResult` with `sandbox_required` and `sandbox_policy`.
- Data entities and fields: sandbox status, entry, isolation, network, filesystem, timeout, memory, package integrity, tool bindings, validation errors/warnings.
- Actions and states: 执行预检、安装、取消、预检失败、预检通过、结果失效、安装禁用。

Prototype requirements:
- Wireframe should show a two-column or stacked dialog layout: Manifest editor/preview, backend precheck results.
- Include a dedicated “沙箱策略预检” section with three state examples: not required, missing policy, declared policy.
- Show that missing sandbox policy creates a validation error and disables install.
- Show package integrity and Tool Gateway binding previews as existing neighboring sections.
- Keep execution details out of the UI; represent future sandbox runtime only as policy metadata.

Avoid:
- terminal/code runner UI
- container orchestration screens
- adding a new route outside the plugin install dialog
