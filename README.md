# Enterprise Agent Platform

Enterprise Agent Platform is a private-deployable platform for managing agents, models, prompts, knowledge bases, tools, conversations, audit logs, and runtime observability.

This repository is currently in the **P0 production closure phase**. It contains the monorepo foundation, protected Web Console shell, real JWT authentication, tenant context, user CRUD, RBAC foundation, login logs, operation logs, tenant-scoped Agent configuration with versioned publish workflows, model provider/configuration management with masked API keys and call logs, prompt template management with variables, versions, rollback, render checks, provider-backed live prompt testing, knowledge base management with document ingestion, segmentation, hybrid retrieval tests, task records, HTTP tool management with schema validation, risk policy, live test calls, persisted conversation threads with runtime traces, step-level run observability, tool-call summaries, feedback, a real monitor center with run-step aggregation and filtering, a real audit center, a real settings center, a dashboard backed by real aggregates and run-step drilldown, streamed assistant responses on conversation detail, real agent resource bindings for models, prompts, knowledge bases, and tools, inline agent detail runtime testing backed by the conversation module, a real approval center for high-risk tool execution, provider-backed real model execution for conversation and compatibility test flows, live knowledge retrieval citations persisted back into conversations, provider-backed embedding retrieval with local vector fallback, a remote MinIO-backed storage center with bucket initialization and tenant-scoped file management, knowledge document upload that stores original source files in MinIO, Qdrant-backed knowledge vector indexing with PostgreSQL fallback, OpenSearch-backed keyword indexing for true Qdrant + OpenSearch hybrid retrieval, queued background knowledge processing with a Temporal-ready task dispatch boundary, LangGraph-shaped Runtime execution for conversation turns with Runtime-owned model calls, real provider SSE streaming, Runtime multi-model adapters, Control API persistence fallback modes, and OpenTelemetry-compatible trace ID propagation across Web, Control API, Runtime, model calls, RAG, tools, logs, and monitor events.

## Workspace

```text
apps/
  web/             Next.js Web Console
  control-api/     NestJS Control Plane API
  agent-runtime/   FastAPI Agent Runtime
packages/
  shared-types/    Shared TypeScript contracts
  eslint-config/   Shared lint config placeholder
  tsconfig/        Shared TypeScript configs
deploy/
  docker-compose.yml
docs/
scripts/
```

## Prerequisites

- Node.js 22+
- pnpm 10+
- Python 3.11+
- Docker and Docker Compose

If pnpm is not available, enable it through Corepack:

```bash
corepack enable --install-directory "$HOME/.local/bin"
corepack prepare pnpm@10.33.2 --activate
```

## Local Bootstrap

```bash
cp .env.example .env
pnpm install
pnpm lint
pnpm typecheck
```

## Run Services

Use external PostgreSQL / MinIO / Qdrant / OpenSearch / Temporal first. Local container startup is optional and only available through the `local` compose profile. The local profile does not provide default middleware passwords, so review `.env` before starting it.

```bash
docker compose -f deploy/docker-compose.yml config
docker compose -f deploy/docker-compose.yml --profile local up -d
```

## Production Deployment Template

Production deployment is described in [docs/architecture/production-deployment.md](./docs/architecture/production-deployment.md). The repository includes application-service Dockerfiles and a Compose template that does not create middleware containers.

```bash
cp .env.production.example .env.production
node scripts/validate-production-env.mjs .env.production
docker compose -f deploy/docker-compose.production.yml --env-file .env.production config
node scripts/verify-observability-template.mjs
```

Useful verification commands:

```bash
pnpm build:prod
pnpm test
pnpm verify:prod-template
pnpm verify:observability-template
python3 -m compileall apps/agent-runtime/app
```

Do not start or add middleware/container services without explicit operator approval.

Production observability templates live in [deploy/monitoring](./deploy/monitoring/README.md). The production application Compose file only passes OTEL exporter environment variables to existing application services; Prometheus, Grafana, Loki, and OpenTelemetry Collector remain operator-managed services.

After a production environment is already running, verify trace propagation without starting containers:

```bash
node scripts/verify-trace-propagation.mjs \
  --control-api https://api.example.com/api/v1 \
  --runtime https://runtime.example.com/runtime
```

Apply Control API database migration and seed:

```bash
pnpm --filter @aiaget/control-api prisma:deploy
pnpm --filter @aiaget/control-api prisma:seed
```

Start the Web Console:

```bash
pnpm dev:web
```

Start the Control API:

```bash
pnpm dev:control-api
```

Start the Agent Runtime:

