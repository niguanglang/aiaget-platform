# M45 System Settings Center

M45 adds a real tenant-scoped system parameter center to `/settings`.

## Scope

- New `system_setting` table for tenant-level parameters.
- New permission code:
  - `system:settings:view`
  - `system:settings:manage`
- New Control API module:
  - `GET /api/v1/system-settings/overview`
  - `GET /api/v1/system-settings`
  - `PATCH /api/v1/system-settings/:id`
  - `POST /api/v1/system-settings/:id/reset`
- `/settings` now includes a system parameter dashboard above the existing tenant, API key, role and user management areas.

## Default Categories

```text
GENERAL        基础
SECURITY       安全
RUNTIME        运行时
OBSERVABILITY  观测
RETENTION      数据保留
INTEGRATION    外部集成
```

## Default Parameters

```text
default_locale
workspace_name
session_timeout_minutes
api_key_ip_allowlist_required
runtime_stream_enabled
runtime_default_temperature
trace_sample_rate
monitor_error_alert_enabled
audit_retention_days
conversation_retention_days
external_webhook_url
minio_public_base_url
```

## Notes

- Each table and column added by this milestone has SQL comments in the migration.
- The page supports loading, empty, error, read-only, validation, save success and reset confirmation states.
- This milestone does not apply the database migration automatically. Run Prisma migration against the target PostgreSQL only after review.
