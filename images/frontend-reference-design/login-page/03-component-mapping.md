# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Login route shell | `apps/web/src/app/login/page.tsx` | Next.js App Router `/login` | Main layout rebuilt to match provided UI reference |
| Background atmosphere | `apps/web/src/components/auth/login-page-background.tsx` | visual only | Uses local background asset, subtle overlays, and R3F ambient scene |
| Brand/header region | `apps/web/src/app/login/page.tsx` | static product identity | Reuses lucide iconography and Tailwind layout primitives |
| Hero copy and trust pills | `apps/web/src/app/login/page.tsx` | auth module positioning | Maps reference left-panel messaging to actual auth scope |
| Bento capability cards | `apps/web/src/app/login/page.tsx` | JWT / RBAC / audit concepts from M02 | Product framing only, no invented actions |
| Glass login card | `apps/web/src/components/ui/card.tsx` + `apps/web/src/app/login/page.tsx` | existing card primitive | Extended with blur, border, and softer shadow |
| Form fields | `apps/web/src/components/ui/input.tsx` + local `LoginField` | `tenantCode`, `email`, `password` | Keeps `react-hook-form` + `zod` validation |
| Submit button | `apps/web/src/components/ui/button.tsx` | `POST /api/v1/auth/login` | Preserves submit and loading behavior |
| Auth flow | `apps/web/src/components/auth/auth-provider.tsx` | login, redirect, stored session | No API or redirect contract changes |
| Reference assets | `images/frontend-reference-design/login-page/` | provided PNG files | Stored for future visual iteration and comparison |
