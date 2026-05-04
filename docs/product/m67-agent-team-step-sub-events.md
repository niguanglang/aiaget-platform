# M67 多 Agent 团队运行步骤子事件视图

## 目标

把团队运行里的 `AGENT_RUN` 从单层摘要升级为可下钻视图：每个团队成员执行步骤可以看到该成员内部的提示词、知识检索、工具调用、模型响应、RAG 引用、Tool Gateway 调用摘要和模型调用摘要。

本里程碑不新增接口、不新增中间件、不启动容器；只复用 Runtime 已返回的成员执行明细，并在 Control API 持久化和 `/agent-teams` 页面展示。

## 已实现

### 数据模型

`agent_team_step` 新增 JSON 字段：

```text
child_steps
references
tool_calls
model_call
```

新增迁移：

```text
apps/control-api/prisma/migrations/20260504123000_m67_agent_team_step_sub_events
```

字段注释已写入迁移和 `scripts/postgres_comments.sql`。

### Control API

`AgentTeamsService.persistRuntimeTeamRun` 已把 `RuntimeAgentTeamResponse.member_results` 按 `member_id` 合并回对应的团队 `AGENT_RUN` 步骤：

```text
member_result.steps       -> agent_team_step.child_steps
member_result.references  -> agent_team_step.references
member_result.tool_calls  -> agent_team_step.tool_calls
member_result.model_call  -> agent_team_step.model_call
```

新增映射逻辑：

```text
1. enrichRuntimeTeamSteps：匹配团队步骤和成员结果
2. mapRuntimeModelCallToTeamModelCall：压缩模型调用摘要，避免把完整 request/response 直接塞给前端
3. mapTeamStepCreateInput：写入 JSON 字段
4. mapStep：从 JSON 字段恢复前端契约
```

追加恢复运行 `appendExisting` 路径也会写入相同子事件字段。

### 共享类型

`AgentTeamStepItem` 新增：

```text
child_steps: ConversationRunStepItem[]
references: ConversationReferenceItem[]
tool_calls: ConversationToolCallItem[]
model_call: AgentTeamModelCallItem | null
```

`AgentTeamModelCallItem` 用于团队步骤的模型调用摘要：

```text
trace_id
status
request_model
prompt_tokens
completion_tokens
total_tokens
latency_ms
output_preview
error_message
```

### 前端页面

`/agent-teams` 的步骤详情面板新增中文下钻区块：

```text
1. 成员内部事件：展示 prompt / knowledge / tool / response 子步骤
2. 知识引用：展示 RAG 命中的标题、片段、来源和相关度
3. 工具调用：展示工具名称、编码、状态、HTTP 状态、审批 ID、输出或错误
4. 模型调用：展示模型、Token、耗时、Trace、输出预览或错误
```

保留现有运行选择器、步骤时间线、接力审批、人工反馈和监控中心 Trace 入口。

### Reference-first 前端资产

已生成：

```text
images/frontend-reference-design/agent-team-step-sub-events/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 联动关系

- Runtime：复用单 Agent Runtime 图返回的 `steps`、`references`、`tool_calls`、`model_call`。
- 知识库中心：团队步骤可以直接看到成员 RAG 引用，便于排查召回质量。
- 工具中心 / Tool Gateway：团队步骤可以直接看到成员工具调用结果和审批状态。
- 模型中心 / 成本中心：团队步骤可以看到成员模型调用 Token 和耗时，成本仍按既有日志与用量事件归因。
- 监控中心：团队步骤、子步骤和模型调用继续保留 Trace / Span 信息，支持跳转监控中心检索。

## 验收标准

```text
1. 团队运行后，AGENT_RUN 步骤能保存成员内部子步骤。
2. 有知识库命中时，步骤详情能看到引用来源。
3. 有工具调用时，步骤详情能看到工具状态和输出/错误。
4. 有模型调用时，步骤详情能看到模型、Token、耗时和输出预览。
5. 没有子事件时，页面展示中文空态，不影响原有团队运行详情。
6. Prisma schema、Control API typecheck、Web typecheck 通过。
```

## 下一步

多 Agent 协作后续建议进入：

```text
团队运行回放与对比：按 run 展示多次团队执行差异、成员输出变化、RAG 命中变化和工具调用差异。
```
