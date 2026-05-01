# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise approval operations page.

Project context:
- Product/module: Enterprise Agent Platform, M16 Approval Center
- Page/route: Approval center at `/approvals`
- Target users/roles: tenant admins and operators who review high-risk tool execution requests
- Business goal: inspect pending high-risk tool calls and decide approve or reject with full request context
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, Motion, Lucide icons
- Existing page shell/layout: protected console shell with sidebar, topbar, metric strip, data table, and right-side detail panel

Interface contract that must appear in the UI:
- metrics for:
  - pending approvals
  - approved
  - rejected
  - runtime pending
  - test pending
- approval queue filters:
  - keyword
  - approval status
  - trigger source
- list row fields:
  - created time
  - tool
  - source
  - approval status
  - execution status
  - requester
  - context
- detail panel fields:
  - tool
  - conversation
  - agent
  - requester
  - reviewer
  - request method
  - request URL
  - response status
  - request/response headers and body previews
  - reason
  - decision note input
  - approve and reject actions

Design requirements:
- Make it look like a serious operations console, not a generic kanban or inbox mockup.
- Use Chinese labels only.
- Keep the list dense enough for queue handling but maintain readability.
- The right-side detail panel should feel like a high-trust review workspace with clear state badges and code-like payload previews.
- Use restrained glass surfaces, thin borders, soft shadows, and crisp data hierarchy.
- Visual direction: minimal, technical, premium, product-grade operational UI.

Avoid:
- decorative dashboards unrelated to the approval task
- fake charts or fake risk scores
- cluttered badge stacks
- marketing-style layouts
