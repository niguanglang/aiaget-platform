# M01 Console Foundation

## Scope

M01 establishes the usable Web Console foundation:

1. Demo login with local session storage.
2. Protected console route shell.
3. Config-driven sidebar and mobile navigation.
4. Top bar with tenant, user, demo session, and logout.
5. API client with request ID and bearer token injection.
6. Dashboard health checks through the Control Plane.
7. Module page skeletons for future CRUD and detail views.

Real JWT, refresh token, tenant isolation, RBAC, database persistence, and audit logging start in M02.

## Routes

```text
/login
/dashboard
/agents
/prompts
/models
/knowledge
/tools
/conversations
/monitor
/audit
/settings
```

## API Contracts

```text
GET /api/v1/health
GET /api/v1/runtime/health
GET /runtime/health
```

The frontend dashboard uses `/api/v1/runtime/health`, not direct Runtime access, so the Web Console keeps the Control Plane boundary.

## Module Page Design

The page skeleton for each future module includes:

1. Title, description, status badges, and disabled primary action.
2. Metric strip.
3. Search/filter chips.
4. Table column design.
5. Empty state.
6. Row action design.
7. Detail page section design.

The source of truth is `apps/web/src/config/modules.ts`.

## Frontend Reference Design

Reference-first artifacts are stored in:

```text
images/frontend-reference-design/m01-console-foundation/
```

