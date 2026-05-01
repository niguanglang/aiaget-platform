# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/tools/page.tsx` | Console layout | Replace placeholder shell with real list page. |
| Detail route | `apps/web/src/app/(console)/tools/[id]/page.tsx` | `GET /tools/:id` | New detail route for dense config and logs. |
| Background atmosphere | `tool-center-background.tsx` | visual only | Reuse current console language with subtle signal/grid motif. |
| Metrics | `MetricCard` | tool list aggregate | Tools, enabled, calls today, failure rate. |
| Status chips | `StatusBadge` | tool/call/risk state | Map enabled/success to healthy, disabled/high-risk attention to degraded/planned. |
| Toolbar/search/filter | new `tool-content.tsx` | list query params | Keyword, type, status, risk level. |
| Tool table | new `tool-content.tsx` | `ToolListItem` | Name/code, method/url, type, risk, status, updated, actions. |
| Create/edit drawer | new `tool-form-panel.tsx` | create/update DTO | React Hook Form + Zod; JSON textareas for headers/auth/schema. |
| Selected quick-test panel | new `tool-content.tsx` | tool detail + test API | Request payload, sample loader, latest result summary, open detail. |
| Detail summary | new `tool-detail-content.tsx` | `ToolDetail` | Method, URL, timeout, auth type, risk, status, usage counts. |
| HTTP config section | `tool-detail-content.tsx` | tool detail fields | Request method, URL, timeout, default headers. |
| Schema sections | `tool-detail-content.tsx` | `input_schema`, `output_schema` | Preformatted JSON blocks and validation hints. |
| Auth config section | `tool-detail-content.tsx` | `auth_type`, `auth_config` | Show write-only secret placeholders safely. |
| Risk policy section | `tool-detail-content.tsx` | `risk_level`, `require_approval` | High-risk approval placeholder surfaced here. |
| Test panel | `tool-detail-content.tsx` | `POST /tools/:id/test` | Input JSON textarea, run button, request/response preview, approval state. |
| Call logs | `tool-detail-content.tsx` | `ToolCallLogItem[]` | Latest 20 rows with status, HTTP code, latency, error. |
| Agent references | `tool-detail-content.tsx` | derived `AgentToolBinding` rows | Read-only list of bound agents. |
| Delete confirmation | local modal pattern | delete API | Keep destructive action explicit. |
| Backend module | `apps/control-api/src/tools/*` | M07 APIs | New tenant-scoped Tools module with real HTTP test boundary. |
| Shared contracts | `packages/shared-types/src/index.ts` | list/detail/test input/result | Preserve route and type contracts across frontend/backend. |
