# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/monitor/runtime-workflows-content.tsx` | `GET /runtime/workflows/status` | 维持现有页面边界和返回监控入口。 |
| Workflow backend card | `apps/web/src/components/monitor/monitor-shared-panels.tsx` `WorkflowBackendCard` | `RuntimeWorkflowStatusOverview` | 在可恢复任务行增加失败监控深链。 |
| Failure task metadata | `RuntimeWorkflowRecoverableTaskItem` | `failure_event_id`、`failure_trace_id`、`failure_request_id` | 字段为空时不展示按钮。 |
| Event deep link | Next `Link` + `Button` | `/monitor/events/:eventId` | 只跳转，不嵌入事件详情。 |
| Trace deep link | Next `Link` + `Button` | `/monitor/traces/:traceId` | 只跳转，不嵌入 Trace 时间线。 |
| Request filter deep link | Next `Link` + `Button` | `/monitor?requestId=...` | 复用监控列表筛选入口。 |
