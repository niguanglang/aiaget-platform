# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS admin page.

Project context:
- Product/module: Enterprise Agent Platform, M07 Tool Center
- Page/route: Tool Center at `/tools` with detail route `/tools/[id]`
- Target users/roles: tenant admins and tool operators with `tool.read` / `tool.write`
- Business goal: manage tenant HTTP tools, configure request and auth rules, validate schemas, run live test calls, inspect call logs, and view Agent bindings
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, React Hook Form, Zod, Motion
- Existing page shell/layout: protected console with left navigation and topbar; use dashboard/Bento layout with thin borders, subtle shadow, glass/backdrop blur, clean responsive density

Interface contract that must appear in the UI:
- APIs: list/create/update/delete/copy/enable/disable tool; get tool detail; test tool execution
- Main fields: tool name/code/type/method/url/status/risk level/timeout/require approval/auth type/headers/schema summary/updated time
- Detail fields: request headers, auth config, input JSON schema, output JSON schema, latest call logs, request preview, response preview, response status, latency, agent references
- Status values: tool ACTIVE, DISABLED, DELETED; call SUCCESS, FAILED, APPROVAL_REQUIRED; risk LOW, MEDIUM, HIGH; auth NONE, BEARER, API_KEY_HEADER, API_KEY_QUERY, BASIC
- Actions: new tool, edit, copy, enable, disable, delete, open detail, run test, load sample payload
- Required states: loading, empty, error, validation, disabled write actions, permission-denied, invalid schema, approval-required test result, upstream failure, no call logs

Design requirements:
- Make it look like a real production operations console for HTTP tools, not a marketing page.
- First viewport should show metrics, filters, a tools table, and a selected test panel or summary rail.
- Use a compact SaaS/admin density with thin borders, soft shadows, restrained blur, and calm hierarchy.
- Show a strong operational split: tool inventory on the left, selected execution/test surface on the right, with detail route areas for config, schemas, auth, risk policy, logs, and agent references.
- Add subtle atmosphere only: a faint grid/noise texture plus a low-opacity network or signal background motif; it must stay behind content.
- Use realistic Chinese labels and table densities; text must fit on desktop and mobile.
- Show request/response previews, code-like schema blocks, and risk/approval tags without making the page look like an IDE.
- Overall style: minimal, technical, premium product UI with clear hierarchy and quiet confidence.

Avoid: invented fields, fake analytics charts unrelated to tools, glowing neon, decorative blobs, oversized hero sections, lorem ipsum, or generic developer-console clichés.
