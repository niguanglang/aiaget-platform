# Production Deployment Baseline

This baseline turns the current application services into a repeatable private-deployment shape without adding middleware containers. PostgreSQL, MinIO, Qdrant, OpenSearch, and Temporal remain externally managed services unless the operator explicitly approves otherwise.

## Services

```text
web                  Next.js standalone console
control-api          NestJS control plane
agent-runtime        FastAPI runtime for Agent execution and workflow dispatch
agent-runtime-worker Temporal worker, enabled with the temporal-worker profile in production
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
Temporal      durable workflow backend
```

Runtime still has local fallback behavior for development and compatibility modes. For production deployments, the validation gate requires strict remote execution: `AGENT_RUNTIME_EXECUTION_MODE=runtime_only`, every `*_WORKFLOW_MODE=temporal`, and `RUNTIME_TEMPORAL_ENABLED=true`. Enable the `temporal-worker` profile only after the external Temporal service has been approved and verified.

## Release Flow

1. Copy `.env.production.example` to `.env.production` and replace every placeholder.
2. Validate the env file:

   ```bash
   node scripts/validate-production-env.mjs .env.production
   ```

   This check rejects local fallback modes. Production `.env` files must use:

   ```text
   AGENT_RUNTIME_EXECUTION_MODE=runtime_only
   KNOWLEDGE_WORKFLOW_MODE=temporal
   AGENT_TEAM_WORKFLOW_MODE=temporal
   CHANNEL_RELEASE_WORKFLOW_MODE=temporal
   CHANNEL_RELEASE_SELF_HEALING_WORKFLOW_MODE=temporal
   PLUGIN_ROLLBACK_WORKFLOW_MODE=temporal
   PLUGIN_HOOK_WORKFLOW_MODE=temporal
   RUNTIME_TEMPORAL_ENABLED=true
   ```

3. Validate Compose rendering without starting containers:

   ```bash
   docker compose -f deploy/docker-compose.production.yml --env-file .env.production config
   ```

4. Validate the observability templates without starting containers:

   ```bash
   node scripts/verify-observability-template.mjs
   ```

5. Build application artifacts locally if needed:

   ```bash
   pnpm build:prod
   python3 -m compileall apps/agent-runtime/app
   ```

6. Apply database migrations from a controlled deployment host:

   ```bash
   pnpm --filter @aiaget/control-api prisma:deploy
   ```

7. Start application services only after the operator approves the deployment action. Production Temporal workflow execution requires the worker profile:

   ```bash
   docker compose -f deploy/docker-compose.production.yml --env-file .env.production --profile temporal-worker up -d
   ```

## Health Checks

```text
GET /api/v1/health
GET /api/v1/runtime/health
GET /runtime/health
GET /login
```

The Compose template includes container health checks for these application endpoints. It does not check external PostgreSQL, MinIO, Qdrant, OpenSearch, or Temporal readiness; those should be monitored by the operator's existing infrastructure.

## Observability Closure

The production application Compose file does not start Prometheus, Grafana, Loki, or OpenTelemetry Collector. It only passes standard OpenTelemetry environment variables to the existing app services:

```text
OTEL_EXPORTER_OTLP_ENDPOINT
OTEL_EXPORTER_OTLP_PROTOCOL
OTEL_TRACES_EXPORTER
OTEL_METRICS_EXPORTER
OTEL_LOGS_EXPORTER
OTEL_RESOURCE_ATTRIBUTES
OTEL_PROPAGATORS
OTEL_TRACES_SAMPLER
OTEL_TRACES_SAMPLER_ARG
```

Use `deploy/monitoring` as the minimal operator-managed template set:

```text
OpenTelemetry Collector  OTLP gRPC 4317, OTLP HTTP 4318, Prometheus metrics 9464, Loki log export
Prometheus               Scrapes otel-collector:9464
Grafana                  Prometheus and Loki data sources
Loki                     HTTP API on 3100
```

Offline validation:

```bash
pnpm verify:prod-template
node scripts/validate-production-env.mjs .env.production
node scripts/verify-observability-template.mjs
```

Trace propagation validation against an already-running deployment:

```bash
node scripts/verify-trace-propagation.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime
```

Failure isolation:

- If the probe reports missing `x-trace-id` or `traceparent` on Control API, check the reverse proxy preserves `x-request-id`, `x-trace-id`, and `traceparent`.
- If Runtime `trace_id` differs from the probe trace id, check the Runtime public URL points to `/runtime` and that proxy headers are forwarded.
- If application headers are correct but no collector data arrives, verify `OTEL_EXPORTER_OTLP_ENDPOINT` uses the collector endpoint reachable from containers and matches `OTEL_EXPORTER_OTLP_PROTOCOL`.
- If metrics are absent in Prometheus, verify the collector exposes `:9464/metrics` and Prometheus uses `deploy/monitoring/prometheus.yml` or equivalent scrape config.
- If logs are absent in Loki/Grafana, verify the collector Loki exporter endpoint is `http://loki:3100/loki/api/v1/push` from the collector network and Grafana has the Loki datasource.

## Operational Boundaries

- Keep real secrets outside git.
- Keep the approved PostgreSQL address in `DATABASE_URL`; do not introduce a local PostgreSQL container.
- Do not add Redis, Prometheus, Grafana, Loki, OpenTelemetry Collector, or other middleware containers to the application Compose file without explicit approval.
- In multi-instance deployments, avoid enabling app-local schedulers without reviewing duplicate execution risk.
