# M63-1 Runtime 多 Agent 团队编排增强

## 目标

把 M63-1 的多 Agent 团队运行从 Control API 本地台账升级为 Runtime 编排入口，让团队任务开始复用现有单 Agent Runtime 图执行链路。

## 已实现

### Runtime 接口

新增接口：

```text
POST /runtime/agent-teams/run
```

请求包含：

```text
request_id
trace_id
run_id
objective
team 快照
members 成员快照
每个成员的 agent_request
```

响应包含：

```text
trace_id
status
summary
total_tokens
total_cost
latency_ms
steps
member_results
error_message
```

### Runtime 编排行为

当前支持：

```text
1. 团队任务规划 PLAN
2. SEQUENTIAL 成员 Agent 顺序执行 AGENT_RUN
3. PARALLEL 成员 Agent 并发执行 AGENT_RUN
4. SUPERVISOR 生成调度决策 VERIFY
5. SUPERVISOR 自动生成接力 HANDOFF
6. 团队结果汇总 SUMMARY
7. 每个成员复用现有 Runtime 单 Agent 图节点
8. 每个成员继续复用 Control API 内部 RAG 和 Tool Gateway 适配
9. trace_id / span_id / parent_span_id 全链路传递
```

### 执行模式

```text
SEQUENTIAL：
按成员 execution_order 顺序执行，后续成员会读取上游成员输出。

PARALLEL：
用 Runtime asyncio.gather 并发触发成员 Agent，每个成员基于同一团队目标独立处理，最后统一汇总。

SUPERVISOR：
先生成 Supervisor 调度决策步骤，然后顺序执行成员 Agent，并自动生成成员之间的接力记录。
```

### 接力记录

Runtime 在 SUPERVISOR 模式下会返回：

```text
handoffs
```

Control API 会写入：

```text
agent_team_handoff
```

状态为：

```text
AUTO
```

前端可以继续使用已有团队详情面板查看接力链路。

### Supervisor 多轮决策

本次已增强为小型决策循环：

```text
1. 每轮生成 VERIFY 决策步骤
2. 按剩余成员、已完成成员、失败成员选择下一位成员
3. 成员执行失败且为必选成员时自动重试一次
4. 必选成员重试后仍失败时，根据 handoff_policy 进入人工介入或提前结束
5. 当全部必选成员已成功或达到 max_rounds 时提前结束
```

策略说明：

```text
handoff_policy = APPROVAL_REQUIRED：
必选成员失败后返回 WAITING_HUMAN，并创建 PENDING 接力记录。

handoff_policy = AUTO / MANUAL：
必选成员失败后返回 FAILED，并创建 AUTO 接力记录说明终止原因。
```

运行状态：

```text
SUCCESS：团队目标完成
FAILED：必选成员失败或达到失败终止条件
WAITING_HUMAN：等待人工介入后继续
```

### Supervisor 模型决策

M63-1H 已把 SUPERVISOR 模式从纯规则调度升级为“模型优先、规则兜底”的调度器。

运行策略：

```text
1. 每轮 Supervisor 从剩余成员、已完成执行、失败结果和团队策略中构造调度上下文
2. 优先使用成员已解析出的 OPENAI_COMPATIBLE 模型配置发起 Supervisor 决策调用
3. 模型必须返回严格 JSON：action / next_member_id / reason / confidence
4. action 支持 RUN_MEMBER / RETRY_MEMBER / WAIT_HUMAN / STOP
5. RUN_MEMBER / RETRY_MEMBER 必须选择 remaining_members 中的 member_id
6. STOP 仅在已有执行结果且目标满足时采纳
7. WAIT_HUMAN 仅在 handoff_policy = APPROVAL_REQUIRED 时采纳
8. 模型不可用、调用失败、JSON 无效、成员 ID 无效时自动切换规则回退
```

VERIFY 步骤现在会记录：

```text
1. 本轮是“模型决策”还是“规则回退”
2. 被选择的成员和角色
3. 决策理由与置信度
4. 规则回退原因
5. Supervisor 模型调用的 prompt_tokens / completion_tokens / total_tokens / cost_total
```

团队运行汇总的 total_tokens / total_cost 已包含 Supervisor 决策模型开销，因此后续成本中心可以按团队运行完整计费。

