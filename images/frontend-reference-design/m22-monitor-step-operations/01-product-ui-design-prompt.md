# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real SaaS admin page.

Project context:
- Product/module: AIAget Enterprise Agent Platform, monitor center
- Page/route: M22 Monitor Step Operations at `/monitor`
- Target users/roles: tenant operators and admins with monitor read permission
- Business goal: help operators see conversation run-step health, latency, token usage, and cost without opening every conversation detail
- Existing frontend stack/design system: Next.js App Router, React, Tailwind CSS, shadcn-style local primitives, lucide icons, motion/react
- Existing page shell/layout: protected console shell with left sidebar and topbar; page content is a dense dashboard layout, max width 7xl

Interface contract that must appear in the UI:
- API/service functions:
  - `getMonitorOverview({ window })`
  - `listMonitorEvents({ page, page_size, window, module, status, source_type, step_type, keyword })`
  - `getMonitorEvent(eventId)`
- Main entities and fields:
  - summary metrics: total events, success rate, average latency, p95 latency, total cost, active conversations
  - run-step summary: total steps, failed steps, average step latency, total tokens, total step cost, tool steps, knowledge steps, model steps
  - step breakdown: step type, step count, failed count, average latency, p95 latency, total tokens, total cost
  - event stream: trace id, module, source type, status, title, latency, tokens, cost, step type, occurred time
  - event detail: request payload, response payload, step payload, error message
- Status values/enums:
  - event status: SUCCESS, DEGRADED, FAILED
  - source type: operation, model_call, tool_call, knowledge_recall, conversation_run, conversation_step
  - step type: prompt, tool, knowledge, response
- User actions:
  - refresh data
  - search by trace/title/summary
  - filter by time window, module, status, source type, step type
  - select an event to inspect details
- Required states:
  - loading, empty, error, disabled, success, permission-denied where relevant

Design requirements:
- Make the page look like a production operations dashboard, not a marketing landing page.
- Use a Bento Grid / dashboard layout with clear hierarchy and enough spacing.
- Use thin borders, restrained soft shadows, subtle blur, and a light glass surface quality.
- Include a compact run-step operations band near the top with Chinese labels.
- Include a step breakdown card with horizontal bars or dense metric rows for prompt/tool/knowledge/response.
- Keep the unified event stream table as the operational anchor, with a detail panel on the right.
- Use Chinese visible copy.
- Use restrained motion-ready layout cues, but keep the image static.
- Keep colors clean and modern; avoid one-note purple/blue gradients, cheap glow, oversized round blobs, or overloaded information.

Avoid:
- fake API fields not listed above
- decorative 3D or gradient elements that obscure text
- unreadable tiny text
- random charts unrelated to latency, cost, tokens, or step failures
- invented write actions such as retry/delete/export
