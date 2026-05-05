# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: Enterprise Agent Platform Web Console
- Page/route: Login Responsive at `/login`
- Target users/roles: tenant administrators and enterprise operators
- Business goal: sign users into the private-deployed AI agent control console with tenant code, email, and password.
- Existing frontend stack/design system: Next.js App Router, React, Tailwind CSS, lucide-react icons, local `Button`, `Input`, `Card`, and `LoginPageBackground` components.
- Existing page shell/layout: standalone auth page, no console sidebar/topbar, background image from `/images/login/reference-background.png`.

Interface contract that must appear in the UI:
- API/service functions: `useAuth().login({ tenantCode, email, password })`; safe redirect to `next` query param or `/dashboard`.
- Main fields: enterprise domain/tenant code, account email, password with visibility toggle.
- User actions: submit login, forgot password, request trial, enterprise SSO placeholder.
- Required states: field validation, server error alert, submitting/disabled button, loading fallback.

Design requirements:
- Make it look like a production enterprise SaaS/admin login page, quiet and operational rather than marketing-heavy.
- Show responsive intent in the design: desktop has a balanced two-column brand area plus login card; tablet compresses gracefully; mobile is a single-column scrollable form.
- Keep text within containers at all viewport sizes and avoid fixed viewport-height clipping.
- Use the existing blue/white glass style sparingly, with high form contrast and stable control heights.
- Keep feature cards secondary to the sign-in workflow and allow them to wrap or hide on narrow screens.

Avoid:
- invented fields or unrelated modules
- decorative UI that cannot map to the existing components
- tiny unreadable text, overlapping content, fixed-width cards, or clipped short-screen layouts
