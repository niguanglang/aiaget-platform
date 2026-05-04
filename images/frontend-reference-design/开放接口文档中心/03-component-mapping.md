# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Console page shell | `apps/web/src/app/(console)/api-reference/page.tsx` | Static route under `ConsoleShell` | Keep URL `/api-reference`. |
| Old direct route | removed root `apps/web/src/app/api-reference/page.tsx` | Next route group preserves URL | Avoid duplicate route conflict. |
| Navigation entry | `apps/web/src/config/modules.ts`, `apps/web/src/config/navigation.ts`, `menu-navigation.ts`, Prisma seed menus | permission `system:api_key:view` | Add `api_reference` key and `BookOpen` icon. |
| Header/hero | `motion.section`, `StatusBadge`, `Button` | Real endpoint strings | Chinese copy, direct links to `/api-keys` and Swagger. |
| Metrics/quick facts | `MetricCard` | static contract counts | Endpoint count, auth methods, response trace, quota controls. |
| Endpoint and auth card | `Card`, code text, copy button | `POST /api/v1/external/agents/{agentId}/chat` | No network calls. |
| Schema tables | native tables inside `Card` | shared types `ExternalAgentChatInput/Response` | Request and response fields only. |
| Code samples | `<pre>`, copy button | curl and TypeScript fetch examples | No fake SDK. |
| API Key management list | `Card` | `/api-keys` endpoints | Mention JWT console permissions. |
| Security chain | `Card`, numbered cards | `ExternalApiKeyService` checks | Scope, allowlist, quota, ACL, audit. |
| Error table | native table | actual exception messages/status classes | Keep practical and concise. |
