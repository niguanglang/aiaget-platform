# M10 Audit Center

## Scope

M10 adds tenant-scoped audit views that unify login logs and write-operation logs into one searchable review surface.

Implemented contracts:

```text
GET /api/v1/audit/overview
GET /api/v1/audit/events
GET /api/v1/audit/events/:eventId
```

## Sources

M10 does not add new storage tables. It aggregates:

```text
login_log
operation_log
```

## Page Design

The `/audit` page now supports:

1. Summary metrics for login logs, operations, security events, config changes, and success rate.
2. User and module ranking panels.
3. Recent failure panel.
4. Unified audit event table with source, status, user, module, action, request ID, and summary.
5. Selected-event detail side panel with IP, user-agent, path, method, status code, request summary, and error message.

## Architecture Notes

All APIs are tenant-scoped and protected by `audit.read`. The first M10 implementation focuses on login attempts and write operations only. Security events are derived from failed logins and non-successful write operations. Configuration changes are inferred from write operations against configuration-heavy modules rather than a separate diff store.
