# M169 插件沙箱策略预检

## 目标

P0-8 已经明确当前插件 Hook 不执行第三方任意代码，只能通过 Manifest 生成的 Tool Gateway 工具进入审批、限流、安全策略和审计边界。M169 继续补齐“如果自定义插件声明代码入口”的安装前门禁：控制面必须识别代码入口，并要求 Manifest 同时声明沙箱策略。

## 范围

- `PluginManifestValidationResult` 新增：
  - `sandbox_required`
  - `sandbox_policy`
- Manifest 如果声明 `runtime.entry`、`entry`、`entry_point`、`main` 或 `main_entry`，视为自定义代码入口。
- 自定义代码入口缺少 `sandbox` 策略时，`POST /plugins/manifest/validate` 和安装流程都在包下载前失败。
- 前端自定义插件安装弹窗展示“沙箱策略预检”，包括入口、隔离方式、网络策略、文件系统、超时和内存限制。

## 边界

- 不新增沙箱 Worker。
- 不运行插件包内代码。
- 不启动容器或中间件。
- `CONTAINER/WASM/REMOTE` 只是策略声明，真实执行器属于后续增强。

## Manifest 示例

```json
{
  "runtime": {
    "type": "code",
    "entry": "dist/index.js"
  },
  "sandbox": {
    "isolation": "PROCESS",
    "network": "DENY",
    "filesystem": "READONLY",
    "timeout_ms": 5000,
    "memory_mb": 128
  }
}
```

## 验收

- 缺少沙箱策略的自定义代码插件预检失败，并记录 `plugin.manifest.validation_failed`。
- 仅声明 Tool Gateway 工具的插件不需要沙箱策略。
- 已声明沙箱策略的自定义代码插件可以继续进入包完整性和签名预检。
