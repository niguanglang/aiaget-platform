# Product UI Design Image Prompt

Create a high-fidelity product UI design image for the following real frontend page.

Project context:
- Product/module: AIAget production readiness center
- Page/route: 生产落地中心 at `/settings/production-readiness`
- Target users/roles: tenant administrators, release owners, observability owners; manual acceptance requires tenant admin or `system:settings:manage`
- Business goal: allow production release owners to see observability trace quality evidence prompts directly inside release validation before accepting production readiness
- Existing frontend stack/design system: Next.js React admin UI, Tailwind utility classes, existing `Card`, `Button`, `Input`, `MetricCard`, `StatusBadge`, `EmptyState`, lucide icons
- Existing page shell/layout: keep current two-column layout with left checklist group anchors and right grouped checklist cards; compact SaaS/admin density

Interface contract that must appear in the UI:
- API/service functions: `getProductionReadinessOverview()`, `acceptProductionReadinessCheck(checkId, { note })`
- Main entities and fields: `ProductionReadinessOverview.summary`, `ProductionReadinessCategoryOverview.items`, `ProductionReadinessCheckItem.title`, `description`, `status`, `severity`, `owner`, `evidence`, `evidence_summary`, `observability_signal`, `acceptance`
- Status values/enums: `READY`, `WARNING`, `BLOCKED`, `MANUAL`; severity `LOW`, `MEDIUM`, `HIGH`
- User actions: open `/monitor/observability`, refresh overview, type acceptance note, submit acceptance
- Required states: loading checklist, load error, no acceptance record, disabled acceptance when permission is missing, submitting state, successful refresh

Design requirements:
- Make it look like a production SaaS/admin product, not a marketing page.
- Preserve the existing production readiness layout and visual hierarchy.
- Show a release validation checklist card titled "可观测性 Trace 质量证据".
- Inside that card, include a restrained evidence panel titled "可观测性证据" with four compact signal rows or chips: "Trace 覆盖率", "孤立事件", "错误链路", "慢链路".
- The evidence panel should read as operational guidance, not live monitoring charts.
- Include a clear button to "查看可观测性质量" linking to `/monitor/observability`.
- Keep the manual acceptance note input and submit button in the card action column.
- Use realistic Chinese labels and compact spacing suitable for repeated checklist cards.

Avoid:
- Adding a new dashboard layout, chart-heavy redesign, fake live metrics, fake APIs, middleware setup controls, collector startup controls, or unrelated deployment actions.
