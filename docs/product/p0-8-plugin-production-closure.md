# P0-8 插件生态生产闭环

## 现有能力盘点

- 插件定义：`plugin`、`plugin_version`、`plugin_installation`、`plugin_hook`、`plugin_menu_binding`、`plugin_audit_log` 已在 Control API Prisma schema 中落地；Manifest 会保存到插件与安装实例。
- 安装/启用：`POST /plugins/install` 安装并同步权限、Hook、菜单和工具；`POST /plugins/:pluginId/enable|disable|upgrade` 管理运行态；`DELETE /plugins/:pluginId` 软删除安装实例、生成菜单、Hook 和工具。
- 权限：控制器使用 `JwtAuthGuard`、`PermissionsGuard`、`DataScopeGuard`、`ResourceAclGuard`、`SecurityPolicyGuard`；插件资源权限码覆盖 `view/install/manage/enable/disable/upgrade/uninstall/audit`。
- 工具绑定：Manifest 的 `tools/actions/capabilities` 会生成 `plugin_tool_<plugin>_<tool>` 工具编码并写入 Tool Center 的 `tool` 表；后续执行仍复用 `ToolGatewayService` 的审批、限流、重试、安全策略和调用日志边界。
- 审计：安装、Manifest 同步、更新、启停、升级、卸载、Hook 更新、菜单绑定更新写 `plugin_audit_log`；高风险启用阻断和主要生命周期动作写 `platform_event`。
- 前端入口：`/plugins` 已存在插件生态中心，支持市场、安装实例、详情、启停升级、卸载确认、Hook、菜单绑定、权限预览和审计展示。本次未修改前端。
- 后端接口：`GET /plugins/overview|market|installations|:pluginId`、`POST /plugins/install`、`POST /plugins/manifest/validate`、`PATCH /plugins/:pluginId`、`POST /plugins/:pluginId/enable|disable|upgrade`、`DELETE /plugins/:pluginId`、`PATCH /plugins/:pluginId/hooks/:hookId`、`PATCH /plugins/:pluginId/menu-bindings/:bindingId`。

## 本轮 P0 补齐

1. Manifest 校验契约：新增 `PluginManifestValidationResult`，返回安装包来源、sha256、签名存在性、权限、菜单、Hook、Tool Gateway 工具绑定预览、错误和警告。
2. 自定义插件来源门禁：`source_type=CUSTOM` 时，安装前必须声明 `package.source_url`、64 位十六进制 `package.sha256` 和 `package.signature`；失败时 `POST /plugins/install` 不写插件记录。
3. 失败状态可查：Manifest 校验失败会写 `platform_event`，事件类型为 `plugin.manifest.validation_failed`，状态为 `FAILED`，payload 保存完整校验结果。
4. 后端契约入口：新增 `POST /plugins/manifest/validate`，允许控制台或集成方在安装前拿到同一套校验结果。
5. 权限闭环：补齐 `plugin:center:uninstall` 在插件数据范围、资源 ACL 资源定义和 seed 默认插件 ACL 中的覆盖，避免卸载动作只在控制器权限码中存在。

## P0 边界

- 本轮不下载插件包、不做真实在线验签、不新增对象存储表、不启动容器或中间件。
- 当前 P0 校验是控制面静态门禁：要求来源和完整性元数据存在，并把失败记录到平台事件；真实包下载、sha256 计算、Sigstore/PGP 验签、回滚执行器属于下一批。
- Hook 仍是控制面声明和状态管理，不执行第三方任意代码；执行型 Hook 需要后续放到独立运行沙箱或受控异步执行器。

## 下一批文件边界

- 插件包下载与验签：`apps/control-api/src/plugins/` 新增包校验服务，必要时仅复用已有 Storage 服务接口，不修改知识库、渠道、计费或可观测性模块。
- 升级/回滚执行闭环：`apps/control-api/src/plugins/plugins.service.ts`、`apps/control-api/src/plugins/plugin-policy.ts`、插件测试文件，补版本选择、回滚审计和失败恢复状态。
- Hook 执行风险控制：`apps/control-api/src/plugins/` 内新增 Hook 执行策略/测试；若要接入 Runtime 或 Tool Gateway，需要另开 P0-4/P0-10 边界任务。
