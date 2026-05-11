# M166 Runtime 工作流失败排障深链

## 目标

Runtime 工作流恢复页已经能展示失败任务的 Workflow ID、Workflow Run ID，并在重试成功后提供新事件、Trace 和请求深链。M166 补齐“重试前排障”入口：可恢复失败任务本身直接暴露原失败事件、Trace 和 Request ID，用户可以先进入监控详情确认失败原因，再决定是否恢复重试。

## 范围

- `RuntimeWorkflowRecoverableTaskItem` 新增可选字段：
  - `failure_event_id`
  - `failure_trace_id`
  - `failure_request_id`
- Control API 从 `platform_event` 失败事件映射这些监控标识。
- `/runtime/workflows` 在每条可恢复任务上显示：
  - 查看失败事件
  - 查看失败 Trace
  - 查看失败请求

## 页面边界

- Runtime 工作流页只提供轻量排障入口，不嵌入完整事件详情、Trace 时间线或日志全文。
- 事件详情仍由 `/monitor/events/:eventId` 承载。
- Trace 详情仍由 `/monitor/traces/:traceId` 承载。
- 请求筛选仍由 `/monitor?requestId=...` 承载。

## 验收

- 渠道、Agent Team、插件回滚、插件 Hook 等基于平台事件的失败任务可携带失败事件深链字段。
- 前端只在字段存在时显示对应按钮。
- 恢复重试确认和权限门禁不变。
- 不新增数据库表、不新增中间件、不启动容器。
