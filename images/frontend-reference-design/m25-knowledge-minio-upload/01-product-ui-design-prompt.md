# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: AIAget Enterprise Agent Platform, Knowledge Center
- Page/route: knowledge document upload and detail flow at `/knowledge` and `/knowledge/[id]`
- Target users/roles: tenant operators and admins with `knowledge.read` and `knowledge.write`
- Business goal: let operators upload text/Markdown knowledge documents, persist the original source file to MinIO, then inspect parsed text, segment status, and object storage path
- Existing frontend stack/design system: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components, lucide icons, React Query, motion/react
- Existing page shell/layout: enterprise console with left navigation, top bar, centered max-width dashboard layout, cards, tables, side panels

Interface contract that must appear in the UI:
- API/service functions: `uploadKnowledgeDocument`, `getKnowledgeBase`, `getKnowledgeDocument`, `reprocessKnowledgeDocument`, `deleteKnowledgeDocument`
- Main entities and fields: knowledge document title, source type, MIME type, file name, file size, `storage_path`, status, segment count, token count, uploader, updated time, parsed text, processing tasks
- Status values/enums: `PENDING`, `PROCESSING`, `READY`, `FAILED`, `DELETED`
- User actions: upload document, choose local file, edit title/source type, inspect storage path, select document, reprocess, delete, view parsed text and segments
- Required states: loading, empty, error, validation, disabled, success, permission-denied where relevant

Design requirements:
- Make it look like a production enterprise SaaS console, not a template.
- Use Bento/Dashboard layout with document table, upload drawer, document detail card, and storage metadata row.
- Show the primary workflow clearly: choose file -> confirm title/type -> upload to MinIO -> process into segments -> show storage path and status.
- Include realistic table rows, badges, storage object path, upload validation, and disabled pending button state.
- Keep visual language minimal, technical, clean, with subtle borders, soft shadows, light glass surfaces, and restrained motion cues.
- Use Chinese UI copy for all visible interface text except product names like MinIO.

Avoid:
- fake fields not listed above
- decorative UI that cannot map to the existing components
- unreadable tiny text, random charts, or marketing hero composition
- overdone gradients, cheap glow, emojis, large rounded blobs, dense clutter
