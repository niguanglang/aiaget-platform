# P0 并行执行计划

## 目标

在不互相干扰的前提下，把剩余 P0 模块拆成可并发执行的子任务。所有子任务必须遵守 `P0-5` 统一事件与用量投影契约，不得新增或启动中间件/container，除非先征得用户确认。

## 前置状态

已完成：

```text
P0-1 生产部署与测试体系闭环
P0-2 Runtime 多模型适配与真实流式输出
P0-3 项目状态与验收矩阵
P0-5 统一事件与用量投影契约
```

## 可并行任务池

### 任务 A：P0-6 生产可观测性部署闭环

写入范围：

```text
deploy/
docs/architecture/
scripts/
```

要求：

```text
1. 只补生产可观测性模板、文档、健康检查和 smoke 命令。
2. 不启动 Prometheus、Grafana、Loki、OpenTelemetry Collector。
3. 如需新增 compose profile 或容器定义，先明确标注为禁用，并等待用户确认后才能运行。
```

### 任务 B：P0-8 插件生态生产闭环

写入范围：

```text
apps/control-api/src/plugins/
apps/web/src/components/plugins/
docs/product/
```

要求：

```text
1. 复核并补齐 manifest 校验、安装包来源、Hook 风险控制、升级/回滚审计。
2. 所有插件高危动作写入 platform_event。
3. 不改 channels、knowledge、runtime 主逻辑。
```

### 任务 C：P0-9 全渠道发布生产闭环

建议拆成 5 个子任务：

```text
P0-9A 异步 ACK 持久化
P0-9B 调度锁与重复扫描治理
P0-9C 投递审计凭据脱敏
P0-9D 外网回调强制验签
P0-9E 渠道 workflow 失败恢复
```

写入范围：

```text
apps/control-api/src/channels/
apps/control-api/src/external-api/
apps/web/src/components/channels/
docs/product/
```

并发规则：

```text
1. P0-9C 和 P0-9D 可并行。
2. P0-9A 和 P0-9B 都会碰任务执行/调度边界，不应同时修改同一文件。
3. P0-9E 依赖 P0-5 事件契约和 workflow 状态口径。
```

### 任务 D：P0-11 知识库生产增强

建议拆成 5 个子任务：

```text
P0-11A workflow 模式配置修正
P0-11B 恢复重试回到 Runtime/Temporal
P0-11C 搜索后端禁用 fallback 闭合
P0-11D 删除/归档知识库召回隔离
P0-11E 端到端回归测试
```

写入范围：

```text
apps/control-api/src/knowledge/
apps/control-api/src/runtime-execution/
apps/agent-runtime/app/workflows/
docs/product/
```

并发规则：

```text
1. P0-11A、P0-11C、P0-11D 可以并行。
2. P0-11B 应在 P0-11A 后执行，避免模式语义变动冲突。
3. P0-11E 在 A-D 后执行。
```

## 暂不并行的任务

### P0-4 Runtime 策略与执行闭环

原因：

```text
1. 会修改 Runtime、RAG、Tool、Model、安全策略交界。
2. 与 P0-11 的 Runtime/Knowledge 工作流有共享边界。
3. 需要 P0-5 事件契约稳定后再统一收敛。
```

### P0-10 复杂计费与额度强执行

原因：

```text
1. 依赖多 Agent、插件、渠道、知识库、Runtime 的用量来源。
2. 需要先确认 P0-5 metric_type 和 resource_type 不再漂移。
3. 过早实现会导致成本分摊和额度强执行返工。
```

### P0-12 生产验收与发布 Runbook

原因：

```text
必须最后执行，否则 Runbook 会被后续模块改变。
```

## 推荐执行顺序

```text
1. 并行执行 P0-6、P0-8、P0-9C、P0-9D、P0-11A、P0-11C、P0-11D。
2. 执行 P0-9A、P0-9B、P0-11B。
3. 执行 P0-9E、P0-11E。
4. 串行执行 P0-4。
5. 串行执行 P0-10。
6. 最后执行 P0-12。
```

## 验证基线

每批子任务完成后至少运行：

```bash
pnpm test
pnpm typecheck
python3 -m compileall apps/agent-runtime/app
git diff --check
```

涉及生产配置时额外运行：

```bash
pnpm verify:prod-template
```
