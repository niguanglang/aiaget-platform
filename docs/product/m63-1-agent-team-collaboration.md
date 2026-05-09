# M63-1 多 Agent 协作中心

## 目标

把单 Agent 管理能力扩展为多 Agent 团队协作能力，支持配置团队、成员职责、执行顺序、团队任务运行台账、接力记录和人工反馈。

本里程碑先完成可运营的控制面闭环，为后续 Runtime 真实多 Agent 编排和 Temporal 长任务迁移预留边界。

## 已实现

### 数据模型

新增表：

```text
agent_team
agent_team_member
agent_team_run
agent_team_step
agent_team_handoff
agent_team_feedback
```

这些表都包含 `tenant_id`，核心配置表包含软删除字段，并已补充 PostgreSQL 表注释和字段注释。

### 权限与治理

新增权限编码：

```text
agent:team:view
agent:team:manage
agent:team:run
```

新增资源类型：

```text
AGENT_TEAM
```

已接入：

```text
Data Scope
Resource ACL
菜单权限
角色权限种子
资源授权选项
```

### 后端接口

新增控制面接口：

```text
GET    /api/v1/agent-teams/overview
GET    /api/v1/agent-teams
POST   /api/v1/agent-teams
GET    /api/v1/agent-teams/:id
PATCH  /api/v1/agent-teams/:id
DELETE /api/v1/agent-teams/:id
POST   /api/v1/agent-teams/:id/members
PATCH  /api/v1/agent-teams/:id/members/:memberId
DELETE /api/v1/agent-teams/:id/members/:memberId
POST   /api/v1/agent-teams/:id/runs
POST   /api/v1/agent-teams/runs/:runId/handoff
POST   /api/v1/agent-teams/runs/:runId/feedback
```

### 前端页面

新增控制台页面：

```text
/agent-teams
```

页面能力：

```text
1. 团队概览指标
2. 团队筛选和列表
3. 团队详情面板
4. 新建和编辑团队
5. 添加、编辑、移除成员
6. 启动团队任务
7. 查看运行轨迹和步骤台账
8. 发起接力
9. 记录反馈
```

所有可见文案为中文。

### Reference-first 前端资产

已生成：

```text
images/frontend-reference-design/agent-teams/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 当前执行边界

本里程碑最初先生成可追踪的协作台账：

```text
PLAN
AGENT_RUN
SUMMARY
```

每个步骤会记录 `trace_id`、`span_id`、成员 Agent、输入摘要、输出摘要、状态、耗时和成本占位。

已完成第二步 Runtime 团队编排入口，详见：

```text
docs/product/m63-1-runtime-agent-team-orchestration.md
```

后续 Runtime 编排已完成升级，当前状态以 `docs/product/m63-1-runtime-agent-team-orchestration.md`、M66-M75 文档和代码为准：

```text
SEQUENTIAL：顺序执行成员 Agent
PARALLEL：并发执行成员 Agent
SUPERVISOR：Supervisor 决策、多轮协作、接力和人工介入
```

成员 Agent 会复用单 Agent Runtime 图，包括 LLM、RAG、Tool、Trace、模型调用日志、事件和用量投影。

## 联动关系

- `agents`：作为团队成员来源。
- `Data Scope`：控制团队列表和详情访问范围。
- `Resource ACL`：控制具体团队的查看、管理和运行权限。
- `Monitor/Audit`：团队运行记录已具备 trace 字段，已接入统一事件和用量底座。
- `M64`：团队运行已成为 `platform_event` 和 `platform_usage_event` 的来源之一。
- `Runtime 工作流`：失败的 `agent_team_run` 已纳入 `/runtime/workflows/status` 可恢复任务和 `/runtime/workflows/retry` 重试入口。
- `运行详情深链`：`/agent-teams/{teamId}/runs/{runId}` 已独立承载单次运行时间线、接力、反馈、Trace 和报告动作。
- `子事件下钻`：运行详情页已展开成员内部事件、知识引用、工具调用和模型调用，并可跳转 `/agent-teams/{teamId}/runs/{runId}/steps/{stepId}` 查看单步骤详情。
- `子事件深链`：步骤详情页支持通过 `eventType` / `eventId` 查询参数定位单条 `child_steps`、`references`、`tool_calls` 或 `model_call`。
- `Trace 图谱`：运行详情页已基于当前运行台账里的 `trace_id`、`span_id` 和 `parent_span_id` 展示运行内 Trace 图谱，并保留监控中心 Trace 跳转。

## 验证

已通过：

```text
pnpm --filter @aiaget/shared-types typecheck
pnpm --filter @aiaget/control-api prisma:validate
pnpm --filter @aiaget/control-api prisma:generate
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```

P0-7 收口补充验证：

```text
pnpm --filter @aiaget/control-api exec tsx --test src/platform-events/platform-events-dedupe.test.ts src/agent-teams/agent-teams-production-closure.test.ts src/runtime-execution/runtime-execution.service.test.ts src/runtime-execution/runtime-workflow-status.test.ts
cd apps/web && ../control-api/node_modules/.bin/tsx --test src/components/monitor/monitor-route-ia-contract.test.ts src/components/agent-teams/agent-teams-route-ia-contract.test.ts
```

## 下一步

M63-1 原计划中的第三步已经在 Runtime 编排和 M66-M75 中完成：

```text
Runtime 并行执行和 Supervisor 决策节点
```

当前已具备：

```text
1. PARALLEL 模式并发执行成员 Agent
2. SUPERVISOR 模式增加调度者节点
3. 支持多轮协作和条件接力
4. 支持人工审批等待状态
5. 将团队运行写入 platform_event / platform_usage_event
```

后续增强不再是 P0 阻塞项，主要集中在真实环境端到端演练和全局跨 Trace 聚合。

2026-05-07 补充：重复 Runtime/Workflow 恢复回调已增加步骤指纹幂等和平台事件 `dedupeKey` 复用；运行详情深链页已落地，并已展示成员内部事件、知识引用、工具调用和模型调用；单步骤详情页、单个子事件深链和运行内 Trace 图谱已落地。后续主要保留真实环境端到端演练、全局跨 Trace 聚合和外部观测系统集成。
