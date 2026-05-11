# Component Mapping

| Reference region | Existing component/file | API/type backing it | Notes |
| --- | --- | --- | --- |
| Page shell | `apps/web/src/components/settings/production-readiness-content.tsx` | `/settings/production-readiness` route | Reuse existing header, metric cards, left anchor nav, grouped checklist layout. |
| Checklist data flow | `getProductionReadinessOverview` in `apps/web/src/lib/api-client.ts` | `ProductionReadinessOverview` | No extra monitor request from this page. |
| Release validation item | `ReadinessItemCard` | `ProductionReadinessCheckItem` | Render the same card used by all checklist items. |
| Observability evidence panel | Inline block inside `ReadinessItemCard` | `evidence_summary`, `observability_signal` | Show only when either optional field exists. |
| Evidence chips | Local `TraceEvidencePill` helper | `trace_coverage_label`, `orphan_event_label`, `error_trace_label`, `slow_trace_label` | Compact Chinese labels, wrap on mobile. |
| Monitor deep link | Existing `Button` with `Link` | `action_href: /monitor/observability` | Keeps navigation explicit without embedding monitor overview. |
| Manual acceptance | Existing `Input` and submit `Button` | `acceptProductionReadinessCheck(checkId, { note })` | Preserve permission-disabled and submitting states. |
| Backend checklist source | `apps/control-api/src/system-settings/system-settings.service.ts` | `ProductionReadinessCheckItem[]` | Add one `RELEASE_VALIDATION` item, no collector or middleware side effects. |
