# Production Deployment Baseline

This baseline turns the current application services into a repeatable private-deployment shape without adding middleware containers. PostgreSQL, MinIO, Qdrant, OpenSearch, and Temporal remain externally managed services unless the operator explicitly approves otherwise.

## Services

```text
web                  Next.js standalone console
control-api          NestJS control plane
agent-runtime        FastAPI runtime for Agent execution and workflow dispatch
agent-runtime-worker Optional Temporal worker profile, disabled by default
```

The production Compose file is:

```text
deploy/docker-compose.production.yml
```

It builds from:

```text
apps/web/Dockerfile
apps/control-api/Dockerfile
apps/agent-runtime/Dockerfile
```

## Required External Services

```text
PostgreSQL    metadata, tenant data, audit, usage, billing
MinIO/S3      file storage and archive objects
Qdrant        vector search
OpenSearch    keyword search
Temporal      optional durable workflow backend
```

Runtime has local fallback behavior when Temporal is disabled. For multi-instance production deployments, use Temporal for workflow execution and enable the `temporal-worker` profile.

## Release Flow

1. Copy `.env.production.example` to `.env.production` and replace every placeholder.
2. Validate the env file:

   ```bash
   node scripts/validate-production-env.mjs .env.production
   ```

3. Validate Compose rendering without starting containers:

   ```bash
   docker compose -f deploy/docker-compose.production.yml --env-file .env.production config
   ```

4. Build application artifacts locally if needed:

   ```bash
   pnpm build:prod
   python3 -m compileall apps/agent-runtime/app
   ```

5. Apply database migrations from a controlled deployment host:

   ```bash
   pnpm --filter @aiaget/control-api prisma:deploy
   ```

6. Start application services only after the operator approves the deployment action:

   ```bash
   docker compose -f deploy/docker-compose.production.yml --env-file .env.production up -d
   ```

## Health Checks

```text
GET /api/v1/health
GET /api/v1/runtime/health
GET /runtime/health
GET /login
```

The Compose template includes container health checks for these application endpoints. It does not check external PostgreSQL, MinIO, Qdrant, OpenSearch, or Temporal readiness; those should be monitored by the operator's existing infrastructure.

## Operational Boundaries

- Keep real secrets outside git.
- Keep the approved PostgreSQL address in `DATABASE_URL`; do not introduce a local PostgreSQL container.
- Do not add Redis, Prometheus, Grafana, Loki, OpenTelemetry Collector, or other middleware containers without explicit approval.
- In multi-instance deployments, avoid enabling app-local schedulers without reviewing duplicate execution risk.
