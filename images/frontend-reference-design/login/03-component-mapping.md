# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/login/page.tsx` | Next.js App Router `/login` | Standalone full-screen page; no console shell. |
| Background slice | `apps/web/src/components/auth/login-page-background.tsx` + `apps/web/public/images/login/reference-background.png` | User-provided `images/login/背景图.png` | Pure static image background with subtle light overlays. |
| Brand block | `BrandMark` in `page.tsx` | Product metadata only | Recreates shield mark and `企业 AI Agent 平台` text from reference. |
| Left value proposition | `DesktopLoginLayout` / `MobileLoginLayout` | Static product copy | Uses exact reference headline/subtitle. |
| Capability cards | `featureCards` in `page.tsx` | Static UI copy | Uses lucide icons for 安全可信、多智能体协作、权限审计、私有化部署. |
| Login card | local `Card` in `page.tsx` | Route visual shell | Glass panel with inner border and backdrop blur. |
| Login form fields | `LoginField` + local `Input` | `LoginInput.tenantCode/email/password` | Labels are reference-facing: 企业域名、账号、密码; maps to existing request fields. |
| Submit action | local `Button` | `useAuth().login` -> `POST /auth/login` | Keeps redirect to `next` or `/dashboard`. |
| Password visibility | `Eye` / `EyeOff` button | password input state | Pure client-side visibility toggle. |
| Error/loading states | `LoginFormFallback`, validation spans, server error panel | React Hook Form/Zod, `ApiClientError` | Preserves validation and server failure feedback. |
| Secondary actions | text buttons + outline SSO `Button` | no current backend contract | Visual-only placeholders to match reference. |
