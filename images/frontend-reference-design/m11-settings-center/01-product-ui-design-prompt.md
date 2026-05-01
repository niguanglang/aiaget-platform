# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS settings page.

Project context:
- Product/module: Enterprise Agent Platform, M11 Settings Center
- Page/route: Settings Center at `/settings`
- Target users/roles: tenant admins and operators with read/write permissions scoped by tenant, user, and API key actions
- Business goal: review tenant profile, manage users and roles, issue machine API keys, and inspect basic security posture
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, React Hook Form, Zod, Motion
- Existing page shell/layout: protected console with left navigation and topbar; use dashboard/Bento layout with thin borders, subtle shadow, glass/backdrop blur, clean responsive density

Interface contract that must appear in the UI:
- APIs: tenant detail/update, users CRUD, roles list, tenant API keys list/create/delete
- Main fields: tenant name/code/status, user identity/status/roles/last login, role description and permission count, API key name/prefix/status/expiry/last used
- Actions: edit tenant profile, create/edit/delete user, create/delete API key, inspect roles
- Required states: loading, empty, error, validation, disabled write actions, permission-denied, one-time secret reveal after key creation

Design requirements:
- Make it look like a real production admin settings console, not a profile page.
- First viewport should show tenant summary, key metrics, and the user management surface.
- Add secondary panels for roles and API keys with enough density for operational use.
- Use restrained visual language, clear grouping, and stable table/card sizing.
- Show one-time API key reveal in a secure, deliberate way that fits the product UI language.
- Use realistic Chinese labels and practical operations-focused copy.
- Overall style: minimal, technical, premium product UI centered on maintenance and access control.

Avoid: onboarding-style layouts, decorative illustrations, fake toggles unrelated to real APIs, and security-themed visual gimmicks.
