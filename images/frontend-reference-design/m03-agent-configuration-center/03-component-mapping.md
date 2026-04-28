# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Agents list route | `apps/web/src/app/(console)/agents/page.tsx` | `GET /api/v1/agents` | Replace generic placeholder with real Agent list. |
| Agent detail route | `apps/web/src/app/(console)/agents/[id]/page.tsx` | `GET /api/v1/agents/:id` | New detail route. |
| API client | `apps/web/src/lib/api-client.ts` | Agent DTO shared types | Add agent categories, CRUD, version/publish/rollback/disable/archive calls. |
| List metrics | `MetricCard` | list response items | Total, published, draft, disabled from current query/page. |
| Status display | `StatusBadge` | Agent status enum | Map DRAFT/TESTING/PENDING/PUBLISHED/DISABLED/ARCHIVED to tones. |
| Create/edit panel | new `agents-content.tsx` | `POST /agents`, `PATCH /agents/:id` | React Hook Form + Zod validation. |
| Delete confirmation | new `agents-content.tsx` | `DELETE /agents/:id` | Soft delete. |
| Detail configuration | new `agent-detail-content.tsx` | Agent detail response | Basic info, runtime config, bindings, versions, audit. |
| Version actions | `agent-detail-content.tsx` | version/publish/rollback APIs | Publish creates immutable snapshot. |
| Backend Prisma | `apps/control-api/prisma/schema.prisma` | M03 tables | agent, agent_version, agent_category, binding tables, publish channel, audit log. |
| Backend module | `apps/control-api/src/agents/*` | Agent services/controllers/DTOs | Tenant scoped, RBAC guarded. |
