# P0-3 项目状态与验收矩阵收口

## 目标

把当前已经完成的大量 M 系列能力收敛成 P0 生产验收口径，明确哪些能力已经可作为上线基线，哪些是 P0 必须补齐，哪些属于上线后的增强项。

## 当前总状态

项目已经具备企业 Agent 平台的核心控制面、执行面、知识库、工具、安全、审计、监控、存储、外部调用、高级扩展和生产部署模板。P0 当前不是从零补功能，而是做生产闭环：验证口径、统一事件与用量投影、Runtime 策略收敛、可观测性部署、关键高级模块验收和最终 Runbook。

## P0 验收矩阵

| P0 模块 | 当前状态 | 是否阻塞上线 | 主要缺口 | 建议处理方式 |
| --- | --- | --- | --- | --- |
| P0-1 生产部署与测试体系闭环 | 已完成 | 否 | 只提供应用服务模板，不创建中间件容器 | 已提交，后续在 P0-12 做部署演练 |
| P0-2 Runtime 多模型适配与真实流式输出 | 已完成 | 否 | Azure `api-version` 与 Anthropic `max_tokens` 已由模型配置驱动，并保留默认值 fallback；Control API 本地 fallback 已对齐 Azure / Anthropic 非流式与流式 adapter 合同 | 后续可按部署策略逐步减少 Control API 本地 fallback 使用面 |
| P0-3 项目状态与验收矩阵 | 本文完成 | 否 | 需要随后续 P0 子任务持续更新 | 每个 P0 子任务完成后更新矩阵 |
| P0-4 Runtime 策略与执行闭环 | 已完成 | 否 | Runtime 内部 RAG / Tool 调用复用 Control API 的 Data Scope、Resource ACL、工具审批与安全策略；模型调用已投影 `runtime.model.call.*`、`model_tokens`、`model_cost`；Runtime 内部拒绝写 `security.access.denied` | 纳入 P0-12 最终 smoke test |
| P0-5 统一事件与用量全来源投影 | 已完成 | 否 | P0 事件/metric 命名、必填字段、来源系统和最低写入清单已固定；Runtime 模型、知识检索、工具、渠道、插件、外部 API、计费等来源已按契约投影 | 后续新增模块按契约扩展 |
| P0-6 生产可观测性部署闭环 | 已完成 | 否 | 已补 OTEL exporter env、operator 托管 Prometheus/Grafana/Loki/Collector 最小模板、离线模板校验、trace id 贯通探针和失败验证 Runbook；仍不在应用 compose 中启动中间件容器 | 上线时由运维接入真实 collector/dashboard 并运行探针 |
| P0-7 多 Agent 协作生产验收 | 已完成 | 否 | Runtime 编排、Supervisor、预算、步骤子事件、报告导出/归档、安全审批与通知/SLA 分类链路已落地；团队运行启动、完成、失败、等待人工、handoff、用量和成本均进入统一事件/用量底座；失败的 AgentTeamRun 已纳入 Runtime 工作流恢复列表和重试入口，重试会先重置 FAILED run 后再重新派发，恢复路径已闭合；重复恢复回调已做步骤指纹幂等和平台事件 `dedupeKey` 复用；运行详情深链页已独立承载时间线、Trace、接力、反馈、报告动作、成员内部事件、知识引用、工具调用和模型调用；单步骤详情页和单个子事件深链已支持 `eventType` / `eventId` 定位；运行内 Trace 图谱已展示 `trace_id`、`span_id`、`parent_span_id` 关系、根节点和孤立节点；生产模板 `AGENT_TEAM_WORKFLOW_MODE` 已改为 `temporal_first`，旧 `runtime_first/runtime_only` 会兼容归一到 `temporal_first` | 纳入 P0-12 最终 smoke test，真实发布时按 Runbook 演练 |
| P0-8 插件生态生产闭环 | 已完成 | 否 | 已补 Manifest 静态校验、自定义插件来源/sha256/签名存在性门禁、HTTP/HTTPS 与 S3/MinIO 私有对象存储包下载、真实包 sha256 计算、外部在线 verifier 强制验签门禁、本地公钥 detached signature verifier、前端完整性预检门禁、Tool Gateway 绑定预览、升级/回滚控制面闭环、Runtime/Temporal 回滚派发、受控 Hook 入队、Hook 沙箱审计快照持久化、Hook Runtime 执行、Hook 失败恢复、安装失败事件、卸载权限闭环和代码型 Hook 的 Runtime 沙箱执行器未配置阻断事件；签名存在且策略要求验签时，未配置或不可用 verifier 必须阻断安装，metadata-only 仅用于审计展示，不计为验签通过；Hook 执行限定为 Manifest 生成工具并复用 Tool Gateway 审批/限流/安全/审计边界；完整 Sigstore/PGP SDK 信任链 verifier 和插件包代码沙箱留到后续增强 | 纳入 P0-12 最终 smoke test；如后续允许插件包自定义代码运行，需要单独接插件沙箱和资源隔离 |
| P0-9 全渠道发布生产闭环 | 已完成 | 否 | 投递审计凭据脱敏、外网回调强制验签、渠道回调 10 分钟重放窗口防护、异步 ACK 持久化、调度锁与重复扫描治理、渠道 workflow 失败恢复均已完成；后续只剩端到端发布演练 | 纳入 P0-12 最终 smoke test |
| P0-10 复杂计费与额度强执行 | 已完成 | 否 | 套餐、订阅、账单、额度、调账和用量 Rollup 已有；额度强执行已从抽象 `COST/TOKEN/API_CALL/MODEL_CALL/AGENT_RUN/STORAGE_GB` 映射到 Runtime、团队、渠道、知识库、工具、插件、存储、外部 Agent/Channel 请求和外部 Webhook 投递等具体 `platform_usage_event` 指标；外部 API chat/continue/stream/channel 热路径已在非幂等回放执行前接入 `API_CALL` quota，成功请求写 billable external request usage，Webhook 完成通知写 `webhook_deliveries` 用量，硬阈值阻断时写 `billing.quota.blocked`；API Key 日额度使用条件更新预占，分钟限流已改为 PostgreSQL 共享窗口计数，多实例部署不再依赖进程内 Map | 纳入 P0-12 最终 smoke test |
| P0-11 知识库生产增强 | 已完成 | 否 | workflow 模式配置、恢复重试回到 Runtime/Temporal、搜索后端禁用 fallback、删除/归档知识库召回隔离和端到端回归测试均已完成 | 纳入 P0-12 最终 smoke test |
| P0-12 生产验收与发布 Runbook | 已完成 | 否 | 已补生产 smoke 脚本、Runbook 校验脚本、迁移/seed、备份恢复、回滚、健康检查、业务 Smoke、Trace 验收和交付记录清单；实际发布仍需运维在目标环境执行 | 发布时按 Runbook 执行并留存输出 |

