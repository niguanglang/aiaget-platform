# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Root app layout | `apps/web/src/app/layout.tsx` | Next.js App Router | Keep minimal root HTML/body; authenticated shell lives in route group. |
| Login page | `apps/web/src/app/login/page.tsx` | Local demo session until M02 auth API | Add validation and disabled state; no fake backend auth. |
| Protected route shell | `apps/web/src/app/(console)/layout.tsx` | Local session guard | Client-side guard redirects to `/login`; M02 will replace with JWT auth/me. |
| Sidebar navigation | `apps/web/src/config/navigation.ts`, `apps/web/src/components/layout/sidebar.tsx` | `ConsoleNavItem` config | Config-driven so RBAC filtering can be added later. |
| Top bar | `apps/web/src/components/layout/topbar.tsx` | Demo session, health summary | Includes tenant/user area, search placeholder, logout. |
| API client | `apps/web/src/lib/api-client.ts` | `HealthResponse`, request id/error shape | Inject local demo token and request id. |
| Session handling | `apps/web/src/lib/session.ts`, `apps/web/src/components/auth/auth-provider.tsx` | Demo session model | Stores local session only for M01. |
| Dashboard health cards | `apps/web/src/components/dashboard/service-health-card.tsx` | `GET /api/v1/health`, `GET /api/v1/runtime/health` | Loading/error/healthy/degraded/unavailable states. |
| Dashboard metrics/trend | `apps/web/src/app/(console)/dashboard/page.tsx` | Mock preview only | Must clearly mark as preview data. |
| Module placeholder pages | `apps/web/src/app/(console)/<route>/page.tsx` and shared `module-page-shell.tsx` | Route/module metadata only | Includes future list CRUD fields, empty state, disabled primary action. |
| Control API health | `apps/control-api/src/health.controller.ts` | `HealthResponse` | Already exists. |
| Runtime health proxy | `apps/control-api/src/runtime-health.controller.ts` | Runtime `HealthResponse` | UI calls Control API proxy to preserve frontend boundary. |
| Runtime direct health | `apps/agent-runtime/app/main.py` | `HealthResponse` | Already exists for service verification. |
