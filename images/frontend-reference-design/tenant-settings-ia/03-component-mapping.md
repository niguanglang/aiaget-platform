# Component Mapping

## Shared UI

- Page shell: existing console route pages under `apps/web/src/app/(console)`.
- Containers: `Card`, unframed `main` sections, responsive grids.
- Actions: `Button` with `lucide-react` icons.
- Feedback: `StatusBadge`, `MetricCard`, `EmptyState`, inline error/success panels.
- Navigation: `next/link` for canonical route jumps and `next/navigation` for edit/save redirects.

## Tenants

- `/tenants/page.tsx` renders `TenantsContent`.
- `TenantsContent` owns `listTenants`, search/status filters, metrics, and links to `/tenants/{id}` and `/tenants/{id}/edit`.
- `/tenants/[id]/page.tsx` renders `TenantDetailContent`, which owns `getTenant` and read-only detail.
- `/tenants/[id]/edit/page.tsx` renders `TenantEditContent`, which owns `getTenant`, form validation, `updateTenant`, and post-save navigation.

## Settings

- `/settings/page.tsx` renders `SettingsContent`.
- `SettingsContent` owns overview/category/status/list/update/reset and basic configuration entry links. It must not own notification-policy audit, snapshots, rollback, or approval-submitted workflow state.
- `/settings/notification-policy/page.tsx` renders `NotificationPolicyContent`, which owns NOTIFICATION category settings, impact preview, save/reset, and audit overview.
- `/settings/notification-policy/snapshots/page.tsx` renders `NotificationPolicySnapshotsContent`, which owns snapshot list, rollback confirmation, and rollback mutation.
- `/system/settings/page.tsx` redirects to `/settings` for legacy compatibility.

## Menu Contract

- `apps/control-api/prisma/seed.ts` keeps only `path: '/tenants'` and `path: '/settings'` for these areas.
- Detail/edit/sub-configuration routes are route-level pages, not dynamic menu seed entries.
