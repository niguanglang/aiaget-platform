# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/app/(console)/storage/page.tsx` and `StorageContent` | protected console route | New console module, same parent shell. |
| Navigation | `apps/web/src/config/modules.ts`, `navigation.ts` | `storage.read` permission | Add storage module entry and icon. |
| Settings panel | `StorageContent` local section | `StorageSettings` | Shows endpoint, console URL, bucket, region, masked access key. |
| Summary metrics | `MetricCard` | `StorageSummary` | Object count, total size, bucket status, connection status. |
| Upload panel | `StorageContent` local upload form | `StorageObjectUploadInput` | File converted to base64 JSON for API upload. |
| File table | `StorageContent` table | `StorageObjectItem[]` | Tenant-scoped relative keys only. |
| Actions | `Button` + React Query mutations | ensure bucket, upload, delete, download URL | Keep destructive delete confirmation inline. |
| Backend module | `apps/control-api/src/storage/*` | AWS S3-compatible MinIO client | Uses env config; no password returned to frontend. |
| Feedback states | `EmptyState`, inline errors, disabled buttons | query/mutation state | Loading, empty and error states visible. |
