# P0-12 生产验收与发布 Runbook

## 1. 发布边界

P0-12 只验收和发布应用服务：`web`、`control-api`、`agent-runtime`，可选启用 `agent-runtime-worker`。PostgreSQL、MinIO、Qdrant、OpenSearch、Temporal 和可观测性组件必须使用已批准的外部服务；不要在本 Runbook 中新增或启动中间件容器。

发布前确认：

- `.env.production` 已由 `.env.production.example` 复制并替换真实值。
- `DATABASE_URL` 指向批准的 PostgreSQL。
- `MINIO_ENDPOINT`、`QDRANT_URL`、`OPENSEARCH_URL`、`OTEL_EXPORTER_OTLP_ENDPOINT` 指向批准的外部服务。
- 如插件包使用 `s3://` 或 `minio://` 私有来源，确认 `PLUGIN_PACKAGE_OBJECT_STORAGE_*` 专用只读账号已配置；未配置时默认复用 `MINIO_*`。
- 如存在代码型插件 Hook，确认 `PLUGIN_SANDBOX_EXECUTOR_URL` 指向已批准的远程沙箱执行器；未配置时 Runtime 会阻断代码型 Hook，生产落地中心应保持阻断项。
- 真实密钥不进入 git。
- 多实例部署时，后台任务开关只在一个 Control API 实例启用，避免重复调度。

## 2. 环境校验

离线校验不会启动容器：

```bash
pnpm validate:prod-env
pnpm verify:prod-template
node scripts/verify-observability-template.mjs
node scripts/verify-production-runbook.mjs
```

如果使用临时 env 文件：

```bash
node scripts/validate-production-env.mjs /secure/path/.env.production
docker compose -f deploy/docker-compose.production.yml --env-file /secure/path/.env.production config
```

## 3. 数据库迁移与 Seed

迁移前先做数据库备份。迁移命令只连接现有 PostgreSQL，不创建数据库容器：

```bash
pnpm --filter @aiaget/control-api prisma:deploy
pnpm --filter @aiaget/control-api prisma:seed
```

验收点：

- `prisma migrate deploy` 无失败迁移。
- `scripts/postgres_comments.sql` 已通过 `prisma:deploy` 执行，新增表和字段保留注释。
- 默认租户、管理员、菜单、权限码、数据范围、资源类型 seed 可重复执行。
- 生产后台不会因为 Qdrant/OpenSearch 禁用 fallback 缺 URL 而启动失败。

## 4. 备份与恢复

发布前备份：

```bash
pg_dump "$DATABASE_URL" --format=custom --file "backups/aiaget-$(date +%Y%m%d%H%M%S).dump"
```

恢复演练在独立库执行，不能覆盖生产库：

```bash
createdb aiaget_restore_check
pg_restore --dbname aiaget_restore_check backups/latest.dump
```

恢复验收点：

- 备份文件可被 `pg_restore --list` 正常读取。
- 独立恢复库能完成 restore。
- 恢复库执行只读 smoke 查询：租户、用户、菜单、权限、Agent、知识库、平台事件和用量表均可查询。
- MinIO/S3 对象恢复由运维侧按桶生命周期和版本策略验证，本应用 Runbook 只校验对象服务连通性。

## 5. 应用启动

构建和启动应用服务：

```bash
pnpm build:prod
python3 -m compileall apps/agent-runtime/app
docker compose -f deploy/docker-compose.production.yml --env-file .env.production up -d control-api agent-runtime web
```

如果启用 Temporal Worker，必须先确认 Temporal 外部服务可用：

```bash
docker compose -f deploy/docker-compose.production.yml --env-file .env.production --profile temporal-worker up -d agent-runtime-worker
```

## 6. 健康检查

容器状态：

```bash
docker compose -f deploy/docker-compose.production.yml --env-file .env.production ps
```

应用 smoke：

```bash
node scripts/production-smoke.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime \
  --web https://console.example.com
```

如果要同时执行登录后的核心业务只读探针，提供管理员账号：

```bash
node scripts/production-smoke.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime \
  --web https://console.example.com \
  --tenant-code "$DEFAULT_TENANT_CODE" \
  --email "$DEFAULT_ADMIN_EMAIL" \
  --password "$DEFAULT_ADMIN_PASSWORD" \
  --require-auth
```

也可以直接让脚本读取环境变量 `DEFAULT_TENANT_CODE`、`DEFAULT_ADMIN_EMAIL`、`DEFAULT_ADMIN_PASSWORD`。

如果要在发布前额外验证插件生态和生产就绪闭环，可以追加 `--deep`。深度探针仍然只连接已运行服务，不启动容器、不创建中间件、不安装插件；其中插件 Manifest 探针会调用预检接口并期望自定义插件因缺少 sha256 和签名而被安全拒绝，后端可能按审计策略记录一次失败预检事件：

```bash
node scripts/production-smoke.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime \
  --web https://console.example.com \
  --tenant-code "$DEFAULT_TENANT_CODE" \
  --email "$DEFAULT_ADMIN_EMAIL" \
  --password "$DEFAULT_ADMIN_PASSWORD" \
  --require-auth \
  --deep \
  --json
```

`--require-auth` 用于生产发布验收，缺少登录凭据时直接失败；`--json` 输出脱敏证据，可附到交付记录。`--json` 不会输出 access token、password、secret 或 API Key 明文。

必须返回健康的端点：

- `GET /api/v1/health`
- `GET /api/v1/runtime/health`
- `GET /runtime/health`
- `GET /login`

## 7. 业务 Smoke

生产 smoke 脚本在提供管理员账号后会自动只读探测这些核心 API 入口：

