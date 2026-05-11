# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| 发布治理页面壳 | `ChannelReleaseHeader`, `ChannelCenterBackground` | Existing release routes | 复用当前渠道发布页面结构，不新增导航。 |
| 渠道选择 | `ReleaseChannelPicker` | `getPublishChannelOverview().channels` | 自动推进和自愈页面继续按渠道查看。 |
| 自动推进状态 | `Card` + `DetailGrid` | `ChannelReleaseAutomationOverview` | 在现有状态卡里补 `workflow_backend`、`workflow_id`、`workflow_run_id`。 |
| 自动推进最近决策 | `Card` + `DetailGrid` | `ChannelReleaseAutomationRunResult` | 最近运行详情补 workflow backend/id/run id。 |
| 发布自愈结论 | `Card` + `DetailGrid` | `ChannelReleaseSelfHealingOverview` | 在结论或工作流追踪区域补 overview 级 workflow 标识。 |
| 发布自愈最近运行 | `Card` + `DetailGrid` | `ChannelReleaseSelfHealingRunResult` | 如果存在最近运行，展示 run id、决策、backend、workflow id、workflow run id。 |
| 发布巡检最近运行 | `Card` + compact result rows | `ChannelReleaseSchedulerRunResult.results[]` | 每条调度结果展示 channel/task/status/decision/backend/workflow id/run id。 |
| 操作按钮 | `Button` + lucide icons | run/update mutations | 沿用现有确认弹窗和权限禁用逻辑。 |
| 反馈状态 | `ChannelAlert`, `EmptyState` | React Query state | 保持现有中文错误、成功、空状态。 |
