# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Auth route shell | `apps/web/src/app/login/page.tsx` | Next route `/login` | Keep standalone page inside `AuthProvider`. |
| Background art | `apps/web/src/components/auth/login-page-background.tsx` | static image `/images/login/reference-background.png` | Make opacity/position responsive through className support. |
| Brand mark | `BrandMark` in `apps/web/src/app/login/page.tsx` | static product identity | Keep lucide `Atom`, scale icon/text responsively. |
| Login card | local `Card` component | standalone auth surface | Use responsive width, padding, radius, and blur; avoid viewport clipping. |
| Form fields | local `Input` + `LoginField` | `loginSchema`, `LoginFormValues` | Preserve labels, validation, autocomplete, icons, password toggle. |
| Submit and secondary actions | local `Button` | `useAuth().login`, `router.replace` | Preserve disabled/submitting/server-error behavior. |
| Feature cards | `featureCards` array | static value props | Wrap across breakpoints and become compact cards on narrow screens. |
| Validation/testing | `pnpm --filter @aiaget/web typecheck`, browser request/screenshots | route and build types | Verify mobile, tablet, desktop viewports. |
