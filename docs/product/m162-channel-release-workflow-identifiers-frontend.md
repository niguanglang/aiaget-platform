# M162 渠道发布工作流标识前端可视化

## 目标

M161 已经把渠道自动推进、发布自愈和发布巡检调度的 `workflow_id`、`workflow_run_id` 从 Runtime 派发链路贯通到控制面。M162 将这些标识展示到发布治理前端，方便运维和审计人员在页面上直接定位 Temporal / Runtime 异步任务。

## 本次完成

- 自动推进页面展示 overview 级工作流模式、后端、Workflow ID、Workflow Run ID。
- 自动推进最近决策展示最近运行的工作流后端、Workflow ID、Workflow Run ID。
- 发布自愈页面展示自愈结论对应的工作流后端、Workflow ID、Workflow Run ID。
- 发布自愈页面新增最近自愈运行卡片，展示运行 ID、结论、回滚状态和工作流标识。
- 发布巡检调度最近运行列表在每个渠道结果中展示工作流后端、Workflow ID、Workflow Run ID。
- 增加 IA 契约测试，确保发布治理页面展示工作流标识，同时不把完整 Trace 详情或完整日志塞入列表页。

## 前端设计资产

参考设计工作区：

```text
images/frontend-reference-design/m162-渠道发布工作流标识可视化/
```

包含：

- `00-project-ui-brief.md`
- `01-product-ui-design-prompt.md`
- `02-product-prototype-prompt.md`
- `03-component-mapping.md`

## 影响范围

- `apps/web/src/components/channels/channel-release-automation-content.tsx`
- `apps/web/src/components/channels/channel-release-self-healing-content.tsx`
- `apps/web/src/components/channels/channel-release-scheduler-content.tsx`
- `apps/web/src/components/channels/channels-route-ia-contract.test.ts`

## 约束

- 未新增后端接口。
- 未新增数据库表结构。
- 未启动或新增任何中间件、容器。
- 页面文案保持中文。
