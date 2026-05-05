# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 监控页工作流卡片 | `WorkflowBackendCard` in `apps/web/src/components/monitor/monitor-content.tsx` | `RuntimeWorkflowStatusOverview` | Reuse existing card, no new route |
| 状态徽标 | `StatusBadge` | `workflow_backend`, `backend_status`, `workflow_mode` | Existing labels remain Chinese |
| 可恢复任务列表 | `WorkflowBackendCard` task map | `RuntimeWorkflowRecoverableTaskItem[]` | Add task type label and pass actual task type to retry |
| 恢复重试按钮 | `Button` with `RotateCcw` | `POST /runtime/workflows/retry` | Disable/spin only for matching task id and type |
| 空状态 | `EmptyState` | empty `recoverable_tasks` | Update copy from knowledge-only to workflow task wording |
