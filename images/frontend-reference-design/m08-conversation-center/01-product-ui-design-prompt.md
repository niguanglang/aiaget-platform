# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS admin page.

Project context:
- Product/module: Enterprise Agent Platform, M08 Conversation Center
- Page/route: Conversation Center at `/conversations` with detail route `/conversations/[id]`
- Target users/roles: tenant operators and admins with `conversation.read` / `conversation.write`
- Business goal: browse conversation threads, start a new conversation with an Agent, continue chat, inspect runtime traces, review tool-call summaries, and leave feedback
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, React Hook Form, Zod, Motion
- Existing page shell/layout: protected console with left navigation and topbar; use dashboard/Bento layout with thin borders, subtle shadow, glass/backdrop blur, clean responsive density

Interface contract that must appear in the UI:
- APIs: list conversations; create conversation with first user message; get conversation detail; send conversation message; archive/delete conversation; create feedback
- Runtime interaction: response-driven chat with structured run trace, request model info, latency, token usage, references, and tool-call summaries
- Main fields: conversation title, Agent, user, status, message count, last message preview/time, messages, run steps, feedback, tool-call summary, references
- Status values: conversation ACTIVE, ARCHIVED; run SUCCESS, FAILED; message roles USER, ASSISTANT, SYSTEM, TOOL
- Actions: new conversation, continue chat, open detail, delete/archive, submit feedback, inspect run trace
- Required states: loading, empty, error, validation, disabled write actions, no Agents available, runtime failure, no references, no tool calls, no feedback

Design requirements:
- Make it look like a real production conversation operations console, not a consumer messenger or marketing page.
- First viewport should show metrics, filters, thread list, and a selected conversation preview/chat composer side panel.
- Use compact SaaS/admin density with thin borders, soft shadows, restrained blur, and strong hierarchy.
- Show clear operational surfaces:
  - thread inventory
  - selected message stream
  - structured run trace / metadata
  - feedback and reference panels
- Add subtle atmosphere only: faint grid/noise texture plus a low-opacity message-flow or signal pattern in the background.
- Use realistic Chinese labels, timestamps, message previews, and trace summaries; text must fit on desktop and mobile.
- Overall style: minimal, technical, premium product UI with deliberate spacing and high readability.

Avoid: giant chat bubbles, playful consumer-chat aesthetics, fake analytics charts unrelated to runtime, lorem ipsum, glowing neon, decorative blobs, or unreadable dense trace dumps.
