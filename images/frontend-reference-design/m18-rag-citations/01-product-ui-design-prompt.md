# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise agent test surface with visible retrieval citations.

Project context:
- Product/module: Enterprise Agent Platform, M18 RAG Citations
- Page/route: Agent detail at `/agents/[id]`, with related citation visibility in conversation detail
- Target users/roles: tenant operators and admins verifying knowledge-grounded behavior
- Business goal: make retrieved context visible, scannable, and obviously tied to the current answer
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, Motion
- Existing page shell/layout: protected console shell with compact cards and operational density

Interface contract that must appear in the UI:
- inline agent conversation testing area
- latest run summary
- citation / reference preview block
- each citation should show:
  - source title
  - snippet
  - score
- conversation detail still has a references panel fed by the same stored data

Design requirements:
- Use Chinese labels only.
- Keep the citation UI compact and useful, not academic or document-heavy.
- Make it clear that citations came from bound knowledge, not arbitrary attachments.
- Preserve the current premium operator-console visual style.
