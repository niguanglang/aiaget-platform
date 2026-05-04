# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 安全中心页面壳 | `apps/web/src/components/security/security-policy-content.tsx` | `/security` route | 复用现有页面，不新增路由 |
| 通知任务中心 | `OperationAlertNotificationTaskCard` | `SecurityOperationAlertNotificationTaskOverview` | M101 在 M100/M87 面板下追加历史区 |
| 历史摘要指标 | `MetricCard` | `SecurityOperationAlertNotificationTaskRunOverview.summary` | 展示总数、成功、失败、手动、调度、最近执行 |
| 筛选工具条 | `Input` + native `select` + `Button` | query params `task/status/keyword` | 与现有安全中心表格筛选风格一致 |
| 执行历史表格 | inline table | `SecurityOperationAlertNotificationTaskRunItem[]` | 不新增复杂表格组件 |
| 状态标签 | `StatusBadge` | `status` / `task` / `trigger_type` | 复用现有任务状态 tone |
| 审计联动 | `Link` + `Button` | `request_id` / `trace_id` | `/audit?keyword=...`、`/monitor?keyword=...` |
| 空/加载态 | `EmptyState` | query loading/items length | 筛选无结果时展示 |
| 错误反馈 | 页面已有 `actionError` | React Query error | 不新增全局错误处理 |
