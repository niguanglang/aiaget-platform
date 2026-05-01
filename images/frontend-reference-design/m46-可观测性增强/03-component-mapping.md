# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 页面壳与头部 | `apps/web/src/app/(console)/monitor/page.tsx`, `MonitorContent` | `/monitor` route, `monitor:log:view` | 复用现有监控中心入口。 |
| 观测质量 KPI | `MetricCard`, `StatusBadge` | `getMonitorObservabilityOverview()` -> `MonitorObservabilityOverview` | 展示覆盖率、关联 Trace、孤儿事件、错误 Trace、慢 Trace。 |
| 服务健康 | `ServiceHealthCard` | `getMonitorOverview()` | 保留现有控制服务/运行时健康卡。 |
| 统一事件流 | 现有 `MonitorContent` table | `listMonitorEvents()` | 点击事件后设置 `selectedEventId`，并用事件 `trace_id` 拉取 Trace。 |
| Trace 下钻面板 | 新增本地组件 `TraceDetailPanel` | `getMonitorTrace(traceId)` -> `MonitorTraceDetail` | 展示 root event、metrics、propagation、timeline、errors。 |
| Trace 时间线 | `Card`, `StatusBadge`, CSS vertical timeline | `MonitorTraceTimelineItem[]` | 不新增图表库，用 Tailwind 实现。 |
| 错误/慢 Trace 卡 | `Card`, `EmptyState`, `Button` | `MonitorObservabilityOverview` | 点击卡片可选中 trace。 |
| 事件详情 JSON | 现有 `EventDetailPanel`, `JsonCard` | `getMonitorEvent()` | 保留请求/响应/步骤载荷。 |
| 状态映射 | `monitor-status.ts` | monitor enum types | 继续复用中文 label 和 tone。 |
