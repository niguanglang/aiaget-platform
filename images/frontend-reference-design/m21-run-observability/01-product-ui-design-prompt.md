# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise conversation debug surface with step-level observability.

Project context:
- Product/module: Enterprise Agent Platform, M21 Run Observability
- Page/route: Conversation detail at `/conversations/[id]`, with matching compact visibility on agent inline testing
- Target users/roles: tenant operators and admins debugging agent execution quality
- Business goal: make model, retrieval, and tool phases directly inspectable without leaving the conversation surface
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, Motion
- Existing page shell/layout: protected console shell with dense operational cards and compact trace blocks

Interface contract that must appear in the UI:
- run summary:
  - model
  - token counts
  - latency
  - total cost
- step cards:
  - tool name and HTTP status
  - retrieval mode and hit count
  - model name and per-step cost
- compact but readable metric tags

Design requirements:
- Use Chinese labels only.
- Keep the observability UI dense, precise, and operational.
- Preserve the current conversation layout while making step metadata obvious.
