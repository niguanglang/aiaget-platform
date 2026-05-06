# Product Prototype Prompt

Create a mid-fidelity wireframe prototype for a Chinese enterprise console IA refactor. Focus on route boundaries and workflow placement rather than decoration.

Prototype routes:

- `/tenants`: header, four metric summaries, search/filter toolbar, tenants table, row actions linking to detail and edit. No inline detail panel, no edit drawer.
- `/tenants/[id]`: breadcrumb back to tenant list, tenant profile details, governance panel, edit button linking to `/tenants/{id}/edit`.
- `/tenants/[id]/edit`: breadcrumb, form fields for tenant name and status, read-only tenant code/id context, save/cancel buttons, permission disabled note.
- `/settings`: overview metrics, configuration entry grid, category/status filters, system setting list with simple value editor, save/reset actions. Exclude notification-policy audit, snapshots, rollback and approval workflow states.
- `/settings/notification-policy`: notification settings list, impact preview controls, audit summary and recent audit changes, link to snapshots.
- `/settings/notification-policy/snapshots`: snapshot summary, snapshot table/cards, rollback buttons, confirmation modal.

Annotate that dynamic menu only contains `/tenants` and `/settings`, while detail/edit/sub-configuration pages are reached from in-page links. Use Chinese UI text and compact admin layout.
