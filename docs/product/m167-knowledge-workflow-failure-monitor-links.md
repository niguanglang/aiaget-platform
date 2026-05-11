# M167 知识库工作流失败排障深链

## 目标

M166 已经让渠道、Agent Team、插件类可恢复工作流任务从失败事件中携带监控深链。知识库失败任务此前直接来自 `knowledge_embedding_task` 表，只能显示任务本身状态，无法从恢复列表直接跳到原失败事件。本轮补齐知识库任务的同等排障能力。

## 范围

- `GET /runtime/workflows/status` 查询知识库失败任务时，同时读取最新的：
  - `workflow.knowledge_task.failed`
  - `workflow.knowledge_task.dispatch_failed`
- 按 `task_id` / `resource_id` / payload `task_id` 关联任务与平台事件。
- 知识库恢复任务补齐：
  - `workflow_id`
  - `workflow_run_id`
  - `failure_event_id`
  - `failure_trace_id`
  - `failure_request_id`

## 页面影响

前端沿用 M166 的恢复队列深链按钮。知识库任务有监控标识时会自动显示：

- 查看失败事件
- 查看失败 Trace
- 查看失败请求

## 约束

- 不新增数据库字段。
- 不改变知识库任务恢复权限。
- 不把事件详情或 Trace 时间线嵌入 Runtime 工作流页。
