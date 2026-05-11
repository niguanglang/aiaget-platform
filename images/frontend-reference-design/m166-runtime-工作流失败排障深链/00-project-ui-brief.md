# Project UI Brief

- Page: M166 Runtime 工作流失败排障深链
- Route: `/runtime/workflows`
- Feature goal: 可恢复失败任务提供原失败事件、Trace 和请求监控深链，支持重试前排障。
- Target users: 运维、租户管理员、知识库管理员、渠道发布管理员、插件管理员、多 Agent 团队负责人。
- Permissions: 维持现有恢复权限，深链只作为查看入口；后端监控详情页继续执行各自权限校验。
- APIs/services: `GET /api/v1/runtime/workflows/status` 返回 `RuntimeWorkflowStatusOverview`；恢复仍使用 `POST /api/v1/runtime/workflows/retry`。
- Entities/fields/statuses: `RuntimeWorkflowRecoverableTaskItem` 包含 `task_type`、`task_id`、`workflow_id`、`workflow_run_id`、`failure_event_id`、`failure_trace_id`、`failure_request_id`、`error_message`、`updated_at`。
- Existing components/design system: `WorkflowBackendCard`、`Button`、`Card`、`StatusBadge`、`EmptyState`、Next `Link`。
- Required states: loading、empty、error、permission-disabled、retry-pending、deep-link-present、deep-link-absent。
- Constraints: 不在列表卡片中塞入完整事件详情、Trace 时间线或日志正文；所有可见文案使用中文。
