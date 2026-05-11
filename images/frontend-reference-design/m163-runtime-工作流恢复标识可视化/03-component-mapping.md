# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Runtime 工作流页面壳 | `RuntimeWorkflowsContent` | `/runtime/workflows/status` | 保持现有页面、返回监控入口和确认弹窗。 |
| 后端状态卡 | `WorkflowBackendCard` | `RuntimeWorkflowStatusOverview` | 继续显示 backend status/mode/backend。 |
| 最近派发失败 | `WorkflowBackendCard` alert block | `latest_failure` | 保持轻量错误摘要，不展示完整日志。 |
| 可恢复任务列表 | `WorkflowBackendCard` task rows | `RuntimeWorkflowRecoverableTaskItem[]` | 在现有任务 metadata 区域补 Workflow ID 与 Workflow Run ID。 |
| 恢复重试按钮 | `Button` + `RotateCcw` | `retryRuntimeWorkflowTask` | 保持 `canRetry(task)` 权限禁用和确认弹窗。 |
| 类型与后端字段 | `packages/shared-types/src/index.ts` | `RuntimeWorkflowRecoverableTaskItem` | 新增可选 `workflow_id`、`workflow_run_id`。 |
| Control API 映射 | `runtime-execution.service.ts` | failed workflow platform events | 从 event payload / workflowId / workflowRunId 归一化到恢复任务。 |
