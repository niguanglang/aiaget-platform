# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS operations dashboard.

Project context:
- Product/module: Enterprise Agent Platform, M12 Dashboard Operations
- Page/route: Dashboard at `/dashboard`
- Target users/roles: tenant operators and admins with dashboard access
- Business goal: provide a fast operational overview of health, latency, cost, activity, and failures
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, Motion
- Existing page shell/layout: protected console with left navigation and topbar; use dashboard/Bento layout with thin borders, subtle shadow, glass/backdrop blur, clean responsive density

Interface contract that must appear in the UI:
- APIs: control health, runtime health, monitor overview, audit overview
- Main metrics: total events, success rate, average latency, P95 latency, total cost, active conversations, login logs, operation logs, security events, config changes
- Secondary panels: latency trend, recent failures, top agents, top models, top tools, top knowledge recalls
- Required states: loading, error, degraded service, no failure samples, no rankings

Design requirements:
- Make it look like a real operations dashboard for a multi-module AI platform, not a generic analytics landing page.
- First viewport should show service health plus headline metrics immediately.
- Use compact but clear hierarchy with healthy spacing, restrained visual treatment, and real data-focused panels.
- Add subtle atmosphere only: light grid/noise texture, minimal abstract signal pattern behind content.
- Use realistic Chinese labels and serious operational tone.
- Overall style: minimal, technical, premium product UI optimized for scanning and triage.

Avoid: decorative BI charts, fake KPIs, purple dashboards, marketing hero layout, and placeholder copy.
