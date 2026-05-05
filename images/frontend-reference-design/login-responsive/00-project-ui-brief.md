# Project UI Brief

- Project: Enterprise Agent Platform Web Console
- Page: Login Responsive
- Route: `/login`
- Feature goal: make the existing login page dynamically adapt across desktop, laptop, tablet, and mobile viewports without changing authentication behavior.
- Target users: tenant administrators and enterprise operators who need to sign in to the private-deployed control console.
- APIs/services: `useAuth().login(values)` from `apps/web/src/components/auth/auth-provider.tsx`; redirect uses `next` search param when it is a safe relative path, otherwise `/dashboard`.
- Entities/fields/statuses: `tenantCode`, `email`, `password`; client validation via `loginSchema`; server errors displayed from `ApiClientError`; submit state disables the primary login button.
- Existing components/design system: Next.js App Router, Tailwind CSS tokens, lucide-react icons, local `Button`, `Input`, `Card`, and `LoginPageBackground`.
- Required states: loading fallback for Suspense, validation errors per field, disabled/submitting button, server error alert, password visibility toggle, SSO action placeholder.
- Layout constraints: desktop should keep the brand/value proposition and login card in a balanced two-column layout; medium viewports should compress into a readable stacked or narrower two-column layout; mobile should be single-column, scrollable, and avoid clipped text or fixed-size controls.
- Responsive risks to avoid: fixed `h-screen` clipping short laptop screens, duplicate desktop/mobile implementations drifting apart, oversized text or rounded cards on small screens, feature cards crowding the form, and background art reducing form contrast.
