# M63 Advanced Ecosystem Roadmap

## 目标

把现有企业 AIAgent 平台从“单 Agent 企业控制台”推进到“可运营的生态型平台”，优先补齐四类高阶能力：

1. 多 Agent 协作
2. 插件生态
3. 全渠道发布
4. 复杂计费

这四项不单独割裂建设，必须共享统一的事件、trace、用量、审计和权限底座。

## 现有底座

当前平台已经具备可复用的基础能力：

- `Control API`：租户、组织、权限、资源授权、Agent、知识库、工具、外部 API、监控、审计
- `Runtime`：Agent 执行、RAG、工具调用、流式响应、内部 workflow 边界
- `Tool Gateway`：工具执行、审批、限流、安全策略
- `Temporal`：知识库任务工作流边界
- `Billing`：成本与额度观测
- `External API`：API Key、Webhook、SDK、观测

## 共用底座

所有高阶能力都应该首先落到统一底座：

- 基础文档：[M64 共用事件与用量底座](./m64-shared-event-usage-base.md)

### 统一事件模型

建议统一事件字段：

```text
tenant_id
department_id
user_id
agent_id
team_id
plugin_id
channel_id
conversation_id
run_id
task_id
trace_id
request_id
event_type
status
cost
duration_ms
error_message
created_at
```

### 统一落点

- PostgreSQL：元数据、状态、关系、审计
- Object Storage：插件包、渠道模板、附件、导出文件
- Runtime / Tool Gateway：执行层
- Monitor / Audit：可观测性和追踪
- Billing：所有消耗事件

## M63-1 多 Agent 协作

### 目标

把单 Agent 执行升级为“团队式协作”，支持规划、执行、校验、接力、人工介入。

当前落地文档：[M63-1 多 Agent 协作中心](./m63-1-agent-team-collaboration.md)

### 与现有系统联动

- `agents`：作为团队成员的基础执行单元
- `conversations`：保存团队会话和子任务上下文
- `runtime-execution`：执行团队编排
- `Temporal`：承载长任务和可恢复执行
- `Tool Gateway`：子 Agent 工具调用仍受审批、限流和权限控制
- `Resource ACL` / `Data Scope`：控制哪些 Agent 可以参与哪些资源
- `Monitor` / `Audit`：记录每个子步骤和最终汇总

### 建议数据模型

```text
agent_team
agent_team_member
agent_team_run
agent_team_step
agent_team_handoff
agent_team_feedback
```

### 页面

- 团队列表
- 团队编排页
- 团队运行详情
- 子步骤轨迹
- 人工接管面板

### 执行顺序

1. 团队与成员模型
2. 团队运行接口
3. Runtime 团队编排
4. 子步骤 trace
5. 前端控制台

## M63-2 插件生态

### 目标

把“工具管理”升级成“插件安装、升级、启停、审核、市场”。

### 与现有系统联动

- `Tool Center`：插件最终可编译成工具能力
- `Tool Gateway`：插件工具执行仍走统一网关
- `System Settings`：插件配置和开关
- `Security Center`：插件包审核、权限评估、风险审查
- `Storage`：插件包与资源文件存储
- `Menus`：插件可以注入受控菜单入口
- `Audit`：安装、升级、启停全记录

### 建议数据模型

```text
plugin_manifest
plugin_registry
plugin_version
plugin_installation
plugin_hook
plugin_permission
plugin_audit_log
```

### 页面

- 插件市场
- 已安装插件
- 插件详情
- 安装向导
- 版本对比
- 权限预览

### 执行顺序

1. manifest 规范
2. 插件注册表
3. 安装/卸载/启停
4. hook 执行
5. 前端页面
6. 安全审核

## M63-3 全渠道发布

### 目标

把外部 API 能力扩展为“多渠道发布与回执”。

### 与现有系统联动

- `External API`：复用现有会话、Webhook、SDK 思路
- `Conversation`：渠道消息可回落成会话线程
- `Monitor` / `Audit`：投递、失败、回执、重试
- `Storage`：模板、附件、素材
- `Security Center`：渠道账号和敏感模板审核

### 建议数据模型

```text
channel_provider
channel_account
channel_template
channel_publish_job
channel_delivery
channel_reply
channel_route_rule
```

### 页面

- 渠道配置中心
- 模板中心
- 发布编排页
- 投递日志
- 回执列表
- 重试中心

### 执行顺序

1. 渠道抽象层
2. 账号与密钥配置
3. 模板引擎
4. 发布任务
5. 投递/回执/重试
6. 前端控制台

## M63-4 复杂计费

### 目标

从“成本观测”升级成“套餐、账单、结算、超额策略”。

### 与现有系统联动

- `M47` 成本与额度中心：作为只读观测入口
- `model_call_log` / `tool_call_log` / `conversation_run`：作为用量来源
- `webhook_delivery` / `channel_delivery`：作为外发成本来源
- `plugin` / `team`：作为新型消耗维度
- `Audit`：结算与调整留痕

### 建议数据模型

```text
billing_meter
billing_usage_event
billing_plan
billing_subscription
billing_invoice
billing_invoice_item
billing_quota_policy
billing_adjustment
```

### 页面

- 套餐管理
- 用量台账
- 账单中心
- 调账中心
- 配额策略
- 超额告警
- 成本分摊

### 执行顺序

1. 用量事件模型
2. 价格规则
3. 账单周期
4. 套餐与配额
5. 调账单与财务调整
6. 导出与结算
6. 前端计费控制台

### 当前落地

- `billing_adjustment`：记录减免、补收、退款、折扣和纠错，包含租户、关联账单、金额、状态、审批/生效时间、来源和审计字段。
- `POST /billing/adjustments`：创建手工调账单，写入 `billing.adjustment.created` 平台事件。
- `/billing`：新增“调账中心”中文面板，支持选择调整类型、关联账单、填写金额/原因/说明，并展示最近调整单。
- 下期账单估算会叠加已批准或已生效调账金额。

## 推荐整体顺序

```text
1. M64 共用事件与用量底座
2. 多 Agent 协作
3. 插件生态
4. 全渠道发布
5. 复杂计费
```

## 约束

- 不在这一阶段新增新的基础中间件。
- 继续复用 PostgreSQL、Runtime、Tool Gateway、Temporal、MinIO、Monitor、Audit、Billing。
- 所有高阶能力都必须通过租户、部门、角色、权限、Data Scope、Resource ACL 和安全策略闭环。
