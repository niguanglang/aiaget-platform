# Project UI Brief

- Project: AIAget Enterprise Agent Platform
- Page group: M24 MinIO Storage Center IA split
- Routes: `/storage`, `/storage/settings`, `/storage/upload`, `/storage/objects/[...key]`
- Feature goal: split the previous storage all-in-one page into focused production console pages for tenant-scoped object listing, storage settings, file upload, and object detail operations.
- Parent layout: protected console shell under `apps/web/src/app/(console)/storage/*`
- Target users: tenant operators and admins with storage object view/manage permissions

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

- loading: settings, object list and object lookup loading
- empty: no files in selected folder/search, object not found
- error: MinIO connection, object list, upload, delete or download URL failure
- success: bucket verified, list files, upload, delete, get download URL
- disabled: upload without selected file, bucket verification while pending, destructive action while pending
- settings: display endpoint, console URL, bucket, masked access key, force path style
- routing: list rows navigate to object detail, upload success links to detail, settings/upload have static menu entries

## Page Responsibilities

- `/storage`
  - List page only: overview metrics, keyword/prefix filters, object table, route entry actions to settings/upload/detail.
  - Must not contain upload form, bucket initialization mutation, delete confirmation, or full object detail panel.
- `/storage/settings`
  - Configuration page: storage connection status, endpoint, console URL, bucket, masked access key, validation and bucket creation.
  - Owns `getStorageSettings()` and `ensureStorageBucket()`.
- `/storage/upload`
  - Form page: folder input, file picker, selected file preview, upload mutation and success detail entry.
  - Owns `uploadStorageObject(input)`.
- `/storage/objects/[...key]`
  - Detail page: object lookup, full metadata, copy path, download URL, delete confirmation.
  - Owns `listStorageObjects`, `getStorageDownloadUrl(key)` and `deleteStorageObject(key)`.

## Constraints

- Visible UI copy must be Chinese.
- Do not expose MinIO password to the browser.
- Do not start or install middleware/container.
- Store files under tenant-scoped prefixes inside `aiaget-files`.
- No database schema change for this milestone.
- Do not add object detail dynamic routes to the left menu; only static list/settings/upload routes belong in seed data.