M66 已补齐团队级 Supervisor 策略和预算约束。Runtime 会优先使用 `agent_team.supervisor_model_id` 对应模型；未配置时继续使用剩余成员中第一个可用的模型配置；如果团队成员都没有模型配置，则保持确定性规则调度。

团队级策略还包括：

```text
supervisor_prompt：补充调度 system prompt
failure_policy：必选成员失败处理策略
quality_gate_enabled / quality_threshold：团队质量门槛
budget_token_limit：单次团队运行 Token 预算上限
budget_cost_limit：单次团队运行成本预算上限
```

策略触发时会写入 VERIFY / SUMMARY 步骤，继续进入团队运行台账和 platform_event / platform_usage_event 归因链路。

### Control API 联动

`POST /api/v1/agent-teams/:id/runs` 已调整为：

```text
1. 创建 RUNNING 状态 agent_team_run
2. 根据 AGENT_TEAM_WORKFLOW_MODE 调度本地执行或 Runtime 工作流
3. 执行侧用 run_id 重新加载团队和成员快照
4. 调用 Runtime /runtime/agent-teams/run
5. 回写 agent_team_step
6. 回写 agent_team_handoff
7. 回写 total_steps / completed_steps / failed_steps
8. 回写 total_tokens / total_cost / latency_ms
9. 兼容 WAITING_HUMAN 状态
10. Runtime 失败时写入失败台账，前端仍可看到失败原因
```

### 平台事件与用量投影

M63-1F 已把团队运行接入统一事件和用量底座：

```text
platform_event
platform_usage_event
```

团队运行完成、失败、等待人工介入时会写入：

```text
agent.team.run.finished
agent.team.run.failed
agent.team.run.waiting_human
```

Supervisor 接力会写入：

```text
agent.team.handoff
```

用量事件当前覆盖：

```text
agent_team_runs：团队运行次数
workflow_steps：团队运行步骤数
model_tokens：团队运行汇总 Token
agent_team_cost：团队运行汇总成本
```

这些事件都会携带：

```text
tenant_id
department_id
user_id
team_id
run_id
request_id
trace_id
source_system
source_id
```

后续监控中心、审计中心、成本与额度中心可以直接基于这两张表做统一查询和聚合。

数据库新增：

```text
20260502100000_m63_team_platform_events
```

并已在迁移和 `scripts/postgres_comments.sql` 中补齐新表和字段注释。

### 团队运行 UI 增强

M63-1G 已增强 Agent 协作中心的运行轨迹工作区：

```text
apps/web/src/components/agent-teams/agent-teams-content.tsx
```

页面仍复用：

```text
/agent-teams
```

新增前端能力：

```text
1. 运行记录选择器，支持在团队最近运行之间切换
2. 运行摘要指标，展示完成度、失败步骤、Token、成本、耗时、request_id 和 trace_id
3. 步骤时间线，展示 PLAN、AGENT_RUN、VERIFY、HANDOFF、SUMMARY 等步骤
4. 步骤详情面板，展示输入摘要、输出摘要、错误信息、Token、成本、Trace、Span 和父 Span
5. 事件与用量入口，展示 platform_event / platform_usage_event 的对应归因口径
6. 监控中心 Trace 跳转，使用 /monitor?keyword=<trace_id> 复用已有监控页面
7. 接力记录列表，展示来源、目标、状态、原因和决策备注
8. 运行反馈列表，展示评分、备注、作者和时间
9. 保留原有启动任务、提交接力、保存反馈、成员维护和权限禁用状态
```

本次前端参考设计工作区：

```text
images/frontend-reference-design/agent-team-run-trace
```

### Temporal 人工介入恢复

M63-1I 已把 `WAITING_HUMAN` 团队运行接入 Temporal signal 恢复链路。

执行边界：

```text
1. Runtime 新增 AgentTeamRunWorkflow.resume_after_handoff signal
2. Workflow 执行到 WAITING_HUMAN 后等待人工审批信号
3. 审批通过后继续调用 Control API 内部执行端点
4. 审批拒绝后 workflow 结束为 REJECTED，Control API 台账保持失败终态
5. Control API 仍是团队运行、步骤、接力和审批决策的业务真源
6. 恢复执行时从 agent_team_step 回读已完成成员和上游输出
7. Runtime resume_context 只承载继续执行所需上下文，不依赖 workflow 内存状态
8. Temporal 未启用时继续使用本地 fallback 调度
```

