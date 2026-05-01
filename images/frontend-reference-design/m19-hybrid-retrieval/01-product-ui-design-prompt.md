# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise knowledge detail page with visible hybrid retrieval scoring.

Project context:
- Product/module: Enterprise Agent Platform, M19 Hybrid Retrieval
- Page/route: Knowledge detail at `/knowledge/[id]`
- Target users/roles: tenant operators and admins evaluating retrieval quality and grounding readiness
- Business goal: make vector and hybrid retrieval understandable and inspectable without adding a separate search lab page
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, Motion
- Existing page shell/layout: protected console shell with dense data tables, compact cards, and operational controls

Interface contract that must appear in the UI:
- retrieval tester with:
  - query
  - mode selector
  - top K
  - result cards
- result cards show:
  - title
  - total score
  - keyword score
  - vector score
- segment cards show:
  - vector/index status
  - embedding model
  - keywords

Design requirements:
- Use Chinese labels only.
- Keep the retrieval scoring UI compact and technical.
- Make it clear that hybrid retrieval combines two signals.
- Preserve the existing product look: thin borders, soft shadow, quiet operator styling.
