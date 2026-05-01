# Product Prototype / Wireframe Prompt

Create a product prototype / wireframe image for the same real frontend page.

Project context:
- Page/routes: knowledge document upload flow at `/knowledge` and `/knowledge/[id]`
- Users/roles: tenant admins and knowledge operators
- Main task flow: open knowledge base -> upload text/Markdown file -> original content stored in MinIO -> parsed text segmented -> inspect document row/detail/storage path -> reprocess or delete
- API/service contract: `POST /knowledge-bases/:id/documents`, `GET /knowledge-bases/:id`, `GET /knowledge-bases/:id/documents/:documentId`, `POST /documents/:documentId/reprocess`, `DELETE /documents/:documentId`
- Data entities and fields: document title, source type, MIME type, file name, size, `storage_path`, status, segment count, token count, uploader, timestamps, parsed text, tasks
- Actions and states: upload, select file, validate content, select document, copy/inspect storage path, reprocess, delete, loading, empty, error, disabled

Prototype requirements:
- Use low- to mid-fidelity wireframe style.
- Focus on layout regions and interaction flow rather than decoration.
- Show a right-side upload drawer with title/type/file picker/content preview.
- Show a document table column for storage path or storage source.
- Show a document detail card with storage path, parsed text preview, task list, and segment stats.
- Mark empty/error/loading/permission states with clear Chinese labels.
- Keep component boundaries obvious so implementation can map to existing cards, table, drawer, form fields, buttons, and badges.

Avoid:
- polished decorative rendering
- invented backend fields
- unrealistic navigation, batch actions, or external storage settings controls
