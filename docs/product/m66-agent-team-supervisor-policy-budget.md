# M66 多 Agent 团队 Supervisor 策略与预算约束

## 目标

把多 Agent 协作从“Supervisor 模型优先、规则兜底”继续推进到可运营配置：团队可以指定 Supervisor 模型、补充调度提示词、设置失败处理策略、启用质量门槛，并给单次团队运行配置 Token / 成本预算。

本里程碑不新增中间件或容器，只增强现有 `agent_team`、Control API、Runtime 和 `/agent-teams` 页面。

## 已实现

### 数据模型

`agent_team` 新增字段：

```text
supervisor_model_id
supervisor_prompt
failure_policy
quality_gate_enabled
quality_threshold
budget_token_limit
budget_cost_limit
```

新增迁移：

```text
apps/control-api/prisma/migrations/20260504103000_m66_agent_team_supervisor_policy
```

所有新字段已补充迁移注释和 `scripts/postgres_comments.sql` 注释。

### Control API

团队创建和更新接口已支持策略字段：

```text
POST  /api/v1/agent-teams
PATCH /api/v1/agent-teams/:id
```

后端校验：

```text
1. Supervisor 模型必须属于当前租户、启用、未删除，并且供应商有可用密钥
2. quality_threshold 必须在 0 到 1 之间
3. budget_token_limit 大于 0 或为空
4. budget_cost_limit 大于 0 或为空
```

运行请求 `RuntimeAgentTeamRequest.team` 已带上完整策略快照和 `supervisor_policy`，Runtime 不需要再回查控制面配置。

### Runtime

`SUPERVISOR` 模式已增强：

```text
1. 优先使用团队级 supervisor_model_id 对应模型
2. 未配置时继续使用成员模型兜底
3. supervisor_prompt 会作为补充 system prompt 参与调度决策
4. failure_policy 控制必选成员失败后的处理
5. budget_token_limit / budget_cost_limit 超限后写入失败 VERIFY 步骤并停止调度
6. quality_gate_enabled 开启后按成员执行成功率校验 quality_threshold
7. PLAN / SUMMARY 会展示策略约束结果
```

失败策略：

```text
MATCH_HANDOFF_POLICY：跟随 handoff_policy，审批型接力进入人工，其他策略终止
STOP_ON_REQUIRED_FAILURE：必选成员失败后终止
WAIT_HUMAN_ON_REQUIRED_FAILURE：必选成员失败后进入人工介入
CONTINUE_OPTIONAL：可选成员失败不阻断，必选成员仍按必选失败处理
```

### 前端页面

`/agent-teams` 团队表单新增：

```text
Supervisor 模型
失败策略
质量门槛开关
质量阈值
调度提示词
Token 预算上限
成本预算上限
```

团队详情面板新增：

```text
Supervisor 模型
失败策略
质量门槛
预算约束
```

团队列表新增策略摘要列，方便运营人员快速判断团队约束是否配置。

### Reference-first 前端资产

已生成：

```text
images/frontend-reference-design/agent-team-supervisor-policy/
```

包含：

```text
00-project-ui-brief.md
01-product-ui-design-prompt.md
02-product-prototype-prompt.md
03-component-mapping.md
```

## 联动关系

- 模型中心：团队 Supervisor 可选择现有启用模型配置。
- 成本与额度中心：团队运行产生的 `model_tokens` 和 `agent_team_cost` 已继续进入 `platform_usage_event`。
- 安全中心：`WAIT_HUMAN_ON_REQUIRED_FAILURE` 和 `APPROVAL_REQUIRED` 继续复用接力审批链路。
- 监控中心：策略触发的失败步骤会保留 `trace_id`、`span_id` 和错误摘要。
- Temporal：策略作为运行快照传入 Runtime，Temporal 恢复执行时仍从 Control API 重新加载最新运行上下文。

## 验证

已通过：

```text
DATABASE_URL=postgresql://validate:validate@localhost:5432/validate pnpm --filter @aiaget/control-api exec prisma validate --schema prisma/schema.prisma
DATABASE_URL=postgresql://validate:validate@localhost:5432/validate pnpm --filter @aiaget/control-api exec prisma generate --schema prisma/schema.prisma
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
python3 -m py_compile apps/agent-runtime/app/runtime/contracts.py apps/agent-runtime/app/runtime/team_execution.py
```

## 下一步

多 Agent 协作下一步建议进入：

```text
团队运行步骤子事件视图：把成员内部 RAG、工具调用、模型调用拆到团队运行工作区中展示。
```
