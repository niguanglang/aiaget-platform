# M24 MinIO Storage Center

## Scope

M24 connects the platform to the remote MinIO service and adds a tenant-scoped file storage center before continuing with other modules.

Configured storage:

```text
Provider: MinIO
Endpoint: http://127.0.0.1:9000
Console: http://127.0.0.1:9001
Bucket: aiaget-files
Object prefix: tenants/<tenant_id>/
```

This milestone does not add a database table or migration.

## Backend

New Control API routes:

```text
GET    /api/v1/storage/settings
POST   /api/v1/storage/ensure-bucket
GET    /api/v1/storage/objects
POST   /api/v1/storage/objects
DELETE /api/v1/storage/objects?key=<relative_key>
GET    /api/v1/storage/objects/download-url?key=<relative_key>
```

Behavior:

1. Storage settings return the MinIO endpoint, console URL, bucket, region, masked access key, path-style flag, connection status, and bucket status.
2. Bucket initialization verifies or creates `aiaget-files`.
3. File listing is scoped to the authenticated user's tenant prefix.
4. Upload stores files under `tenants/<tenant_id>/<folder>/<file_name>`.
5. Download uses a short-lived signed URL.
6. Delete is routed through the Control API and tenant prefix handling.

Permissions:

```text
storage.read
storage.write
```

## Frontend

Route:

```text
/storage
```

The page adds:

1. Storage settings card with connection status, endpoint, console URL, bucket, region, masked access key, and path-style mode.
2. Bucket initialization action.
3. Summary metrics for object count, capacity, bucket status, and connection status.
4. JSON/base64 MVP upload flow with a 25MB API upload limit.
5. File table with keyword search and prefix filtering.
6. Object detail panel with copy path, download, and delete confirmation.

All visible UI copy is Chinese.

## Reference Design

Reference-first frontend artifacts:

```text
images/frontend-reference-design/m24-minio-storage-center/
```

Browser verification screenshot:

```text
tmp/m24-minio-storage-center.png
```

## Validation

Completed checks:

```text
pnpm --filter @aiaget/control-api typecheck
pnpm --filter @aiaget/web typecheck
pnpm lint
```

Remote MinIO smoke test completed:

```text
upload -> list -> signed download URL -> delete
```

Smoke object:

```text
smoke-tests/m24-minio-smoke.txt
```
