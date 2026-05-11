# M164 Runtime 工作流重试结果标识贯通

## 目标

Runtime 工作流恢复页已经可以展示失败任务上的旧 `Workflow ID` 和 `Workflow Run ID`。本轮补齐恢复重试后的新派发结果，避免用户点击“恢复重试”后只能看到泛化成功文案，无法继续追踪新实例。

## 范围

- `POST /runtime/workflows/retry` 返回值新增：
  - `workflow_backend`
  - `workflow_id`
  - `workflow_run_id`
- 渠道发布自动推进、渠道发布自愈、多 Agent 团队运行、插件回滚、插件 Hook 执行恢复重试会把底层工作流派发结果透传给 Runtime API。
- Runtime 工作流页面新增“最近重试结果”卡片，展示任务、工作流后端、`Workflow ID`、`Workflow Run ID`。

## 页面边界

- `/runtime/workflows` 仍只承载工作流后端状态、可恢复任务、恢复确认和最近一次重试结果。
- 不把完整 Trace、日志全文、运行时间线塞进该页面；这些仍由监控详情页或业务详情页承载。

## 验收

- 恢复重试前仍需要显式确认。
- 重试成功后能在当前页看到新派发标识。
- 无权限用户的重试按钮继续禁用。
- 失败任务列表刷新仍通过 `runtime-workflow-status` query invalidation 完成。