## 可并行分组

### 串行前置

1. P0-3 项目状态与验收矩阵。
2. P0-5 统一事件与用量投影契约。

### 第一批并行

1. P0-6 生产可观测性部署闭环。
2. P0-8 插件生态生产闭环。
3. P0-9 全渠道发布生产闭环。
4. P0-11 知识库生产增强。

这些任务主要写入目录不同，互相影响较小；共享事件与用量写入必须遵守 P0-5 契约。

## P0-9 渠道生产闭环拆分

| 子任务 | 可并行 | 写入范围 | 验收点 |
| --- | --- | --- | --- |
| P0-9A 异步 ACK 持久化 | 已完成 | `apps/control-api/src/external-api/external-channel-callback.service.ts`、`channelReply` 扫描 | 快速 ACK 后执行任务可恢复，不因进程重启丢失 |
| P0-9B 调度锁与重复扫描治理 | 已完成 | `apps/control-api/src/channels/channel-sender-task.service.ts`、`channel-release-scheduler.service.ts` | 多实例下不会重复重试、重复巡检或重复自动推进 |
| P0-9C 投递审计凭据脱敏 | 已完成 | `external-channel-sender.service.ts`、`channel-audit-redaction.ts`、渠道审计输出 | URL query、Header、Body、响应摘要、Webhook token 存储和返回均脱敏，已脱敏审计凭据不再用于重试 |
| P0-9D 外网回调强制验签 | 已完成 | `external-channel-callback.service.ts`、渠道配置校验 | Slack 原生签名强制校验；配置了签名/secret/encrypt key 的渠道回调不能静默跳过验签 |
| P0-9E 渠道 workflow 失败恢复 | 已完成 | `runtime-execution`、`channels` workflow 服务、监控入口 | 自动推进/自愈失败可在监控中心查看并重放；知识库任务恢复要求 `knowledge:base:manage`，渠道发布/自愈恢复要求 `channel:publish:deploy` |
| P0-9F 渠道回调重放防护 | 已完成 | `external-channel-callback.service.ts`、`platform_event.dedupeKey` | 签名或外部消息 ID 构造 10 分钟重放窗口幂等键；重复回调在创建回复、会话和 Agent 运行前被拒绝，并写 `channel.callback.replay_blocked` |

