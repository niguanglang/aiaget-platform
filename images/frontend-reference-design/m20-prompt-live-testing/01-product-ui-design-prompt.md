# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise prompt template testing surface that now runs against a real model.

Project context:
- Product/module: Enterprise Agent Platform, M20 Prompt Live Testing
- Page/route: Prompt detail at `/prompts/[id]`
- Target users/roles: tenant admins and operators validating prompt behavior before binding it to agents
- Business goal: make prompt test output feel like a real model-backed experiment, not a render-only placeholder
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, Motion
- Existing page shell/layout: protected console shell with editor, side detail cards, and compact testing panel

Interface contract that must appear in the UI:
- rendered prompt preview
- live test result with:
  - status
  - latency
  - provider name
  - request model
  - output text
- recent test history cards with the same provider/model metadata

Design requirements:
- Use Chinese labels only.
- Keep the testing UI compact, technical, and operational.
- Preserve the current prompt page structure while making real execution obvious.
