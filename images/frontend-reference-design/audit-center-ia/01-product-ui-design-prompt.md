# Product UI Design Image Prompt

Create a high-fidelity product UI design image for a real enterprise SaaS console audit center.

Project context:
- Product/module: AIAget Console Audit Center IA
- Page/routes: `/audit` list/overview, with navigation to `/audit/events/[id]` event detail
- Target users/roles: security admin, auditor, platform operator, tenant admin with audit permission
- Business goal: scan unified audit volume, find failures, preserve query-linked investigations, and open focused event detail pages for request and Trace context
- Frontend stack/design system: Next.js App Router, Tailwind CSS, shadcn-style Button/Card/Input/EmptyState/MetricCard/StatusBadge, React Query, lucide icons, Chinese UI
- Existing page shell/layout: console content area, max-width operational dashboard, subtle audit background component, compact enterprise density

Interface contract that must appear in the UI:
- API/service functions: `getAuditOverview`, `listAuditEvents`, `getApprovalAuditOverview`; detail page uses `getAuditEvent`
- Main list fields: time, source, status, user email, module, action, request ID, title, summary, detail link
- Overview fields: login total, operation total, security event total, config change total, success rate, high-frequency users, high-frequency modules, recent failures
- Detail fields shown in separate route concept: title, status, source, user, occurred time, module, action, request ID, IP, user agent, path, method, status code, error message, request summary JSON
- Status/source values: `SUCCESS`, `DEGRADED`, `FAILED`; `login`, `operation`, `approval_audit`; windows `24h`, `7d`
- User actions: refresh, search, filter window/source/status, clear filters, open detail link, jump to approval audit risk area
- Required states: loading, empty, error, disabled refresh, no failure samples, detail loading/error/no payload

Design requirements:
- Show the `/audit` list page as the primary image: top title "审计中心", summary metrics, failure/ranking cards, filter toolbar, and event table.
- Make it clear that event detail is opened by route navigation through a row button labeled "查看详情"; do not show an inline detail drawer or side panel inside the list page.
- Include a small contextual hint that `/audit?keyword=...` and `/audit?window=...` filters are active when present.
- Use a production SaaS/admin aesthetic: restrained borders, compact controls, readable table, Chinese labels, clear status badges.
- Include realistic loading/empty/error affordances as small states in table/failure regions where natural.
- Keep colors balanced and operational, not one-note purple/blue or marketing-like.

Avoid:
- Inline event detail panel on the list page
- Invented backend fields, unrelated charts, decorative hero composition, large marketing cards, nested cards
- Unreadably small table text or unimplemented actions
