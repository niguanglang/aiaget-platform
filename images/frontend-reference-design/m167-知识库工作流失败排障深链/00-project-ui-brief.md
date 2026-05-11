# Project UI Brief

- Page: M167 知识库工作流失败排障深链
- Route: `/runtime/workflows`
- Feature goal: 知识库可恢复任务补齐失败事件、Trace 和请求监控深链，与渠道、团队、插件任务保持一致。
- Target users: 知识库管理员、运维、租户管理员。
- Permissions: 恢复仍要求 `knowledge:base:manage` 或租户管理员；深链详情继续由监控页权限控制。
- APIs/services: `GET /api/v1/runtime/workflows/status`；后端额外读取 `workflow.knowledge_task.failed` 与 `workflow.knowledge_task.dispatch_failed` 平台事件。
- Entities/fields/statuses: `RuntimeWorkflowRecoverableTaskItem` 的 `workflow_id`、`workflow_run_id`、`failure_event_id`、`failure_trace_id`、`failure_request_id`。
- Existing components/design system: 沿用 `WorkflowBackendCard` 的失败深链按钮。
- Required states: 知识库失败任务有深链、知识库失败任务无深链、恢复按钮禁用、加载/空/错误。
- Constraints: 不新增页面控件；仅让已有深链 UI 覆盖知识库任务。
