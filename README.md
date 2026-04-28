# Enterprise Agent Platform

Enterprise Agent Platform is a private-deployable platform for managing agents, models, prompts, knowledge bases, tools, conversations, audit logs, and runtime observability.

This repository is currently at **M05: Prompt Center**. It contains the monorepo foundation, protected Web Console shell, real JWT authentication, tenant context, user CRUD, RBAC foundation, login logs, operation logs, tenant-scoped Agent configuration with versioned publish workflows, model provider/configuration management with masked API keys and call logs, and prompt template management with variables, versions, rollback, render checks, and test records.

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
docker compose -f deploy/docker-compose.yml config
```

## Run Services

Start infrastructure:

```bash
docker compose -f deploy/docker-compose.yml up -d
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
```

Future frontend milestones should update this workspace or create a new one before implementing concrete pages.
