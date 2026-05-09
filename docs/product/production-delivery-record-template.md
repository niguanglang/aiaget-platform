# 生产交付记录模板

本模板用于真实生产发布后的交付留档。填写时只记录环境摘要、执行结果和证据位置，不记录数据库密码、API Key、Token、对象存储密钥等敏感信息。

## 1. 发布基础信息

| 项目 | 内容 |
| --- | --- |
| 系统名称 | 企业 AI Agent 平台 |
| 发布版本 |  |
| Git Commit |  |
| 镜像 Tag |  |
| 发布环境 | 生产 / 预生产 / 私有化客户环境 |
| 部署方式 | Docker Compose / Kubernetes / 其他 |
| 部署时间 |  |
| 操作者 |  |
| 复核人 |  |
| 变更单号 |  |

## 2. 发布边界

本次发布的应用服务：

- [ ] Web Console
- [ ] Control API
- [ ] Agent Runtime
- [ ] Agent Runtime Worker

本次未由应用发布流程创建或启动的外部中间件：

- [ ] PostgreSQL
- [ ] Redis
- [ ] MinIO / S3
- [ ] Qdrant
- [ ] OpenSearch
- [ ] Temporal
- [ ] OpenTelemetry Collector / Prometheus / Grafana / Loki

发布说明：

```text

```

## 3. 环境配置摘要

| 配置项 | 当前值摘要 | 验收结论 |
| --- | --- | --- |
| `DATABASE_URL` | 仅填写主机、端口、库名，不记录账号密码 |  |
| `MINIO_ENDPOINT` |  |  |
| `QDRANT_URL` |  |  |
| `OPENSEARCH_URL` |  |  |
| `TEMPORAL_ADDRESS` |  |  |
| `OTEL_EXPORTER_OTLP_ENDPOINT` |  |  |
| `NEXT_PUBLIC_API_BASE_URL` |  |  |
| `RUNTIME_BASE_URL` |  |  |

配置变更摘要：

```text

```

敏感信息检查：

- [ ] `.env.production` 未进入 Git。
- [ ] 日志、截图、交付附件未包含明文密钥。
- [ ] API Key、模型 Key、对象存储密钥在前端和接口返回中保持脱敏。

## 4. 数据库迁移与 Seed

| 项目 | 结果 |
| --- | --- |
| 迁移命令 | `pnpm --filter @aiaget/control-api prisma:deploy` |
| Seed 命令 | `pnpm --filter @aiaget/control-api prisma:seed` |
| 迁移版本 |  |
| 执行时间 |  |
| 执行人 |  |
| 是否有失败迁移 | 是 / 否 |
| 是否已检查表注释和字段注释 | 是 / 否 |

执行输出摘要：

```text

```

异常说明：

```text

```

## 5. 备份与恢复演练

| 项目 | 内容 |
| --- | --- |
| 备份时间 |  |
| 备份文件路径 |  |
| 备份校验命令 | `pg_restore --list <backup-file>` |
| 恢复演练库 |  |
| 恢复演练时间 |  |
| 恢复演练结果 | 通过 / 未通过 / 未执行 |
| 对象存储备份策略 |  |

恢复演练输出摘要：

```text

```

只读 Smoke 查询结果：

- [ ] 租户、用户、部门、角色、菜单、权限可查询。
- [ ] Agent、模型、提示词、知识库、工具可查询。
- [ ] 会话、运行轨迹、平台事件、用量和计费数据可查询。
- [ ] 审计、安全审批、资源授权和系统设置可查询。

## 6. 应用启动记录

启动命令：

```bash
docker compose -f deploy/docker-compose.production.yml --env-file .env.production up -d control-api agent-runtime web
```

可选 Worker 启动命令：

```bash
docker compose -f deploy/docker-compose.production.yml --env-file .env.production --profile temporal-worker up -d agent-runtime-worker
```

容器 / Pod 状态摘要：

```text

```

启动结论：

- [ ] 应用服务均已启动。
- [ ] 健康检查接口可访问。
- [ ] 后台任务只在一个 Control API 实例启用。
- [ ] 未启动未经批准的中间件容器。

## 7. 健康检查与 Smoke

基础 Smoke 命令：

```bash
node scripts/production-smoke.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime \
  --web https://console.example.com
```

登录态 Smoke 命令：

```bash
node scripts/production-smoke.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime \
  --web https://console.example.com \
  --tenant-code "$DEFAULT_TENANT_CODE" \
  --email "$DEFAULT_ADMIN_EMAIL" \
  --password "$DEFAULT_ADMIN_PASSWORD"
```

Smoke 输出摘要：

```text

```

核心入口验收：

- [ ] 登录页可访问。
- [ ] 工作台可加载。
- [ ] Agent 中心可查询、详情可打开。
- [ ] 模型、提示词、知识库、工具中心可查询。
- [ ] 会话测试可返回 Runtime Trace ID。
- [ ] 监控、安全、计费、渠道、插件、系统设置入口可访问。

## 8. 观测与 Trace 验收

Trace 探针命令：

```bash
node scripts/verify-trace-propagation.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime
```

验收记录：

- [ ] Control API 响应头包含 `x-trace-id`。
- [ ] Control API 响应头包含 `traceparent`。
- [ ] Runtime 响应体包含一致的 `trace_id`。
- [ ] 监控中心可按 Trace ID 检索平台事件。
- [ ] OpenTelemetry Collector 可接收遥测数据。
- [ ] Grafana / Prometheus / Loki 数据源可用。

输出摘要：

```text

```

## 9. 生产落地中心验收

关联页面：

- 控制台：`/settings/production-readiness`
- 接口：`GET /api/v1/system-settings/production-readiness`
- 验收接口：`POST /api/v1/system-settings/production-readiness/:checkId/accept`

验收项：

- [ ] 环境配置验收已记录。
- [ ] 数据库迁移与 Seed 验收已记录。
- [ ] 备份恢复演练验收已记录。
- [ ] 基础 Smoke 验收已记录。
- [ ] 业务 Smoke 验收已记录。
- [ ] Trace 与可观测性验收已记录。
- [ ] 回滚预案验收已记录。

验收记录 ID / 审计事件：

```text

```

## 10. 回滚预案与执行判断

回滚镜像 Tag：

```text

```

回滚命令：

```bash
docker compose -f deploy/docker-compose.production.yml --env-file .env.production down
AIAGET_IMAGE_TAG=<previous-tag> docker compose -f deploy/docker-compose.production.yml --env-file .env.production up -d control-api agent-runtime web
```

回滚触发条件：

- [ ] 应用启动失败且无法在维护窗口内修复。
- [ ] 核心业务 Smoke 失败。
- [ ] 数据库迁移导致不可接受的数据风险。
- [ ] 安全、权限或审计能力出现阻断级异常。

本次是否触发回滚：是 / 否

回滚说明：

```text

```

## 11. 已知风险与后续事项

| 优先级 | 风险 / 事项 | 负责人 | 计划完成时间 | 状态 |
| --- | --- | --- | --- | --- |
| P1 |  |  |  |  |
| P2 |  |  |  |  |

## 12. 交付签署

| 角色 | 姓名 | 结论 | 时间 |
| --- | --- | --- | --- |
| 发布负责人 |  | 通过 / 不通过 |  |
| 运维负责人 |  | 通过 / 不通过 |  |
| 业务验收人 |  | 通过 / 不通过 |  |
| 安全 / 审计负责人 |  | 通过 / 不通过 |  |

最终结论：

```text

```
