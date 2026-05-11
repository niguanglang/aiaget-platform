# M163 Runtime 工作流恢复标识可视化

## 目标

Runtime 工作流状态页已经可以展示后端状态、最近派发失败和可恢复任务。M163 在恢复队列中补齐 Workflow ID 与 Workflow Run ID，让渠道发布、插件、Agent Team 等异步工作流失败后，可以直接从监控中心定位 Runtime / Temporal 任务。

## 本次完成

- `RuntimeWorkflowRecoverableTaskItem` 增加可选字段：
  - `workflow_id`
  - `workflow_run_id`
- Control API 在映射可恢复任务时，从平台事件 payload 中归一化读取工作流标识：
  - 渠道自动推进 / 发布自愈
  - 多 Agent 团队运行
  - 插件回滚
  - 插件 Hook 执行
- Runtime 工作流恢复页面在任务 metadata 区展示：
  - `Workflow ID`
  - `Workflow Run ID`
- 增加后端服务测试和前端 IA 契约测试，确保恢复队列可见 workflow 标识，同时不嵌入完整 Trace 详情或完整日志。

## 前端设计资产

参考设计工作区：

```text
images/frontend-reference-design/m163-runtime-工作流恢复标识可视化/
```

包含：

- `00-project-ui-brief.md`
- `01-product-ui-design-prompt.md`
- `02-product-prototype-prompt.md`
- `03-component-mapping.md`

## 影响范围

- `packages/shared-types/src/index.ts`
- `apps/control-api/src/runtime-execution/runtime-execution.service.ts`
- `apps/control-api/src/runtime-execution/runtime-execution.service.test.ts`
- `apps/web/src/components/monitor/monitor-shared-panels.tsx`
- `apps/web/src/components/monitor/monitor-route-ia-contract.test.ts`

## 约束

- 未新增数据库表结构。
- 未新增 Runtime API 路由。
- 未启动或新增任何中间件、容器。
- 页面文案保持中文。
