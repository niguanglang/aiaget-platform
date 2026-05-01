# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS audit page.

Project context:
- Product/module: Enterprise Agent Platform, M10 Audit Center
- Page/route: Audit Center at `/audit`
- Target users/roles: tenant operators and admins with `audit.read`
- Business goal: inspect login attempts, write operations, security failures, and configuration changes
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, Motion
- Existing page shell/layout: protected console with left navigation and topbar; use dashboard/Bento layout with thin borders, subtle shadow, glass/backdrop blur, clean responsive density

Interface contract that must appear in the UI:
- APIs: audit overview, unified audit event list, audit event detail
- Data sources: login logs and operation logs
- Main fields: event ID, source type, status, user email, module, action, summary, request ID, occurred time
- Detail fields: IP address, user-agent, request summary, path, method, status code, error message
- Summary metrics: login logs, operations, security events, config changes, success rate
- Required states: loading, empty, error, no failures, detail fetch failure

Design requirements:
- Make it look like a real production audit console, not a BI dashboard or CRM feed.
- First viewport should show summary metrics, source/status/time filters, and a dense unified audit table.
- Use compact operational density with thin borders, soft shadows, restrained blur, and high text legibility.
- Show a selected-event detail panel with structured request context and redacted payload summary.
- Add supporting panels for top users, top modules, and recent failures.
- Use subtle background texture only, keeping the page serious and low-noise.
- Use realistic Chinese labels, timestamps, error summaries, and request metadata.
- Overall style: minimal, technical, premium product UI centered on traceability and accountability.

Avoid: playful list styling, fake security alerts, decorative charts, glowing UI, or invented audit fields.
