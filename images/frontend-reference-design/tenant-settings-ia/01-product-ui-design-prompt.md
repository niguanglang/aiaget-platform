# Product UI Design Prompt

Design a high-fidelity Chinese SaaS admin console interface for tenant management and system settings IA cleanup. The visual style is restrained, dense, operational, and consistent with a modern Next.js enterprise console using cards, tables, status badges, icon buttons, and compact forms.

Show multiple screens as a cohesive product design board:

1. `/tenants` tenant list page with metric cards, search, status filter, a table of tenants, current tenant indicator, detail and edit action links.
2. `/tenants/[id]` tenant detail page with read-only profile rows, status, timestamps, governance notes, back link, edit link.
3. `/tenants/[id]/edit` tenant edit page with name/status fields, validation message area, save/cancel actions, permission disabled state.
4. `/settings` system parameter list page with overview metrics, category filter, status filter, compact setting rows, save/reset controls, and entry cards for tenant/user/role/security configuration.
5. `/settings/notification-policy` notification policy page with notification category settings, impact preview, audit summary, recent changes.
6. `/settings/notification-policy/snapshots` snapshot page with version cards/table, approval reserved badge, rollback action, rollback confirmation state.

Use Chinese labels. Avoid marketing hero layout, decorative blobs, oversized typography, and nested cards. Keep route separation obvious through breadcrumbs/tabs and page titles. Use neutral backgrounds, clear hierarchy, table-first information architecture, and compact controls for repeated admin work.
