# M156 插件 Manifest 同步收敛

## 背景

插件安装、升级和回滚都会重新同步 Manifest 声明的权限、Hook、菜单和工具。M155 已补齐预检、回滚目标和 Hook 恢复入口，本轮继续收敛版本切换后的旧生成物残留问题。

## 范围

- Manifest 同步时为 Hook 写入稳定的 `generated_tool_code`。
- Runtime 执行插件 Hook 时优先使用 Hook 配置中的生成工具编码。
- Manifest 版本变更后软删除已移除的 Hook。
- Manifest 版本变更后软删除已移除的插件菜单绑定和插件命名空间菜单。
- Manifest 版本变更后软删除已移除的插件命名空间工具。

## 后端行为

- Hook 可通过 `tool_code` 绑定 Manifest `tools` 中的原始工具编码。
- Hook 可通过 `generated_tool_code` 直接声明已生成的 Tool Center 工具编码。
- 如果 Manifest 只有一个工具且 Hook 未声明工具编码，系统会将该工具作为 Hook 默认执行工具。
- 不在当前 Manifest 中的插件 Hook 会标记为 `DELETED` 并写入 `deleted_at`。
- 不在当前 Manifest 中的插件菜单绑定会标记为 `DELETED`，同时隐藏并禁用。
- 不在当前 Manifest 中且属于当前插件命名空间的菜单和工具会软删除。

## 验收标准

- 回滚到旧版本时，已移除的新版 Hook / 菜单 / 工具不会继续暴露。
- 插件 Hook 执行不依赖 `plugin_id + hook.code` fallback 拼接工具编码。
- 相近插件 code 不会因为前缀匹配误删，删除范围限定在 `plugin_<code>_` 与 `plugin_tool_<code>_` 命名空间。
- 插件同步审计和平台事件仍保留同步数量摘要。

## 非范围

- 不执行第三方插件代码。
- 不新增插件沙箱容器。
- 不改变插件前端信息架构。
