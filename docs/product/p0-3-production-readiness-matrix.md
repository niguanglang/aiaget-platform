# P0-3 项目状态与验收矩阵收口

## 目标

把当前已经完成的大量 M 系列能力收敛成 P0 生产验收口径，明确哪些能力已经可作为上线基线，哪些是 P0 必须补齐，哪些属于上线后的增强项。

## 当前总状态

项目已经具备企业 Agent 平台的核心控制面、执行面、知识库、工具、安全、审计、监控、存储、外部调用、高级扩展和生产部署模板。P0 当前不是从零补功能，而是做生产闭环：验证口径、统一事件与用量投影、Runtime 策略收敛、可观测性部署、关键高级模块验收和最终 Runbook。

## P0 验收矩阵

| P0 模块 | 当前状态 | 是否阻塞上线 | 主要缺口 | 建议处理方式 |
| --- | --- | --- | --- | --- |
| P0-1 生产部署与测试体系闭环 | 已完成 | 否 | 只提供应用服务模板，不创建中间件容器 | 已提交，后续在 P0-12 做部署演练 |
| P0-2 Runtime 多模型适配与真实流式输出 | 已完成 | 否 | Azure api-version、Anthropic max_tokens 仍是默认值；Control API 旧 fallback 尚未完全收敛 | 作为 P0-4 的输入继续收口 |
| P0-3 项目状态与验收矩阵 | 本文完成 | 否 | 需要随后续 P0 子任务持续更新 | 每个 P0 子任务完成后更新矩阵 |
| P0-4 Runtime 策略与执行闭环 | 未完成 | 是 | Runtime 内部 RAG / Tool / Model 调用仍需完全复用统一安全策略、Data Scope、Resource ACL 和平台事件投影 | P0-5 契约后串行执行 |
| P0-5 统一事件与用量全来源投影 | 部分完成 | 是 | 已有平台事件/用量表、查询、Rollup 和部分来源投影；仍需定死 P0 事件/metric 命名、必填字段和各来源最低写入清单 | 先完成契约，再并行接入模块 |
| P0-6 生产可观测性部署闭环 | 已完成 | 否 | 已补 OTEL exporter env、operator 托管 Prometheus/Grafana/Loki/Collector 最小模板、离线模板校验、trace id 贯通探针和失败验证 Runbook；仍不在应用 compose 中启动中间件容器 | 上线时由运维接入真实 collector/dashboard 并运行探针 |
| P0-7 多 Agent 协作生产验收 | 基本完成 | 否 | 多 Agent 已有 Runtime 编排、Supervisor、预算、步骤子事件、报告导出/归档；需要端到端验收和少量文档状态修正 | 可作为并行验收任务，不宜先大改 |
| P0-8 插件生态生产闭环 | 已完成 | 否 | 已补 Manifest 静态校验、自定义插件来源/sha256/签名元数据门禁、Tool Gateway 绑定预览、安装失败事件和卸载权限闭环；真实包下载、hash 计算和在线验签留到后续增强 | 后续如启用执行型 Hook，单独接插件沙箱或受控异步执行器 |
| P0-9 全渠道发布生产闭环 | 部分完成 | 是 | 投递审计凭据脱敏、外网回调强制验签、异步 ACK 持久化、调度锁与重复扫描治理已完成；仍剩渠道 workflow 失败恢复入口不完整 | 继续执行 P0-9E |
| P0-10 复杂计费与额度强执行 | 部分完成 | 是 | 已有套餐、订阅、账单、额度、调账和用量 Rollup；仍需把团队、插件、渠道、知识库、Runtime 的 P0 用量口径统一后强执行 | P0-5 和业务来源稳定后执行 |
| P0-11 知识库生产增强 | 部分完成 | 是 | 工作流模式配置、恢复重试回到 Runtime/Temporal、搜索后端禁用 fallback 和删除/归档知识库召回隔离已完成；仍剩端到端回归测试 | 继续执行 P0-11E |
| P0-12 生产验收与发布 Runbook | 未完成 | 是 | 缺少最终 smoke test、迁移/seed 验证、备份恢复、回滚、健康检查、交付文档 | 最后执行 |

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
| P0-9E 渠道 workflow 失败恢复 | 依赖 P0-5 契约 | `runtime-execution`、`channels` workflow 服务、监控入口 | 自动推进/自愈失败可在监控中心查看并重放 |

## P0-11 知识库生产增强拆分

| 子任务 | 可并行 | 写入范围 | 验收点 |
| --- | --- | --- | --- |
| P0-11A workflow 模式配置修正 | 已完成 | `.env.production.example`、`deploy/docker-compose.production.yml`、`knowledge-task-dispatcher.service.ts` | 生产默认模式和代码枚举一致，旧 runtime 模式兼容映射但生产校验拒绝 |
| P0-11B 恢复重试回到 Runtime/Temporal | 已完成 | `runtime-execution.service.ts`、`knowledge.module.ts`、`knowledge-task-dispatcher.service.ts` | retry 在 `temporal_first/temporal` 下重新派发 Runtime/Temporal |
| P0-11C 搜索后端禁用 fallback 闭合 | 已完成 | `qdrant.service.ts`、`opensearch.service.ts` | `*_ENABLED=false` 时不要求 URL 环境变量，PostgreSQL fallback 可启动；启用但缺 URL 抛清晰错误 |
| P0-11D 删除/归档知识库召回隔离 | 已完成 | `knowledge.service.ts` 检索查询 | 已删除、归档或停用知识库不再被 Runtime 检索召回，segment 查询层再次加关系过滤 |
| P0-11E 端到端回归测试 | 依赖 A-D | tests/docs | 覆盖上传、workflow、索引、检索、持久化和删除隔离 |

### 第二批串行或半串行

1. P0-4 Runtime 策略与执行闭环。
2. P0-10 复杂计费与额度强执行。

P0-4 会碰 Runtime / RAG / Tool / Model 安全边界；P0-10 依赖 P0-5 和各业务模块的用量来源，因此不适合提前并行。

### 最终收口

1. P0-12 生产验收与发布 Runbook。

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
