# Product UI Design Image Prompt

Create a high-fidelity product UI design image for an enterprise SaaS admin page.

Project context:
- Product/module: Enterprise Agent Platform, M06 Knowledge Center
- Page/route: Knowledge Center at `/knowledge` with detail route `/knowledge/[id]`
- Target users/roles: tenant admins and knowledge operators with `knowledge.read` / `knowledge.write`
- Business goal: manage tenant knowledge bases, upload TXT/Markdown documents, inspect generated chunks, run retrieval tests, monitor processing tasks, and see Agent references
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, TanStack Query, React Hook Form, Zod, Motion
- Existing page shell/layout: protected console with left navigation and topbar; use dashboard/Bento layout with thin borders, subtle shadow, glass/backdrop blur, clean responsive density

Interface contract that must appear in the UI:
- APIs: list/create/update/delete knowledge bases; upload document; get document detail; update/delete/reprocess document; retrieval test; rebuild index
- Main fields: knowledge base name/code/visibility/status/description/owner, document count, segment count, failed task count, updated time, document title/type/size/status/segment count/uploader, segment content/token count/keywords/vector status, retrieval query/mode/topK/results/latency
- Status values: knowledge base ACTIVE, DISABLED, ARCHIVED; document PENDING, PROCESSING, READY, FAILED, DELETED; task PENDING, RUNNING, SUCCESS, FAILED; retrieval VECTOR, KEYWORD, HYBRID
- Actions: new knowledge base, edit, upload document, reprocess, rebuild index, retrieval test, delete, open detail
- Required states: loading, empty, error, validation, disabled write actions, success, permission-denied, failed processing

Design requirements:
- Make it look like a real production knowledge operations console, not a marketing page.
- First viewport should show metrics, filters, knowledge base table, and a selected retrieval/test side panel.
- Use Tailwind-compatible visual language: responsive Bento grid, thin border cards, soft shadow, backdrop blur, subtle border contrast, and a faint grid/noise texture.
- Add a restrained gradient mesh and a low-opacity 3D particle field or fine wire geometry in the background; it must stay behind content and never compete with tables or forms.
- Include a detail/editor feel for document chunks and retrieval references: document rows, chunk cards, processing task timeline, recall logs, and agent reference cards.
- Add understated Motion-style interaction cues: hover feedback on rows/actions, staggered table reveal, smooth drawer/modal transitions, and calm state changes.
- Use realistic operational text and table densities; text must fit on desktop and mobile.
- Overall style: minimal, technical, premium product UI, strong hierarchy, clean whitespace, no visual noise.

Avoid: invented fields, oversized hero sections, fake analytics charts unrelated to retrieval, unreadable tiny text, cheap glow, emoji, overdone gradients, large rounded blobs, decorative circles, crowded cards.
