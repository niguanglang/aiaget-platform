# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise conversation detail page and model test workflow that now use provider-backed model execution.

Project context:
- Product/module: Enterprise Agent Platform, M17 Real Model Execution
- Page/route: Conversation detail at `/conversations/[id]`, with supporting states visible in model center and agent inline testing
- Target users/roles: tenant admins and operators configuring real model providers and validating production-like conversations
- Business goal: make real model execution visible and trustworthy without redesigning the existing console
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style primitives, TanStack Query, Motion
- Existing page shell/layout: protected console shell with compact operational cards and dense but readable information hierarchy

Interface contract that must appear in the UI:
- conversation run cards clearly show the real `request_model`
- stream and run summary areas still fit the existing conversation detail layout
- inline agent test panel should look like a compact real-model sandbox
- model center test output should feel like a genuine provider-backed compatibility check, not a mock
- failure states should still show readable operator-facing messages
- fallback behavior should remain operationally understandable when no executable model is configured

Design requirements:
- Keep the UI calm, dense, and operational.
- Use Chinese labels only.
- Emphasize traceability: real model name, token counts, latency, cost-aware feel, and run status.
- Preserve the existing console aesthetic with restrained glass surfaces and thin borders.
- Avoid consumer chat styling or flashy AI visuals.
