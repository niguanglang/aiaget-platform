# M168 Runtime 最近派发失败监控深链

## 目标

M166/M167 已经让可恢复任务列表可以跳转到失败事件、Trace 和请求筛选。M168 补齐 Runtime 工作流页顶部“最近派发失败”摘要的排障入口，让运维人员不必先在恢复队列里找到任务，也能直接从最近失败块进入监控中心。

## 范围

- `RuntimeWorkflowFailureItem` 新增可选字段：
  - `failure_event_id`
  - `failure_trace_id`
  - `failure_request_id`
- Control API 在 `getWorkflowStatus` 返回 `latest_failure` 时，从最新派发失败平台事件映射事件、Trace 和 Request ID。
- `/runtime/workflows` 的“最近派发失败”块在字段存在时显示：
  - 查看最近失败事件
  - 查看最近失败 Trace
  - 查看最近失败请求

## 页面边界

- Runtime 工作流页只承载后端状态、最近失败摘要、恢复队列和重试动作。
- 事件详情仍由 `/monitor/events/:eventId` 承载。
- Trace 详情仍由 `/monitor/traces/:traceId` 承载。
- 请求过滤仍由 `/monitor?requestId=...` 承载。
- 不在工作流页嵌入完整事件 payload、Trace 时间线或日志全文。

## 验收

- 最近派发失败事件能携带事件、Trace、请求三个监控标识。
- 前端只在字段存在时展示对应按钮。
- 可恢复任务列表和恢复重试权限逻辑不变。
- 不新增数据库表、不新增中间件、不启动容器。

## 参考设计

前端使用 `$frontend-reference-design` 工作流，参考设计资产位于：

```text
images/frontend-reference-design/m168-runtime-最近派发失败监控深链/
```
