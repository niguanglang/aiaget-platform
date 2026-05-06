# Component Mapping

| Reference region | Existing/new component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Storage list route | `apps/web/src/app/(console)/storage/page.tsx`, `StorageContent` | `getStorageSettings`, `listStorageObjects` | List page only: metrics, filters, table, entry actions. |
| Storage settings route | `apps/web/src/app/(console)/storage/settings/page.tsx`, `StorageSettingsContent` | `StorageSettings`, `StorageEnsureBucketResult` | Owns bucket validation/create action and MinIO console link. |
| Storage upload route | `apps/web/src/app/(console)/storage/upload/page.tsx`, `StorageUploadContent` | `StorageObjectUploadInput`, `StorageObjectUploadResult` | Owns folder input, file picker, base64 upload and success detail link. |
| Storage object detail route | `apps/web/src/app/(console)/storage/objects/[...key]/page.tsx`, `StorageObjectDetailContent` | `StorageObjectItem`, download URL, delete mutation | Dynamic route outside sidebar menu; owns copy/download/delete confirmation. |
| Shared formatting/routing | `apps/web/src/components/storage/storage-shared.tsx` | `StorageConnectionStatus`, `StorageObjectItem` | Status labels, storage tone, byte/time formatting, detail href helper, storage invalidation. |
| Summary metrics | `MetricCard` | `StorageSummary` | Object count, total size, bucket status, connection status. |
| File table | `StorageContent` table | `StorageObjectItem[]` | Tenant-scoped relative keys only; row enters detail. |
| Feedback states | `EmptyState`, inline alerts, disabled buttons | query/mutation state | Loading, empty, error, success and pending states visible. |
| Menu seed | `apps/control-api/prisma/seed.ts` | `storage:object:view` | Static children: storage settings and upload. Object detail stays route-only. |
| Backend module | `apps/control-api/src/storage/*` | AWS S3-compatible MinIO client | No API/schema changes; no password returned to frontend. |
