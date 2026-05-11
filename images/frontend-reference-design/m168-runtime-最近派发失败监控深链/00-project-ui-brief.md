# Project UI Brief

- Page: M168 Runtime 最近派发失败监控深链
- Route: `/runtime/workflows`
- Feature goal: Runtime 工作流页的“最近派发失败”摘要提供事件、Trace 和请求监控深链，让运维人员能从失败摘要直接进入监控中心排障。
- Target users: 运维人员、租户管理员、监控审计人员。
- Permissions: 页面读取仍使用 `monitor:log:view`；恢复重试仍使用任务类型对应权限；事件、Trace、请求详情继续由监控中心页面权限控制。
- APIs/services: `GET /api/v1/runtime/workflows/status` 返回 `RuntimeWorkflowStatusOverview`；其中 `latest_failure` 新增可选 `failure_event_id`、`failure_trace_id`、`failure_request_id`。
- Entities/fields/statuses: `RuntimeWorkflowFailureItem` 的 `task_type`、`task_id`、`error_message`、`occurred_at`、`failure_event_id`、`failure_trace_id`、`failure_request_id`；`RuntimeWorkflowBackendStatus` 包含 `READY`、`DISPATCH_FAILED`。
- Existing components/design system: 复用 `RuntimeWorkflowsContent` 页面壳、`WorkflowBackendCard` 状态卡、shadcn/Tailwind `Card`、`Button`、`Link`、`StatusBadge`、`EmptyState`。
- Required states: 加载中、无最近失败、最近失败但无监控标识、最近失败有部分深链、可恢复任务为空、重试按钮禁用、刷新中。
- Constraints: 不新增路由、不嵌入事件详情、Trace 时间线或日志全文；只提供轻量跳转入口。