- `GET /api/v1/auth/me`
- `GET /api/v1/agents`
- `GET /api/v1/agent-teams/overview`
- `GET /api/v1/model-providers`
- `GET /api/v1/prompt-templates`
- `GET /api/v1/knowledge-bases/overview`
- `GET /api/v1/tools`
- `GET /api/v1/conversations`
- `GET /api/v1/monitor/overview`
- `GET /api/v1/monitor/observability?window=24h`
- `GET /api/v1/runtime/workflows/status`
- `GET /api/v1/security-center/overview`
- `GET /api/v1/billing/overview`
- `GET /api/v1/channels/overview`
- `GET /api/v1/api-keys`
- `GET /api/v1/plugins/overview`
- `GET /api/v1/storage/settings`
- `GET /api/v1/system-settings/overview`
- `GET /api/v1/system-settings/production-readiness`
- `GET /api/v1/customer-success-plans`
- `GET /api/v1/customer-success-actions`
- `GET /api/v1/customer-success-opportunities`
- `GET /api/v1/customer-success-opportunities/analytics`
- `GET /api/v1/menus/tree`
- `GET /api/v1/roles/overview`
- `GET /api/v1/departments/overview`

追加 `--deep` 后还会执行：

- `POST /api/v1/plugins/manifest/validate`，校验不完整自定义插件包会被安全拒绝。
- `GET /api/v1/system-settings/production-readiness`，校验返回项包含 `plugin-sandbox-executor` 沙箱执行器门禁。

使用管理员账号登录控制台后，还需要按最小业务链路人工确认页面可用性：

- 工作台加载健康卡片、调用趋势、异常入口。
- Agent 列表、详情页、新增/编辑入口可访问。
- 模型中心能查看供应商和 API Key 脱敏信息。
- 知识库中心能查看文档、任务、检索测试和健康页。
- 工具中心能查看 HTTP 工具和调用日志。
- 会话中心能发起测试会话，Runtime 返回 trace id。
- 监控中心能查看平台事件、运行轨迹和可恢复工作流。
- 监控中心 `/monitor/observability` 能查看 24h 可观测性质量，生产落地项 `observability-trace-quality` 的人工验收记录需包含 Trace 覆盖率、孤立事件、错误链路和慢链路证据。
- 安全中心能查看安全事件、审批、恢复和归档。
- 计费中心能查看套餐、订阅、额度策略、账单、调账；额度硬阈值接口返回 allow/block。
- 渠道中心和 API Key 中心能查看外部调用、Webhook 投递、渠道发布和失败恢复入口。
- 生产落地中心 `/settings/production-readiness` 能查看环境配置、迁移、备份、Smoke、Trace 和回滚验收项。
- 客户成功计划中心 `/customer-success-plans` 能查看计划列表、详情和来源资源关系。
- 客户成功行动中心 `/customer-success-actions` 能查看行动列表、详情、阻塞风险和完成证据。
- 客户成功续约机会中心 `/customer-success-opportunities` 能查看机会列表、详情、阶段、金额、概率和来源链路。
- 机会分析页 `/customer-success-opportunities/analytics` 能查看漏斗、类型分布、风险分布和 Top 机会。

## 8. 观测与 Trace

Trace 传播探针：

```bash
node scripts/verify-trace-propagation.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime
```

观测验收点：

- Control API 响应头保留 `x-trace-id` 和 `traceparent`。
- Runtime 响应体 `trace_id` 与探针一致。
- 监控中心能按 trace id 查到相关平台事件。
- `/monitor/observability` 能展示 Trace 覆盖率、孤立事件、错误链路和慢链路，且 `GET /api/v1/monitor/observability?window=24h` 已被登录态 production smoke 覆盖。
- OpenTelemetry Collector、Prometheus、Grafana 和 Loki 由运维批准的外部平台负责；本 Runbook 不启动 Collector，不启动观测中间件，也不新增本地采集容器。

## 9. 回滚

应用回滚优先回滚镜像标签和配置，不直接回滚数据库结构：

```bash
docker compose -f deploy/docker-compose.production.yml --env-file .env.production down
AIAGET_IMAGE_TAG=<previous-tag> docker compose -f deploy/docker-compose.production.yml --env-file .env.production up -d control-api agent-runtime web
```

如果迁移导致不可恢复业务问题：

- 先停止应用写入。
- 保留故障现场数据库备份。
- 在独立库验证 `pg_restore` 结果。
- 由 DBA 按备份恢复策略恢复生产库。
- 恢复后重新执行 `node scripts/production-smoke.mjs` 和业务 Smoke。

## 10. 交付验收

最终验收命令：

```bash
node --test scripts/tests/*.test.mjs
pnpm --filter @aiaget/control-api test
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm --filter @aiaget/web lint
pnpm --filter @aiaget/web build
python3 -m compileall apps/agent-runtime/app
git diff --check
```

发布完成后记录：

- git commit、镜像 tag、部署时间、操作者。
- `.env.production` 变更摘要，不记录真实密钥。
- 数据库迁移版本。
- 备份文件路径和恢复演练结果。
- smoke 命令输出。
- 生产落地中心 `/settings/production-readiness` 人工验收结论和验收记录 ID。
- `/monitor/observability` 的 24h 可观测性证据：Trace 覆盖率、孤立事件、错误链路和慢链路，并关联 `observability-trace-quality` 验收项。
- 客户成功计划、客户成功行动、续约机会列表、机会分析页的人工验收截图或记录链接。
- 使用 `docs/product/production-delivery-record-template.md` 填写生产交付记录并归档。
- 已知风险和后续 P1/P2 事项。
