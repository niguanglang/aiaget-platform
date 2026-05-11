# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Runtime 工作流页面壳 | `apps/web/src/app/(console)/runtime/workflows/page.tsx` + `RuntimeWorkflowsContent` | console route | 保持现有路由和页面边界。 |
| 工作流后端状态卡 | `WorkflowBackendCard` in `apps/web/src/components/monitor/monitor-shared-panels.tsx` | `RuntimeWorkflowStatusOverview` | 继续承载 backend status、workflow mode、backend label。 |
| 最近派发失败摘要 | `WorkflowBackendCard` alert block | `RuntimeWorkflowFailureItem` | 新增事件、Trace、请求三个条件渲染按钮。 |
| 最近失败事件深链 | `Button asChild` + `Link` | `latest_failure.failure_event_id` | 跳转 `/monitor/events/:eventId`，详情由监控事件详情页承载。 |
| 最近失败 Trace 深链 | `Button asChild` + `Link` | `latest_failure.failure_trace_id` | 跳转 `/monitor/traces/:traceId`，不在工作流页展示 Trace 时间线。 |
| 最近失败请求筛选 | `Button asChild` + `Link` | `latest_failure.failure_request_id` | 跳转 `/monitor?requestId=...`，使用 `encodeURIComponent`。 |
| 控制面字段映射 | `RuntimeExecutionService.getWorkflowStatus` | `platform_event.id`、`traceId`、`requestId` | 从最新派发失败事件映射到 `latest_failure`。 |
| 共享类型 | `packages/shared-types/src/index.ts` | `RuntimeWorkflowFailureItem` | 新增可选深链字段，保持向后兼容。 |
| IA 契约测试 | `monitor-route-ia-contract.test.ts` | 前端源码断言 | 确保深链存在且没有把完整日志塞入列表页。 |
