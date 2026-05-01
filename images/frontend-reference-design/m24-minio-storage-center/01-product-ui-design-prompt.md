# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real SaaS admin page.

Project context:
- Product/module: AIAget Enterprise Agent Platform storage center
- Page/route: M24 MinIO Storage Center at `/storage`
- Target users/roles: tenant operators and admins
- Business goal: manage tenant-scoped files in MinIO and verify storage settings before knowledge-base ingestion uses object storage
- Existing frontend stack/design system: Next.js App Router, React, Tailwind CSS, shadcn-style local primitives, lucide icons, motion/react
- Existing page shell/layout: protected console shell with left sidebar and topbar, content uses compact dashboard cards and operational tables

Interface contract that must appear in the UI:
- API/service functions:
  - `getStorageSettings()`
  - `ensureStorageBucket()`
  - `listStorageObjects({ page, page_size, prefix, keyword })`
  - `uploadStorageObject(input)`
  - `deleteStorageObject(key)`
  - `getStorageDownloadUrl(key)`
- Main entities and fields:
  - settings: provider, endpoint, console URL, bucket, region, masked access key, force path style, status, bucket exists, last checked time, error message
  - summary: object count, total size, bucket status, connection status
  - object item: key, relative key, file name, folder, size, etag, last modified
- User actions:
  - verify/create bucket
  - open MinIO console
  - search by file name/key
  - filter by folder prefix
  - upload a selected file
  - download file
  - delete file
- Required states:
  - loading, empty, error, disabled, success, permission denied

Design requirements:
- Make it look like a production SaaS file operations page, not a generic template.
- Use a Bento Grid / dashboard layout: settings card, health/summary metrics, upload panel, file table, detail panel.
- Use thin borders, subtle shadows, backdrop blur and restrained product styling.
- Use Chinese visible copy.
- Keep information dense but readable; avoid oversized hero sections.
- Show storage security clearly: password hidden, access key masked, tenant prefix shown.

Avoid:
- fake fields not listed above
- exposing secret values
- decorative 3D that distracts from file operations
- overdone gradients, cheap glow, emoji, large round decorative blobs
