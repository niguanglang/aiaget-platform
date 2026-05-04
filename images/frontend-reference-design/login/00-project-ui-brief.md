# Project UI Brief

- Page/route: Login at `/login`.
- Feature goal: Rebuild the existing login page to match `images/login/参考图.png` 1:1 while using `images/login/背景图.png` as the page background slice.
- Users and permissions: unauthenticated enterprise tenant users; successful login enters the protected console according to the existing `next` query fallback.
- Existing frontend stack/design system: Next.js App Router, React, TypeScript, Tailwind CSS, React Hook Form, Zod, local shadcn-like `Input`, `Button`, `Card`, `AuthProvider`, lucide-react icons, motion/react.
- Route and parent layout: standalone App Router page `apps/web/src/app/login/page.tsx`; no console shell.
- API/service contract: `useAuth().login(input)` -> `loginRequest(input)` -> `POST /auth/login`.
- Main fields: `tenantCode`, `email`, `password`.
- Default development credentials: tenant code `default`, email `oss-admin-7f4c2a@local.invalid`, password `AIAgetDev!9sK4pQ7m`.
- Required states: client validation errors, server login error, disabled/submitting button, password visible/hidden toggle, suspense fallback.
- Visual constraints from reference: full-screen 1536 x 1024 composition, left brand header, large headline `让企业智能体安全协同`, subtitle `统一身份认证 · 工作流编排 · 数据权限治理`, four bottom capability cards, right translucent glass login panel, SSO separator and outline SSO button.
