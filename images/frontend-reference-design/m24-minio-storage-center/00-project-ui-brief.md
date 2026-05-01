# Project UI Brief

- Project: AIAget Enterprise Agent Platform
- Page: M24 MinIO Storage Center
- Route: `/storage`
- Feature goal: connect to remote MinIO, create/manage the project bucket, provide tenant-scoped file management and storage settings
- Parent layout: protected console shell under `apps/web/src/app/(console)/storage/page.tsx`
- Target users: tenant operators and admins with storage permissions

## APIs and Services

- `GET /api/v1/storage/settings`
  - returns MinIO endpoint, console URL, bucket, masked access key, connection status and bucket status
- `POST /api/v1/storage/ensure-bucket`
  - creates or verifies the configured bucket
- `GET /api/v1/storage/objects`
  - query: `page`, `page_size`, `prefix`, `keyword`
  - returns tenant-scoped object list
- `POST /api/v1/storage/objects`
  - JSON upload with `file_name`, `folder`, `content_type`, `content_base64`
- `DELETE /api/v1/storage/objects`
  - query: `key`
- `GET /api/v1/storage/objects/download-url`
  - query: `key`
  - returns a short-lived download URL

## Entities and Fields

- `StorageSettings`
  - `provider`
  - `endpoint`
  - `console_url`
  - `bucket`
  - `region`
  - `access_key_masked`
  - `force_path_style`
  - `status`
  - `bucket_exists`
  - `last_checked_at`
  - `error_message`
- `StorageObjectItem`
  - `key`
  - `relative_key`
  - `file_name`
  - `folder`
  - `size_bytes`
  - `etag`
  - `last_modified`
- `StorageSummary`
  - `object_count`
  - `total_size_bytes`
  - `bucket_exists`
  - `status`

## Existing Components and Design System

- `Card`, `Button`, `EmptyState`, `MetricCard`, `StatusBadge`
- `ConsoleShell` navigation via `moduleSpecs`
- React Query for data fetching and mutations
- Tailwind CSS, lucide icons, motion/react

## Required States and Actions

- loading: settings and object list loading
- empty: no files in selected folder/search
- error: MinIO connection or upload failure
- success: bucket verified, list files, upload, delete, get download URL
- disabled: upload without selected file, actions while mutation is running
- settings: display endpoint, console URL, bucket, masked access key, force path style

## Constraints

- Visible UI copy must be Chinese.
- Do not expose MinIO password to the browser.
- Do not start or install middleware/container.
- Store files under tenant-scoped prefixes inside `aiaget-files`.
- No database schema change for this milestone.
