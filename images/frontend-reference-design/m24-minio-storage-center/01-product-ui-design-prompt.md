# Product UI Design Image Prompt

Create a high-fidelity product UI design image set for real SaaS admin pages.

Project context:
- Product/module: AIAget Enterprise Agent Platform storage center
- Page/routes: M24 MinIO Storage Center split into `/storage`, `/storage/settings`, `/storage/upload`, `/storage/objects/[...key]`
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
- Make the pages look like production SaaS file operations screens, not a generic template.
- Show four page concepts in one image or as a coherent reference board:
  - `/storage`: compact overview metrics, search/filter toolbar, object table, top actions for settings/upload, row action to detail.
  - `/storage/settings`: connection settings card, bucket health, validation/create bucket action, open console action.
  - `/storage/upload`: upload form with folder input, file picker, selected file preview, disabled/uploading/success states.
  - `/storage/objects/[...key]`: metadata detail, copy path, download action, destructive delete confirmation.
- Use Bento/Grid composition for each page, but keep responsibilities separate across routes.
- Use thin borders, subtle shadows, backdrop blur and restrained product styling.
- Use Chinese visible copy.
- Keep information dense but readable; avoid oversized hero sections.
- Show storage security clearly: password hidden, access key masked, tenant prefix shown.
- Use restrained motion cues for hover feedback and route-level card reveal; no decorative scene should compete with tables/forms.

Avoid:
- fake fields not listed above
- exposing secret values
- placing upload/settings/delete confirmation inside the list page
- adding the dynamic object detail route to the sidebar menu
- decorative 3D that distracts from file operations
- overdone gradients, cheap glow, emoji, large round decorative blobs
