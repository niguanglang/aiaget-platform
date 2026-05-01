# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real SaaS admin dashboard page.

Project context:
- Product/module: AIAget Enterprise Agent Platform dashboard
- Page/route: M23 Dashboard Step Operations at `/dashboard`
- Target users/roles: tenant operators and admins
- Business goal: let operators see run-step health, latency, token usage, cost, and failure risk directly from the home dashboard, then drill down into the monitor center
- Existing frontend stack/design system: Next.js App Router, React, Tailwind CSS, shadcn-style local primitives, lucide icons, motion/react
- Existing page shell/layout: protected console shell with left sidebar and topbar; dashboard content uses metric tiles, cards, charts, and operational summary panels

Interface contract that must appear in the UI:
- API/service functions:
  - `getMonitorOverview({ window })`
  - `getAuditOverview({ window })`
  - monitor drilldown links to `/monitor?source_type=conversation_step&step_type=<type>`
- Main entities and fields:
  - dashboard summary metrics: active agents, running conversations, event volume, failed events, average latency, cost, retrieval calls, tool calls
  - run-step summary: total steps, failed steps, average step latency, total tokens, total step cost, model/tool/knowledge counts
  - run-step breakdown: step type, count, failed count, average latency, p95 latency, tokens, cost
  - existing health status, operation trend, incident, and ranking cards
- Status values/enums:
  - step type: prompt, tool, knowledge, model, response
  - service health: healthy, degraded, unavailable
- User actions:
  - refresh dashboard
  - switch time window
  - click run-step summary or type rows to open monitor with matching filters
- Required states:
  - loading, empty, error, disabled, success

Design requirements:
- Make it look like a production operational dashboard, not a marketing page.
- Use a Bento Grid / dashboard layout with clear hierarchy and dense but readable cards.
- Add a prominent but compact "运行步骤态势" card between health/trend and ranking/incident sections.
- Use thin borders, restrained soft shadows, subtle blur, and light glass surfaces.
- Use Chinese visible copy.
- Use icons from lucide style.
- Keep motion implied by staggered cards and smooth transitions, but static in the image.
- Keep charts and bars tied to real fields: step counts, failures, latency, tokens, and cost.

Avoid:
- fake fields or write actions not in the contract
- emoji, overdone gradients, cheap glow, decorative blobs, oversized circular elements
- unreadable tiny labels
- purely decorative charts unrelated to the listed fields
