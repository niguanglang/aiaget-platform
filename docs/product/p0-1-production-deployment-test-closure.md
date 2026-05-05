# P0-1 生产部署与测试体系闭环

## 目标

把平台从“可开发运行”推进到“可按模板交付部署和验证”，本阶段不新增、不启动任何中间件容器。

## 已实现

- 新增生产环境模板：`.env.production.example`
- 新增生产环境校验脚本：`scripts/validate-production-env.mjs`
- 新增校验脚本测试：`scripts/tests/validate-production-env.test.mjs`
- 新增应用服务 Dockerfile：
  - `apps/control-api/Dockerfile`
  - `apps/web/Dockerfile`
  - `apps/agent-runtime/Dockerfile`
- 新增生产 Compose 模板：`deploy/docker-compose.production.yml`
- 新增统一脚本：
  - `pnpm build:prod`
  - `pnpm test`
  - `pnpm validate:prod-env`
  - `pnpm verify:prod-template`
  - `pnpm verify:prod`
- 调整 `@aiaget/shared-types` 为构建后产物导出，避免生产 Node 入口依赖 TypeScript 源文件。
- 更新生产部署文档：`docs/architecture/production-deployment.md`

## 边界

- 本阶段只提供应用服务生产编排，不创建 PostgreSQL、Redis、MinIO、Qdrant、OpenSearch、Temporal 或可观测性中间件。
- `deploy/docker-compose.production.yml` 默认只启动 Web、Control API、Runtime。
- Temporal Worker 通过 `temporal-worker` profile 手动启用。
- Prometheus、Grafana、Loki、OpenTelemetry Collector 留到后续可观测性部署里程碑，并需要单独确认中间件动作。

## 验证命令

```bash
node --test scripts/tests/validate-production-env.test.mjs
pnpm verify:prod-template
pnpm typecheck
pnpm test
python3 -m compileall apps/agent-runtime/app
```