## P0-11 知识库生产增强拆分

| 子任务 | 可并行 | 写入范围 | 验收点 |
| --- | --- | --- | --- |
| P0-11A workflow 模式配置修正 | 已完成 | `.env.production.example`、`deploy/docker-compose.production.yml`、`knowledge-task-dispatcher.service.ts` | 生产默认模式和代码枚举一致，旧 runtime 模式兼容映射但生产校验拒绝 |
| P0-11B 恢复重试回到 Runtime/Temporal | 已完成 | `runtime-execution.service.ts`、`knowledge.module.ts`、`knowledge-task-dispatcher.service.ts` | retry 在 `temporal_first/temporal` 下重新派发 Runtime/Temporal |
| P0-11C 搜索后端禁用 fallback 闭合 | 已完成 | `qdrant.service.ts`、`opensearch.service.ts` | `*_ENABLED=false` 时不要求 URL 环境变量，PostgreSQL fallback 可启动；启用但缺 URL 抛清晰错误 |
| P0-11D 删除/归档知识库召回隔离 | 已完成 | `knowledge.service.ts` 检索查询 | 已删除、归档或停用知识库不再被 Runtime 检索召回，segment 查询层再次加关系过滤 |
| P0-11E 端到端回归测试 | 已完成 | `knowledge-e2e.test.ts`、`knowledge-retrieval.test.ts`、`search-backends.test.ts`、`runtime-execution.service.test.ts` | 已验证上传、workflow、索引 fallback、检索、持久化、恢复重试和删除/归档召回隔离 |

### 第二批串行或半串行

1. P0-4 Runtime 策略与执行闭环。
2. P0-10 复杂计费与额度强执行。

P0-4 和 P0-10 已完成。P0-10 固定以 P0-5 事件与用量契约为强执行来源，后续新增计费用量必须先写入 `platform_usage_event`，再接入额度映射。外部 API 已进入 Billing quota 热路径；API Key 分钟限流已通过 `external_api_key_rate_limit_window` 表做跨实例共享窗口预占。

### 最终收口

1. P0-12 生产验收与发布 Runbook。

P0-12 已完成文档和离线/在线探针脚本收口。实际发布动作仍需运维确认后执行，不在代码验收阶段自动启动容器。

## P0 上线最低要求

1. 所有生产配置必须来自 `.env.production`，不能依赖开发默认值。
2. 不擅自创建 PostgreSQL、Redis、MinIO、Qdrant、OpenSearch、Temporal 或可观测性容器。
3. 所有业务写操作必须有租户隔离、权限校验和审计/事件记录。
4. Runtime、Tool Gateway、External API、渠道回调和后台任务必须保留 `trace_id` / `request_id`。
5. 关键用量必须进入 `platform_usage_event`，可被 Rollup、成本中心和告警中心复用。
6. 最终交付前必须跑通 typecheck、测试、生产模板校验、Runtime Python 编译和 smoke test。

## 后续维护规则

每完成一个 P0 子任务，都需要更新本矩阵：

```text
当前状态
是否阻塞上线
主要缺口
建议处理方式
```

如果新增中间件、容器或持久化服务，必须先征得用户确认。
