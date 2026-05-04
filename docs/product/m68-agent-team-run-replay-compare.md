# M68 多 Agent 团队运行回放与对比

## 目标

在 `/agent-teams` 团队运行工作区中补齐“当前运行回放”和“上一轮运行对比”，让运营人员能快速判断同一个团队任务多次执行之间的差异：成员输出、步骤数、Token、成本、耗时、RAG 命中、工具调用和模型调用是否发生变化。

本里程碑不新增接口、不新增中间件、不启动容器；基于现有 `getAgentTeam` 返回的 `runs/steps` 派生前端对比视图。

## 已实现

### 数据契约

`AgentTeamStepItem` 新增返回字段：

```text
run_id
```

Control API `mapStep` 已从 `agent_team_step.run_id` 映射该字段。前端现在优先用 `run_id` 精确筛选运行步骤；如果历史数据或异常数据缺失，再回退到 `trace_id`。

团队详情中步骤查询数量从 30 扩展到 120，便于同一团队最近多次运行进行对比。

### 前端页面

`/agent-teams` 的运行轨迹工作区新增：

```text
1. 当前运行信号：步骤、成员内部事件、知识引用、工具调用、模型调用、Trace、Token、成本、耗时。
2. 上一轮差异：当前运行与上一条运行在 Token、成本、耗时、步骤数、内部事件、RAG、工具调用上的差异。
3. 成员差异：按成员聚合当前运行和上一轮运行，展示 Token、成本、耗时、RAG / 工具 / 模型数量和输出摘要差异。
4. 空态：没有上一轮运行时展示“暂无上一轮可对比”。
```

保留现有能力：运行选择、步骤时间线、步骤详情子事件、Trace 复制、监控中心跳转、接力审批和人工反馈。

### Reference-first 前端资产

已生成：

```text
images/frontend-reference-design/agentteamrunreplaycompare/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 联动关系

- M67 团队步骤子事件：本模块复用 `child_steps/references/tool_calls/model_call` 做回放与差异统计。
- 监控中心：仍通过 `trace_id` 跳转全链路事件。
- 成本与额度中心：本模块只展示团队运行已统计成本，不改变计费归因。
- Tool Gateway / 知识库中心：本模块把成员级工具调用和 RAG 命中数量纳入对比。

## 验收标准

```text
1. 选择某次团队运行后，步骤筛选优先按 run_id 精确匹配。
2. 当前运行能展示回放信号摘要。
3. 存在上一轮运行时，能展示 Token、成本、耗时、步骤、内部事件、知识引用和工具调用差异。
4. 成员差异能按成员展示当前与上一轮的输出摘要和用量变化。
5. 不存在上一轮运行时，页面显示中文空态。
6. Control API 和 Web typecheck 通过。
```

## 下一步

多 Agent 协作后续建议进入：

```text
团队运行报告导出：把团队运行摘要、成员输出、RAG 引用、工具调用、模型用量和差异分析导出为审计报告。
```
