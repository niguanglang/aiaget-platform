# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise agent detail page with an inline runtime test panel.

Project context:
- Product/module: Enterprise Agent Platform, M15 Agent Detail Runtime Test
- Page/route: Agent detail at `/agents/[id]`
- Target users/roles: tenant admins and operators testing agent behavior during configuration
- Business goal: let operators send real messages to the current agent directly on the detail page, inspect the latest run, and jump into the full conversation thread when needed
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, Motion, Lucide icons
- Existing page shell/layout: protected console shell with sidebar, topbar, agent header, binding cards, version list, audit timeline

Interface contract that must appear in the UI:
- A `会话测试` panel embedded on `/agents/[id]`
- Empty state before the first message
- Composer for the first test message
- After a thread exists:
  - conversation status
  - latest run status
  - message count
  - scrollable message stream
  - latest run summary with tokens, latency, and recent steps
  - latest tool call summary with approval-required state if present
  - actions for `打开完整会话` and `新建线程`
- Required states:
  - loading previous thread
  - creating first thread
  - streaming follow-up reply
  - error banner
  - disabled without permission

Design requirements:
- Make it feel like a real operator-grade testing surface, not a chat toy.
- Use Chinese labels only.
- Keep the panel compact enough to live beside the version card, while still making the message stream easy to scan.
- Use restrained glass surfaces, subtle borders, soft shadow, and operational typography.
- Emphasize hierarchy: panel header, status strip, mini metrics, message stream, run summary, tool summary, composer.
- Support a calm, premium SaaS feel with clear state feedback and no visual noise.
- The message area should feel active and usable but not dominate the whole page.

Avoid:
- consumer chat aesthetics
- oversized bubbles
- fake charts
- invented fields outside the real conversation contract
- heavy glow, emoji, or decorative hero treatment
