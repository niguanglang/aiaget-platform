# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a streaming enterprise conversation detail page.

Project context:
- Product/module: Enterprise Agent Platform, M13 Conversation Streaming
- Page/route: Conversation detail at `/conversations/[id]`
- Target users/roles: tenant operators and admins with write access to conversations
- Business goal: send a message and watch the assistant reply stream in real time while preserving operational traceability
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, Motion
- Existing page shell/layout: protected console with left navigation and topbar; keep the current conversation detail structure and density

Interface contract that must appear in the UI:
- Existing panels remain: message stream, run traces, feedback, references, tool-call summaries
- New streaming behavior: start state, incremental assistant text, in-progress status, graceful completion, stream error state
- Event types: `start`, `delta`, `done`, `error`
- Final completion state still resolves into persisted message history and run traces

Design requirements:
- Make it feel like a serious enterprise operator chat surface, not a consumer typing effect demo.
- Keep the current message stream layout but add a clear live assistant response area that can expand as chunks arrive.
- Use subtle progress language, cursor or pulse hints, and stable layout so the page does not jump.
- Preserve traceability: users should still understand that the final message becomes a persisted run with metadata.
- Use Chinese labels and operational tone.
- Overall style: minimal, technical, premium product UI with restrained motion and strong readability.

Avoid: flashy typing gimmicks, huge animated cursors, neon chat aesthetics, or redesigning unrelated panels.
