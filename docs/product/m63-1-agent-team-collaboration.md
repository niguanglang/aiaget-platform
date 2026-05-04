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

本里程碑的团队运行先生成可追踪的协作台账：

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

当前 `SEQUENTIAL` 已经可以通过 Runtime 顺序执行成员 Agent，并复用单 Agent 的 LLM / RAG / 工具链路；`PARALLEL` 和 `SUPERVISOR` 暂时会降级为顺序执行并在 PLAN 步骤标记。

## 联动关系

- `agents`：作为团队成员来源。
- `Data Scope`：控制团队列表和详情访问范围。
- `Resource ACL`：控制具体团队的查看、管理和运行权限。
- `Monitor/Audit`：团队运行记录已具备 trace 字段，后续可接入统一事件底座。
- `M64`：团队运行会成为 `platform_event` 和 `platform_usage_event` 的来源之一。

## 验证

已通过：

```text
pnpm --filter @aiaget/shared-types typecheck
pnpm --filter @aiaget/control-api prisma:validate
pnpm --filter @aiaget/control-api prisma:generate
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
```

## 下一步

继续做 M63-1 的第三步：

```text
Runtime 并行执行和 Supervisor 决策节点
```

目标是把当前 Runtime 团队顺序编排升级为真实多模式协作：

```text
1. PARALLEL 模式并发执行成员 Agent
2. SUPERVISOR 模式增加调度者节点
3. 支持多轮协作和条件接力
4. 支持人工审批等待状态
5. 将团队运行写入 platform_event / platform_usage_event
```