```bash
cd apps/agent-runtime
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Initial Endpoints

- Web Console: `http://localhost:3000`
- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`
- Control API health: `http://localhost:3001/api/v1/health`
- Runtime health via Control API: `http://localhost:3001/api/v1/runtime/health`
- Control API Swagger: `http://localhost:3001/api/docs`
- Runtime health: `http://localhost:8000/runtime/health`
- Runtime docs: `http://localhost:8000/runtime/docs`

## Documentation

- Product milestones: [docs/product](./docs/product/README.md)
- API notes: [docs/api](./docs/api/README.md)
- External API SDK: [docs/api/external-api-sdk.md](./docs/api/external-api-sdk.md)
- Architecture notes: [docs/architecture](./docs/architecture/README.md)

Runtime execution mode is controlled by `AGENT_RUNTIME_EXECUTION_MODE`:

```text
runtime_first  Prefer Runtime LangGraph execution and fall back to Control API model execution if Runtime fails.
runtime_only   Require Runtime execution.
control_first  Use the previous Control API model execution path.
```

Default development login:

```text
tenant code: default
email: oss-admin-7f4c2a@local.invalid
password: AIAgetDev!9sK4pQ7m
```

Implemented Control API routes:

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
GET  /api/v1/tenants
GET  /api/v1/users
POST /api/v1/users
PATCH /api/v1/users/:id
DELETE /api/v1/users/:id
GET  /api/v1/agent-categories
GET  /api/v1/agents
POST /api/v1/agents
GET  /api/v1/agents/:id
PATCH /api/v1/agents/:id
DELETE /api/v1/agents/:id
POST /api/v1/agents/:id/versions
POST /api/v1/agents/:id/publish
POST /api/v1/agents/:id/rollback
POST /api/v1/agents/:id/disable
POST /api/v1/agents/:id/archive
POST /api/v1/agents/:id/bindings/models
DELETE /api/v1/agents/:id/bindings/models/:bindingId
POST /api/v1/agents/:id/bindings/prompts
DELETE /api/v1/agents/:id/bindings/prompts/:bindingId
POST /api/v1/agents/:id/bindings/knowledge
PATCH /api/v1/agents/:id/bindings/knowledge/:bindingId
DELETE /api/v1/agents/:id/bindings/knowledge/:bindingId
POST /api/v1/agents/:id/bindings/tools
PATCH /api/v1/agents/:id/bindings/tools/:bindingId
DELETE /api/v1/agents/:id/bindings/tools/:bindingId
GET  /api/v1/model-providers
POST /api/v1/model-providers
GET  /api/v1/model-providers/:id
PATCH /api/v1/model-providers/:id
DELETE /api/v1/model-providers/:id
POST /api/v1/model-providers/:id/disable
POST /api/v1/model-providers/:id/enable
POST /api/v1/model-providers/:id/api-keys
DELETE /api/v1/model-providers/:id/api-keys/:keyId
POST /api/v1/model-providers/:id/test
POST /api/v1/models
PATCH /api/v1/models/:id
DELETE /api/v1/models/:id
POST /api/v1/models/:id/disable
POST /api/v1/models/:id/enable
GET  /api/v1/prompt-templates
POST /api/v1/prompt-templates
GET  /api/v1/prompt-templates/:id
PATCH /api/v1/prompt-templates/:id
DELETE /api/v1/prompt-templates/:id
POST /api/v1/prompt-templates/:id/copy
POST /api/v1/prompt-templates/:id/publish
POST /api/v1/prompt-templates/:id/rollback
POST /api/v1/prompt-templates/:id/render
POST /api/v1/prompt-templates/:id/test
POST /api/v1/prompt-templates/:id/variables
PATCH /api/v1/prompt-templates/:id/variables/:variableId
DELETE /api/v1/prompt-templates/:id/variables/:variableId
GET  /api/v1/knowledge-bases
POST /api/v1/knowledge-bases
GET  /api/v1/knowledge-bases/:id
PATCH /api/v1/knowledge-bases/:id
DELETE /api/v1/knowledge-bases/:id
POST /api/v1/knowledge-bases/:id/documents
GET  /api/v1/knowledge-bases/:id/documents/:documentId
PATCH /api/v1/knowledge-bases/:id/documents/:documentId
DELETE /api/v1/knowledge-bases/:id/documents/:documentId
POST /api/v1/knowledge-bases/:id/documents/:documentId/reprocess
POST /api/v1/knowledge-bases/:id/retrieval-test
POST /api/v1/knowledge-bases/:id/rebuild-index
GET  /api/v1/tools
POST /api/v1/tools
GET  /api/v1/tools/:id
PATCH /api/v1/tools/:id
DELETE /api/v1/tools/:id
POST /api/v1/tools/:id/copy
POST /api/v1/tools/:id/disable
POST /api/v1/tools/:id/enable
POST /api/v1/tools/:id/test
GET  /api/v1/tool-approvals/overview
GET  /api/v1/tool-approvals
GET  /api/v1/tool-approvals/:id
POST /api/v1/tool-approvals/:id/approve
POST /api/v1/tool-approvals/:id/reject
GET  /api/v1/conversations
POST /api/v1/conversations
GET  /api/v1/conversations/:id
DELETE /api/v1/conversations/:id
POST /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/feedback
POST /api/v1/conversations/:id/messages/stream
GET  /api/v1/monitor/overview
GET  /api/v1/monitor/events
GET  /api/v1/monitor/events/:eventId
GET  /api/v1/audit/overview
GET  /api/v1/audit/events
GET  /api/v1/audit/events/:eventId
GET  /api/v1/tenants/:id
PATCH /api/v1/tenants/:id
GET  /api/v1/roles
GET  /api/v1/api-keys
POST /api/v1/api-keys
DELETE /api/v1/api-keys/:id
GET  /api/v1/storage/settings
POST /api/v1/storage/ensure-bucket
GET  /api/v1/storage/objects
POST /api/v1/storage/objects
DELETE /api/v1/storage/objects
GET  /api/v1/storage/objects/download-url
GET  /api/v1/delivery-assets
POST /api/v1/delivery-assets
GET  /api/v1/delivery-assets/:id
PATCH /api/v1/delivery-assets/:id
DELETE /api/v1/delivery-assets/:id
GET  /api/v1/customer-success-plans
POST /api/v1/customer-success-plans
GET  /api/v1/customer-success-plans/:id
PATCH /api/v1/customer-success-plans/:id
DELETE /api/v1/customer-success-plans/:id
GET  /api/v1/customer-success-actions
POST /api/v1/customer-success-actions
GET  /api/v1/customer-success-actions/:id
PATCH /api/v1/customer-success-actions/:id
DELETE /api/v1/customer-success-actions/:id
GET  /api/v1/customer-success-opportunities
GET  /api/v1/customer-success-opportunities/analytics
POST /api/v1/customer-success-opportunities
GET  /api/v1/customer-success-opportunities/:id
POST /api/v1/customer-success-opportunities/:id/follow-up-actions
POST /api/v1/customer-success-opportunities/:id/close-won-adjustment
PATCH /api/v1/customer-success-opportunities/:id
DELETE /api/v1/customer-success-opportunities/:id
POST /runtime/conversations/respond-stream
```

## Frontend Reference Design

Reference-first frontend artifacts for the initial console shell are stored at:

```text
images/frontend-reference-design/web-console-shell/
images/frontend-reference-design/m01-console-foundation/
images/frontend-reference-design/m02-auth-tenant-user/
images/frontend-reference-design/m03-agent-configuration-center/
images/frontend-reference-design/m04-model-center/
images/frontend-reference-design/m05-prompt-center/
images/frontend-reference-design/m06-knowledge-center/
images/frontend-reference-design/m07-tool-center/
images/frontend-reference-design/m08-conversation-center/
images/frontend-reference-design/m09-monitor-center/
images/frontend-reference-design/m10-audit-center/
images/frontend-reference-design/m11-settings-center/
images/frontend-reference-design/m12-dashboard-operations/
images/frontend-reference-design/m13-conversation-streaming/
images/frontend-reference-design/m14-agent-resource-bindings/
images/frontend-reference-design/m15-agent-detail-runtime-test/
images/frontend-reference-design/m16-approval-center/
images/frontend-reference-design/m17-real-model-execution/
images/frontend-reference-design/m18-rag-citations/
images/frontend-reference-design/m19-hybrid-retrieval/
images/frontend-reference-design/m20-prompt-live-testing/
images/frontend-reference-design/m21-run-observability/
images/frontend-reference-design/m22-monitor-step-operations/
images/frontend-reference-design/m23-dashboard-step-operations/
images/frontend-reference-design/m24-minio-storage-center/
images/frontend-reference-design/m25-knowledge-minio-upload/
images/frontend-reference-design/m26-qdrant-vector-store/
images/frontend-reference-design/m26-opensearch-hybrid-retrieval/
images/frontend-reference-design/knowledge-background-tasks/
images/frontend-reference-design/deliveryassets/
images/frontend-reference-design/customer-success-plans/
images/frontend-reference-design/customer-success-actions/
images/frontend-reference-design/customersuccessopportunities/
images/frontend-reference-design/续约机会分析/
images/frontend-reference-design/续约机会跟进行动/
images/frontend-reference-design/续约机会成交入账/
```

Future frontend milestones should update this workspace or create a new one before implementing concrete pages.