新增/增强接口：

```text
POST /runtime/workflows/agent-team-runs/start
POST /runtime/workflows/agent-team-runs/resume
POST /api/v1/agent-teams/handoffs/:handoffId/approve
POST /api/v1/agent-teams/handoffs/:handoffId/reject
```

前端已在 Agent 协作中心加入“人工介入”面板：

```text
1. 展示等待人工介入状态
2. 展示待审批接力原因、来源、目标和创建时间
3. 支持填写审批备注
4. 支持“通过并继续”和“拒绝结束”
5. 审批后刷新团队详情、运行轨迹和接力记录
```

本次前端参考设计工作区：

```text
images/frontend-reference-design/agent-team-human-resume
```

其中包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

成员 Agent 快照包含：

```text
Agent 基础配置
Prompt 绑定
Knowledge 绑定
Tool 绑定
Model 配置
Control API 内部调用配置
```

### Temporal 工作流边界

新增 Runtime workflow endpoint：

```text
POST /runtime/workflows/agent-team-runs/start
```

请求只传最小输入：

```json
{
  "run_id": "agent_team_run.id"
}
```

Runtime 在 Temporal 未启用时返回：

```text
backend = LOCAL_FALLBACK
```

并使用本地后台任务回调 Control API：

```text
POST /api/v1/runtime/internal/agent-team-runs/run
```

Temporal 启用后会启动：

```text
AgentTeamRunWorkflow
```

Workflow Activity 同样回调 Control API 内部接口，由 Control API 重新加载 PostgreSQL 中的团队、成员、模型、提示词、知识库和工具配置。

### 调度模式

Control API 新增环境变量：

```text
AGENT_TEAM_WORKFLOW_MODE=local
```

可选值：

```text
local：
默认模式，请求线程内同步执行当前团队运行。

temporal_first：
优先请求 Runtime workflow start endpoint，失败后回退本地执行。

temporal：
强制请求 Runtime workflow start endpoint，调度失败则把 agent_team_run 标记为 FAILED。
```

## 已完成闭环

```text
团队运行 -> Workflow 调度边界 -> Runtime 团队编排 -> Supervisor 模型决策/规则回退 -> 成员 Agent Runtime 图 -> RAG / Tool / Model -> Supervisor 接力 -> 团队汇总 -> 运行台账 -> platform_event / platform_usage_event -> 前端运行轨迹工作区
```

## 产品价值

这一步让多 Agent 协作从“控制面配置和台账”进入“Runtime 可执行链路”：

```text
团队运行 -> Runtime 团队编排 -> 成员 Agent Runtime 图 -> RAG / Tool / Model -> 团队汇总 -> 运行台账
```

后续插件生态、渠道发布、复杂计费都可以把团队运行作为统一执行对象。

## 未完成边界

下一步建议继续拆：

```text
1. M64：统一事件查询、用量汇总、事件关系和 rollup 聚合
2. M65：团队运行步骤继续拆出成员内部 RAG、工具和模型子事件视图
3. M67：团队运行步骤继续拆出成员内部 RAG、工具和模型子事件视图
4. M68：复杂计费规则、团队任务预算和渠道级成本分摊
```

## 验证

已通过：

```text
python3 -m compileall apps/agent-runtime/app
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/shared-types typecheck
pnpm --filter @aiaget/control-api prisma:validate
pnpm --filter @aiaget/control-api prisma:generate
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web lint
```

## 历史记录

初版能力：

```text
1. 团队任务规划 PLAN
2. 成员 Agent 顺序执行 AGENT_RUN
3. 团队结果汇总 SUMMARY
4. 每个成员复用现有 Runtime 单 Agent 图节点
5. 每个成员继续复用 Control API 内部 RAG 和 Tool Gateway 适配
6. trace_id / span_id / parent_span_id 全链路传递
```

当前边界：

```text
PARALLEL 和 SUPERVISOR 曾经降级为顺序执行，本次已升级。
```
